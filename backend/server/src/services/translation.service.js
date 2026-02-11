const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require('axios'); // Ensure axios is installed or use fetch

class TranslationService {

  // Fetch all translations for a language
  async getTranslations(langCode) {
    const translations = await prisma.uiTranslation.findMany({
      where: { langCode }
    });

    // Convert to nested object: { common: { addToCart: "Add to Cart" } }
    return translations.reduce((acc, t) => {
      if (!acc[t.namespace]) acc[t.namespace] = {};
      acc[t.namespace][t.key] = t.value;
      return acc;
    }, {});
  }

  // Auto-translate using AI
  async autoTranslateLanguage(targetLangCode) {
    console.log(`Starting auto-translation for ${targetLangCode}...`);

    // 1. Get source (English) translations
    const sourceTranslations = await prisma.uiTranslation.findMany({
      where: { langCode: 'en' }
    });

    if (sourceTranslations.length === 0) {
        console.log("No source translations found in 'en'.");
        return;
    }

    // 2. Get target language details
    const targetLanguage = await prisma.language.findUnique({
      where: { code: targetLangCode }
    });

    if (!targetLanguage) {
        console.error(`Target language ${targetLangCode} not found.`);
        return;
    }

    // 3. Identify missing translations
    const existingTranslations = await prisma.uiTranslation.findMany({
        where: { langCode: targetLangCode }
    });

    const existingKeys = new Set(existingTranslations.map(t => `${t.namespace}.${t.key}`));
    const missingTranslations = sourceTranslations.filter(t => !existingKeys.has(`${t.namespace}.${t.key}`));

    if (missingTranslations.length === 0) {
        console.log(`No missing translations for ${targetLangCode}.`);
        return;
    }

    console.log(`Found ${missingTranslations.length} missing translations for ${targetLangCode}. Translating...`);

    // 4. Batch translate
    const batchSize = 20; // Smaller batch for safety
    for (let i = 0; i < missingTranslations.length; i += batchSize) {
      const batch = missingTranslations.slice(i, i + batchSize);

      const textsToTranslate = batch.map(t => ({
        key: `${t.namespace}.${t.key}`,
        text: t.value
      }));

      try {
          const translated = await this.translateWithAI(
            textsToTranslate,
            targetLanguage.name
          );

          // Save to DB
          await prisma.$transaction(
            translated.map(item => {
              const [namespace, key] = item.key.split('.');
              return prisma.uiTranslation.create({
                data: {
                  langCode: targetLangCode,
                  namespace,
                  key,
                  value: item.translated,
                  isAutoTranslated: true
                }
              });
            })
          );
          console.log(`Translated batch ${i / batchSize + 1}`);
      } catch (error) {
          console.error(`Error translating batch ${i}:`, error.message);
      }
    }

    console.log(`Auto-translation for ${targetLangCode} completed.`);
  }

  async translateWithAI(texts, targetLanguageName) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not found");

    const prompt = `Translate the following UI labels to ${targetLanguageName}.
    Return ONLY a JSON array with key and translated text.
    Do not translate technical keys or placeholders like {{name}}.
    Keep it short and natural for e-commerce.

    Input: ${JSON.stringify(texts)}

    Output Format: [{"key": "ns.key", "translated": "text"}]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini', // or gpt-3.5-turbo
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        })
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0]) throw new Error("Invalid AI response");

    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Handle slightly different AI wrapper (sometimes it returns { translations: [] } or just [])
    return Array.isArray(parsed) ? parsed : (parsed.translations || []);
  }
}

module.exports = new TranslationService();
