const prisma = require('../config/prisma');

class GroqCustomerAI {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.3-70b-versatile';
  }

  /**
   * Get relevant context from database
   */
  async getRelevantContext(query, language = 'en') {
    // Search products
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        status: 'PUBLISHED',
      },
      take: 5,
      include: {
        category: true,
      },
    });

    // Search knowledge base
    const knowledge = await prisma.knowledgeBase.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
        language,
        isActive: true,
      },
      take: 3,
    });

    return { products, knowledge };
  }

  /**
   * Build system prompt with e-commerce context
   */
  buildSystemPrompt(context, language) {
    const languageInstructions = {
      en: 'Respond in English',
      bn: 'বাংলায় উত্তর দিন। Natural বাংলা ব্যবহার করুন।',
      hi: 'हिंदी में जवाब दें',
      es: 'Responde en español',
      fr: 'Répondez en français',
    };

    let prompt = `You are a helpful e-commerce assistant for our online store.

${languageInstructions[language] || "Respond in the user's language"}.

IMPORTANT: Be conversational, friendly, and helpful. Keep responses concise (2-3 sentences usually).

Current context:
`;

    // Add products
    if (context.products.length > 0) {
      prompt += `\n\nAvailable Products:\n`;
      context.products.forEach((p) => {
        prompt += `- ${p.name} (${p.category?.name || 'Uncategorized'}): ${p.price || p.sellingPrice || 'N/A'} BDT
  ${p.description?.substring(0, 100)}...
  Stock: ${p.stock > 0 ? 'Available' : 'Out of Stock'}\n`;
      });
    }

    // Add knowledge
    if (context.knowledge.length > 0) {
      prompt += `\n\nStore Information:\n`;
      context.knowledge.forEach((k) => {
        prompt += `- ${k.title}: ${k.content.substring(0, 150)}...\n`;
      });
    }

    prompt += `\n\nGuidelines:
- Be warm and friendly
- Provide accurate product information
- Help with order tracking (ask for order ID if needed)
- Answer questions about shipping, returns, policies
- Suggest relevant products when appropriate
- If you don't know something, admit it politely
- Keep responses short and clear
- Use emojis occasionally for friendliness`;

    return prompt;
  }

  /**
   * Chat with Groq AI
   */
  async chat(message, sessionId, language = 'en', userId = null) {
    try {
      // Get conversation history
      const history = await prisma.chatMessage.findMany({
        where: {
          sessionId,
          type: 'CUSTOMER',
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      // Get context
      const context = await this.getRelevantContext(message, language);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(context, language);

      // Build messages array with conversation history
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({
          role: h.role === 'USER' ? 'user' : 'assistant',
          content: h.content,
        })),
        { role: 'user', content: message },
      ];

      // Call Groq API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Groq API Error:', data);
        throw new Error(data.error?.message || 'Failed to get response from AI');
      }

      const aiResponse =
        data.choices?.[0]?.message?.content ||
        "I'm sorry, I couldn't process that question right now.";

      // Save to database
      await prisma.chatMessage.createMany({
        data: [
          {
            sessionId,
            role: 'USER',
            content: message,
            type: 'CUSTOMER',
            userId,
            metadata: { language },
          },
          {
            sessionId,
            role: 'ASSISTANT',
            content: aiResponse,
            type: 'CUSTOMER',
            metadata: {
              language,
              context: {
                productsFound: context.products.length,
                knowledgeUsed: context.knowledge.length,
              },
            },
          },
        ],
      });

      return {
        response: aiResponse,
        context: {
          products: context.products.slice(0, 3),
          relatedArticles: context.knowledge,
        },
      };
    } catch (error) {
      console.error('Groq chat error:', error);
      throw error;
    }
  }

  /**
   * Track order with AI
   */
  async trackOrder(orderId, sessionId, language = 'en') {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Fallback: try searching by orderNumber if not found by ID
      let targetOrder = order;
      if (!targetOrder) {
        targetOrder = await prisma.order.findUnique({
          where: { orderNumber: orderId },
          include: {
            items: {
              include: { product: true },
            },
          },
        });
      }

      if (!targetOrder) {
        return {
          found: false,
          message:
            language === 'bn'
              ? 'দুঃখিত, এই অর্ডার আইডি পাওয়া যায়নি। অনুগ্রহ করে আবার চেক করুন।'
              : 'Order not found. Please check the order ID.',
        };
      }

      // Generate status update with Groq
      const statusMap = {
        en: {
          PENDING: 'pending',
          PROCESSING: 'being processed',
          SHIPPED: 'shipped',
          DELIVERED: 'delivered',
          CANCELLED: 'cancelled',
        },
        bn: {
          PENDING: 'অপেক্ষমান',
          PROCESSING: 'প্রসেস হচ্ছে',
          SHIPPED: 'পাঠানো হয়েছে',
          DELIVERED: 'ডেলিভার হয়েছে',
          CANCELLED: 'বাতিল',
        },
      };

      const prompt =
        language === 'bn'
          ? `একজন গ্রাহক তার অর্ডার ট্র্যাক করতে চাইছে। বন্ধুত্বপূর্ণ ভাষায় তাকে জানাও:

অর্ডার আইডি: ${targetOrder.orderNumber || targetOrder.id}
স্ট্যাটাস: ${statusMap.bn[targetOrder.status] || targetOrder.status}
মোট মূল্য: ${targetOrder.total} টাকা
অর্ডার করা হয়েছে: ${new Date(targetOrder.createdAt).toLocaleDateString('bn-BD')}

২-৩ লাইনে বর্তমান স্ট্যাটাস এবং পরবর্তী কি হবে তা জানাও।`
          : `A customer is tracking their order. Provide a friendly update:

Order ID: ${targetOrder.orderNumber || targetOrder.id}
Status: ${statusMap.en[targetOrder.status] || targetOrder.status}
Total: ${targetOrder.total} BDT
Placed on: ${new Date(targetOrder.createdAt).toLocaleDateString()}

Give a 2-3 sentence update about the current status and what happens next.`;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content || 'Your order is being processed.';

      return {
        found: true,
        order: targetOrder,
        message: aiMessage,
      };
    } catch (error) {
      console.error('Order tracking error:', error);
      throw error;
    }
  }
}

module.exports = new GroqCustomerAI();
