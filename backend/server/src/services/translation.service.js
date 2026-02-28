const prisma = require('../config/prisma');

class TranslationService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'llama-3.3-70b-versatile'; // Fast and capable enough for translation
    }

    /**
     * Translate text to multiple languages
     * @param {string} text - The text to translate
     * @param {string[]} targetLangs - Array of language codes (e.g., ['bn', 'es'])
     * @param {string} context - Optional context (e.g., "Product Name", "Product Description")
     * @returns {Promise<Object>} - Object with language codes as keys and translated text as values
     */
    async translate(text, targetLangs, context = '') {
        try {
            if (!text || !targetLangs || targetLangs.length === 0) {
                return {};
            }

            const prompt = `You are a professional software localization expert specialized in premium e-commerce (like Apple, Shopify, or Farfetch).
Translate the following "${context || 'UI text'}" into these languages: ${targetLangs.join(', ')}.

Input Text: "${text}"

RULES:
1. ACCURACY FIRST: Translate the literal meaning of the text. Do NOT add information or assume context that isn't there. If the text is "How are you?", translate ONLY "How are you?" in the target languages.
2. NATURAL PHRASING: Use terms that sound natural and premium to a native speaker. Avoid robotic/literal translations.
3. E-COMMERCE CONTEXT: ONLY IF the text is retail-related (e.g., "Cart", "Order"), use "Mahbub Shop" appropriate terminology.
4. BENGALI SPECIAL RULES:
   - Use "ব্যাগ" for "Cart".
   - Use "চেকআউট" for "Checkout".
   - Use polite and professional language (চলিত ভাষা).
5. BRANDING: Keep "Mahbub Shop" in English if mentioned, unless translating the brand name is explicitly better.
6. NO HALLUCINATION: If "How are you?" is given, do NOT translate it as "Welcome to the shop" or "How is your cart?".

Return ONLY a valid JSON object. No explanations.
Example: { "bn": "...", "es": "..." }`;

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: 'You are a helpful JSON translator.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3, // Lower temperature for more deterministic output
                    response_format: { type: "json_object" } // Force JSON mode
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Groq Translation Error:', data);
                throw new Error(data.error?.message || 'Translation failed');
            }

            const content = data.choices?.[0]?.message?.content;

            try {
                const parsed = JSON.parse(content);
                // Harden: Ensure all values are strings, not objects (fixes [object Object])
                const hardened = {};
                for (const [lang, val] of Object.entries(parsed)) {
                    if (typeof val === 'object' && val !== null) {
                        // If AI nested it like { "bn": { "text": "..." } }, try to find a string property
                        hardened[lang] = val.text || val.value || val.translation || Object.values(val).find(v => typeof v === 'string') || JSON.stringify(val);
                    } else {
                        hardened[lang] = String(val);
                    }
                }
                return hardened;
            } catch (parseError) {
                console.error('Failed to parse translation JSON:', content);
                const match = content.match(/\{[\s\S]*\}/);
                if (match) return JSON.parse(match[0]);
                throw new Error('Invalid translation response format');
            }

        } catch (error) {
            console.error('Translation Service Error:', error);
            throw error;
        }
    }

    /**
     * Get translations for a language
     * @param {string} langCode
     * @returns {Promise<Object>}
     */
    async getTranslations(langCode) {
        const translations = await prisma.uiTranslation.findMany({
            where: { langCode }
        });

        const result = {};
        translations.forEach(t => {
            if (!result[t.namespace]) result[t.namespace] = {};
            result[t.namespace][t.key] = t.value;
        });

        return result;
    }

    /**
     * Auto translate translations for a new language
     * @param {string} targetLangCode
     */
    async autoTranslateLanguage(targetLangCode) {
        // 1. Get base translations (en)
        const baseTranslations = await prisma.uiTranslation.findMany({
            where: { langCode: 'en' } // Assuming 'en' is base
        });

        if (baseTranslations.length === 0) return;

        // 2. Group by namespace for context
        const byNamespace = {};
        baseTranslations.forEach(t => {
            if (!byNamespace[t.namespace]) byNamespace[t.namespace] = {};
            byNamespace[t.namespace][t.key] = t.value;
        });

        // 3. Translate and save
        for (const [namespace, texts] of Object.entries(byNamespace)) {
             // Translate object values
             const translatedMap = await this.translate(JSON.stringify(texts), [targetLangCode], `UI Strings for ${namespace}`);
             const translatedTexts = translatedMap[targetLangCode] || {};

             if (typeof translatedTexts === 'object') {
                 for (const [key, value] of Object.entries(translatedTexts)) {
                     // Save to DB
                     await prisma.uiTranslation.upsert({
                         where: {
                             langCode_namespace_key: {
                                 langCode: targetLangCode,
                                 namespace,
                                 key
                             }
                         },
                         update: { value: String(value) },
                         create: {
                             langCode: targetLangCode,
                             namespace,
                             key,
                             value: String(value),
                             isReviewed: false
                         }
                     });
                 }
             }
        }
    }

    /**
     * Add a key to all languages (with auto-translation)
     * @param {string} namespace
     * @param {string} key
     * @param {string} value (English value)
     */
    async addKey(namespace, key, value) {
        // 1. Save Base (EN)
        await prisma.uiTranslation.upsert({
            where: {
                langCode_namespace_key: { langCode: 'en', namespace, key }
            },
            update: { value },
            create: { langCode: 'en', namespace, key, value, isReviewed: true }
        });

        // 2. Get other active languages
        const languages = await prisma.language.findMany({
            where: { isActive: true, code: { not: 'en' } }
        });

        if (languages.length === 0) return;

        const targetCodes = languages.map(l => l.code);

        // 3. Translate
        const translations = await this.translate(value, targetCodes, `UI Label: ${namespace}.${key}`);

        // 4. Save Translations
        for (const [code, translatedValue] of Object.entries(translations)) {
             await prisma.uiTranslation.upsert({
                where: {
                    langCode_namespace_key: { langCode: code, namespace, key }
                },
                update: { value: String(translatedValue) }, // Only update if explicitly re-adding
                create: {
                    langCode: code,
                    namespace,
                    key,
                    value: String(translatedValue),
                    isReviewed: false // Needs review since it's AI
                }
            });
        }
    }

    /**
     * Translate only missing keys for all active languages in a namespace
     * @param {string} namespace
     */
    async translateMissingKeys(namespace) {
        // 1. Get all languages
        const languages = await prisma.language.findMany({ where: { isActive: true } });
        const langCodes = languages.map(l => l.code);

        // 2. Get base records (EN) for this namespace
        const baseRecords = await prisma.uiTranslation.findMany({
            where: { langCode: 'en', namespace }
        });

        const results = { updated: 0, errors: [] };

        for (const record of baseRecords) {
            // Find which languages are missing OR have empty values for this key
            const existingEntries = await prisma.uiTranslation.findMany({
                where: { namespace, key: record.key, langCode: { in: langCodes } }
            });

            // A language is "missing" if no record exists OR the value is empty/whitespace
            const missingCodes = langCodes.filter(code => {
                const entry = existingEntries.find(e => e.langCode === code);
                return !entry || !entry.value || entry.value.trim() === "";
            });

            if (missingCodes.length > 0) {
                try {
                    const translations = await this.translate(record.value, missingCodes, `Namespace: ${namespace}`);
                    for (const [code, val] of Object.entries(translations)) {
                        await prisma.uiTranslation.upsert({
                            where: {
                                langCode_namespace_key: {
                                    langCode: code,
                                    namespace,
                                    key: record.key
                                }
                            },
                            update: {
                                value: String(val),
                                isReviewed: false
                            },
                            create: {
                                langCode: code,
                                namespace,
                                key: record.key,
                                value: String(val),
                                isReviewed: false
                            }
                        });
                        results.updated++;
                    }
                } catch (e) {
                    results.errors.push(`${record.key}: ${e.message}`);
                }
            }
        }
        return results;
    }

    async resetNamespaceTranslations(namespace) {
        // 1. Delete all non-English translations for this namespace
        await prisma.uiTranslation.deleteMany({
            where: {
                namespace,
                langCode: { not: 'en' }
            }
        });

        // 2. Trigger bulk translation for missing keys
        return await this.translateMissingKeys(namespace);
    }

    /**
     * Delete a key from all languages
     * @param {string} namespace
     * @param {string} key
     */
    async deleteKey(namespace, key) {
        await prisma.uiTranslation.deleteMany({
            where: { namespace, key }
        });
    }

    /**
     * Rename a key across all languages
     */
    async renameKey(namespace, oldKey, newKey) {
        if (oldKey === newKey) return;

        // Prisma doesn't support updating a field that is part of a composite ID directly in 'updateMany'
        // We have to iterate or use raw query. Since key/namespace/langCode is the ID, we need to create new and delete old.
        const records = await prisma.uiTranslation.findMany({
            where: { namespace, key: oldKey }
        });

        for (const record of records) {
            await prisma.uiTranslation.create({
                data: {
                    langCode: record.langCode,
                    namespace,
                    key: newKey,
                    value: record.value,
                    isReviewed: record.isReviewed
                }
            });
        }

        await prisma.uiTranslation.deleteMany({
            where: { namespace, key: oldKey }
        });
    }

    /**
     * Translate a specific key into all missing active languages
     * @param {string} namespace
     * @param {string} key
     * @param {boolean} [force=false] - If true, deletes existing non-English translations for the key before re-translating.
     */
    async translateSingleKey(namespace, key, force = false) {
        // 1. Get base record (EN)
        const baseRecord = await prisma.uiTranslation.findFirst({
            where: { langCode: 'en', namespace, key }
        });

        if (!baseRecord) {
            throw new Error(`Base 'en' record not found for key: ${key}`);
        }

        // 2. If force is true, delete existing non-English entries first
        if (force) {
            await prisma.uiTranslation.deleteMany({
                where: {
                    namespace,
                    key,
                    langCode: { not: 'en' }
                }
            });
        }

        // 3. Get all languages
        const languages = await prisma.language.findMany({ where: { isActive: true } });
        const langCodes = languages.map(l => l.code);

        // 4. Get existing entries for this key across all active languages (after potential deletion)
        const existingEntries = await prisma.uiTranslation.findMany({
            where: { namespace, key, langCode: { in: langCodes } }
        });

        // 5. Determine which languages are missing or have empty values
        const missingCodes = langCodes.filter(code => {
            const entry = existingEntries.find(e => e.langCode === code);
            return !entry || !entry.value || entry.value.trim() === "";
        });

        if (missingCodes.length > 0) {
            const translations = await this.translate(baseRecord.value, missingCodes, `Namespace: ${namespace}, Key: ${key}`);
            for (const [code, val] of Object.entries(translations)) {
                await prisma.uiTranslation.upsert({
                    where: {
                        langCode_namespace_key: {
                            langCode: code,
                            namespace,
                            key
                        }
                    },
                    update: {
                        value: String(val),
                        isReviewed: false
                    },
                    create: {
                        langCode: code,
                        namespace,
                        key,
                        value: String(val),
                        isReviewed: false
                    }
                });
            }
        }
        return { success: true };
    }
    /**
     * Generate SEO-optimized category description using AI with internal links
     * @param {string} categoryName - Name of the category
     * @param {string[]} productNames - List of representative products
     * @param {Object[]} relatedCategories - List of {name, slug} for internal linking
     * @returns {Promise<string>} - Generated HTML description
     */
    async generateSEOContent(categoryName, productNames, relatedCategories = []) {
        try {
            const prompt = `You are a premium e-commerce SEO expert.
Generate a comprehensive, high-quality SEO description for the category "${categoryName}".
The description should be professional, engaging, and optimized for search engines (Google).

CONTEXT:
- Category: ${categoryName}
- Key Products: ${productNames.slice(0, 5).join(', ')}
- Related Categories (for internal linking): ${JSON.stringify(relatedCategories)}
- Location: Bangladesh (so use terms like "Price in Bangladesh", "Latest Price in BD 2026")
- Tone: Professional, authoritative, and helpful.

SEARCH ENGINE OPTIMIZATION RULES:
1. INTERNAL LINKING (CRITICAL): Naturally embed 2-4 internal links to related categories using <a> tags.
   - Use the provide slugs. Example: if a related category is "Laptops" with slug "laptops", use <a href="/laptops">Laptops</a>.
   - Do NOT use absolute URLs (http://...), only relative paths starting with /.
2. KEYWORDS: Over-optimize for "${categoryName} Price in Bangladesh", "Best Price", and "High Performance".
3. STRUCTURE:
   - An engaging H2 heading containing the category name.
   - 2-3 paragraphs of detailed content.
   - Mention key features, benefits, and why customers should buy from "Mahbub Shop".
   - Use <strong> tags for important keywords.
4. LENGTH: Around 200-300 words.

Return ONLY the HTML content (use <p>, <h2>, <strong>, <ul>, <li>, <a> tags).

Output Format: HTML string.`;

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: 'You are an SEO content generator.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || 'Generation failed');

            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('SEO Generation Error:', error);
            throw error;
        }
    }
}

module.exports = new TranslationService();
