/**
 * i18n Middleware
 * Intercepts responses and automatically translates fields based on the x-lang header
 */
const i18nMiddleware = (req, res, next) => {
  const lang = req.headers['x-lang'] || req.query.lang || 'en';
  req.lang = lang;

  // Skip if English or default
  if (lang === 'en') {
    return next();
  }

  // Capture the original res.json
  const originalJson = res.json;

  res.json = function (data) {
    if (data && data.success && data.data) {
      // Translate the data
      data.data = translateData(data.data, lang);
    }
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Recursive function to translate objects and arrays
 */
const translateData = (data, locale) => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => translateData(item, locale));
  }

  if (typeof data === 'object') {
    // 1. If it has a translations array, use it to override main fields
    if (data.translations && Array.isArray(data.translations)) {
      const translation = data.translations.find((t) => t.langCode === locale);
      if (translation) {
        // Common fields to translate
        const fieldsToTranslate = [
          'name',
          'description',
          'title',
          'subtitle',
          'metaTitle',
          'metaDescription',
        ];
        fieldsToTranslate.forEach((field) => {
          if (translation[field]) {
            data[field] = translation[field];
          }
        });
        data.isTranslated = true;
        data.translatedTo = locale;
      }
    }

    // 2. Recursively translate nested objects
    for (const key in data) {
      if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
        data[key] = translateData(data[key], locale);
      }
    }
  }

  return data;
};

module.exports = i18nMiddleware;
