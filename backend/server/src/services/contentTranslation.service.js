const { PrismaClient } = require("@prisma/client");
const prisma = require('../config/prisma');

class ContentTranslationService {

  /**
   * Auto-translate Category content
   */
  async autoTranslateCategory(categoryId, targetLangCode, forceUpdate = false) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { translations: true }
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Check if translation already exists
    const existing = category.translations.find(t => t.langCode === targetLangCode);
    if (existing && !forceUpdate) {
      console.log(`Translation for ${targetLangCode} already exists`);
      return existing;
    }

    // Get target language
    const targetLanguage = await prisma.language.findUnique({
      where: { code: targetLangCode }
    });

    if (!targetLanguage) {
      throw new Error(`Language ${targetLangCode} not found`);
    }

    // Translate using AI
    const translated = await this.translateWithAI(
      [
        { key: 'name', text: category.name },
        { key: 'description', text: category.description || '' }
      ],
      targetLanguage.name
    );

    // Create or update translation
    let translation;
    if (existing) {
        translation = await prisma.categoryTranslation.update({
            where: { id: existing.id },
            data: {
                name: translated.find(t => t.key === 'name')?.translated || category.name,
                description: translated.find(t => t.key === 'description')?.translated || category.description,
                isAutoTranslated: true
            }
        });
    } else {
        translation = await prisma.categoryTranslation.create({
          data: {
            categoryId: category.id,
            langCode: targetLangCode,
            name: translated.find(t => t.key === 'name')?.translated || category.name,
            description: translated.find(t => t.key === 'description')?.translated || category.description,
            isAutoTranslated: true
          }
        });
    }

    return translation;
  }

  /**
   * Auto-translate Product content
   */
  async autoTranslateProduct(productId, targetLangCode, forceUpdate = false) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { translations: true }
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if translation already exists
    const existing = product.translations.find(t => t.langCode === targetLangCode);
    if (existing && !forceUpdate) {
      console.log(`Translation for ${targetLangCode} already exists`);
      return existing;
    }

    // Get target language
    const targetLanguage = await prisma.language.findUnique({
      where: { code: targetLangCode }
    });

    if (!targetLanguage) {
      throw new Error(`Language ${targetLangCode} not found`);
    }

    // Translate using AI
    const translated = await this.translateWithAI(
      [
        { key: 'name', text: product.name },
        { key: 'description', text: product.description || '' }
      ],
      targetLanguage.name
    );

    // Create or update translation
    let translation;
    if (existing) {
        translation = await prisma.productTranslation.update({
            where: { id: existing.id },
            data: {
                name: translated.find(t => t.key === 'name')?.translated || product.name,
                description: translated.find(t => t.key === 'description')?.translated || product.description,
                isAutoTranslated: true
            }
        });
    } else {
        translation = await prisma.productTranslation.create({
          data: {
            productId: product.id,
            langCode: targetLangCode,
            name: translated.find(t => t.key === 'name')?.translated || product.name,
            description: translated.find(t => t.key === 'description')?.translated || product.description,
            isAutoTranslated: true
          }
        });
    }

    return translation;
  }

  /**
   * Auto-translate HeroSlide content
   */
  async autoTranslateHeroSlide(heroSlideId, targetLangCode, forceUpdate = false) {
    const heroSlide = await prisma.heroSlide.findUnique({
      where: { id: heroSlideId },
      include: { translations: true }
    });

    if (!heroSlide) {
      throw new Error("HeroSlide not found");
    }

    // Check if translation already exists
    const existing = heroSlide.translations.find(t => t.langCode === targetLangCode);
    if (existing && !forceUpdate) {
      console.log(`Translation for ${targetLangCode} already exists`);
      return existing;
    }

    // Get target language
    const targetLanguage = await prisma.language.findUnique({
      where: { code: targetLangCode }
    });

    if (!targetLanguage) {
      throw new Error(`Language ${targetLangCode} not found`);
    }

    // Translate using AI
    const textsToTranslate = [];
    if (heroSlide.title) textsToTranslate.push({ key: 'title', text: heroSlide.title });
    if (heroSlide.subtitle) textsToTranslate.push({ key: 'subtitle', text: heroSlide.subtitle });

    if (textsToTranslate.length === 0) {
      console.log("No text to translate");
      return null;
    }

    const translated = await this.translateWithAI(textsToTranslate, targetLanguage.name);

    // Create or update translation
    let translation;
    if (existing) {
        translation = await prisma.heroSlideTranslation.update({
            where: { id: existing.id },
            data: {
                title: translated.find(t => t.key === 'title')?.translated || heroSlide.title,
                subtitle: translated.find(t => t.key === 'subtitle')?.translated || heroSlide.subtitle,
                isAutoTranslated: true
            }
        });
    } else {
        translation = await prisma.heroSlideTranslation.create({
          data: {
            heroSlideId: heroSlide.id,
            langCode: targetLangCode,
            title: translated.find(t => t.key === 'title')?.translated || heroSlide.title,
            subtitle: translated.find(t => t.key === 'subtitle')?.translated || heroSlide.subtitle,
            isAutoTranslated: true
          }
        });
    }

    return translation;
  }

  /**
   * Translate text using AI (Groq, Grok, or OpenAI)
   */
  async translateWithAI(texts, targetLanguageName) {
    const groqApiKey = process.env.GROQ_API_KEY;
    const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!groqApiKey && !grokApiKey && !openaiApiKey) {
      throw new Error("No AI API keys found (GROQ_API_KEY, GROK_API_KEY, or OPENAI_API_KEY)");
    }

    const prompt = `Translate the following e-commerce content to ${targetLanguageName}.
    Return ONLY a JSON array with key and translated text.
    Keep it natural and suitable for e-commerce.

    Input: ${JSON.stringify(texts)}

    Output Format: [{"key": "name", "translated": "text"}]`;

    let apiUrl, apiKey, model;

    if (groqApiKey) {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      apiKey = groqApiKey;
      model = 'llama-3.3-70b-versatile';
      console.log('Using Groq API for translation');
    } else if (grokApiKey) {
      apiUrl = 'https://api.x.ai/v1/chat/completions';
      apiKey = grokApiKey;
      model = 'grok-beta';
      console.log('Using Grok API for translation');
    } else {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = openaiApiKey;
      model = 'gpt-4o-mini';
      console.log('Using OpenAI API for translation');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', data);
      throw new Error(`API request failed: ${data.error?.message || 'Unknown error'}`);
    }

    if (!data.choices || !data.choices[0]) {
      throw new Error("Invalid API response");
    }

    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return Array.isArray(parsed) ? parsed : (parsed.translations || []);
  }

  /**
   * Auto-translate all content for a language
   */
  async autoTranslateAllContent(targetLangCode) {
    console.log(`Starting auto-translation for ${targetLangCode}...`);

    // Translate all categories
    const categories = await prisma.category.findMany();
    for (const category of categories) {
      try {
        await this.autoTranslateCategory(category.id, targetLangCode);
        console.log(`Translated category: ${category.name}`);
      } catch (error) {
        console.error(`Error translating category ${category.id}:`, error.message);
      }
    }

    // Translate all products
    const products = await prisma.product.findMany();
    for (const product of products) {
      try {
        await this.autoTranslateProduct(product.id, targetLangCode);
        console.log(`Translated product: ${product.name}`);
      } catch (error) {
        console.error(`Error translating product ${product.id}:`, error.message);
      }
    }

    // Translate all hero slides
    const heroSlides = await prisma.heroSlide.findMany();
    for (const heroSlide of heroSlides) {
      try {
        await this.autoTranslateHeroSlide(heroSlide.id, targetLangCode);
        console.log(`Translated hero slide: ${heroSlide.id}`);
      } catch (error) {
        console.error(`Error translating hero slide ${heroSlide.id}:`, error.message);
      }
    }

    console.log(`Auto-translation for ${targetLangCode} completed.`);
  }

  /**
   * Auto-translate a specific category into all active languages
   */
  async autoTranslateCategoryForAll(categoryId, forceUpdate = false) {
    const languages = await prisma.language.findMany({
      where: { isActive: true, code: { not: 'en' } }
    });
    for (const lang of languages) {
      try {
        await this.autoTranslateCategory(categoryId, lang.code, forceUpdate);
      } catch (error) {
        console.error(`Error translating category ${categoryId} to ${lang.code}:`, error.message);
      }
    }
  }

  /**
   * Auto-translate a specific product into all active languages
   */
  async autoTranslateProductForAll(productId, forceUpdate = false) {
    const languages = await prisma.language.findMany({
      where: { isActive: true, code: { not: 'en' } }
    });
    for (const lang of languages) {
      try {
        await this.autoTranslateProduct(productId, lang.code, forceUpdate);
      } catch (error) {
        console.error(`Error translating product ${productId} to ${lang.code}:`, error.message);
      }
    }
  }

  /**
   * Auto-translate a specific hero slide into all active languages
   */
  async autoTranslateHeroSlideForAll(heroSlideId, forceUpdate = false) {
    const languages = await prisma.language.findMany({
      where: { isActive: true, code: { not: 'en' } }
    });
    for (const lang of languages) {
      try {
        await this.autoTranslateHeroSlide(heroSlideId, lang.code, forceUpdate);
      } catch (error) {
        console.error(`Error translating hero slide ${heroSlideId} to ${lang.code}:`, error.message);
      }
    }
  }
}

module.exports = new ContentTranslationService();
