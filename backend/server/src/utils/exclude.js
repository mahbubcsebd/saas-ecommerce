// /**
//  * Exclude one or more fields from a Prisma model result
//  * @param {object} obj - Prisma model object
//  * @param {string[]} keys - Keys to exclude /remove
//  * @returns {object} New object without excluded keys
//  */

// const excludeFields = (obj, keys) => {
//   return Object.fromEntries(
//     Object.entries(obj).filter(([key]) => !keys.includes(key))
//   );
// };

// module.exports = excludeFields;

/**
 * Exclude one or more fields from a single object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to exclude
 * @returns {Object} New object without excluded keys
 */
const excludeFields = (obj, keys) => {
  // Null/undefined check
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Empty keys array check
  if (!Array.isArray(keys) || keys.length === 0) {
    return obj;
  }

  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)));
};

/**
 * Exclude fields from array of objects
 * @param {Array} arr - Array of objects
 * @param {string[]} keys - Keys to exclude
 * @returns {Array} Array of objects without excluded keys
 */
const excludeFieldsFromArray = (arr, keys) => {
  if (!Array.isArray(arr)) {
    return arr;
  }

  return arr.map((obj) => excludeFields(obj, keys));
};

/**
 * Select only specific fields from an object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to select/pick
 * @returns {Object} New object with only selected keys
 */
const selectFields = (obj, keys) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (!Array.isArray(keys) || keys.length === 0) {
    return {};
  }

  return Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)));
};

/**
 * Select fields from array of objects
 * @param {Array} arr - Array of objects
 * @param {string[]} keys - Keys to select
 * @returns {Array} Array of objects with only selected keys
 */
const selectFieldsFromArray = (arr, keys) => {
  if (!Array.isArray(arr)) {
    return arr;
  }

  return arr.map((obj) => selectFields(obj, keys));
};

/**
 * Exclude sensitive fields (common use case)
 * @param {Object|Array} data - Object or array of objects
 * @returns {Object|Array} Data without sensitive fields
 */
const excludeSensitiveFields = (data) => {
  const sensitiveFields = ['password', 'passwordHash', 'refreshToken', 'resetToken'];

  if (Array.isArray(data)) {
    return excludeFieldsFromArray(data, sensitiveFields);
  }

  return excludeFields(data, sensitiveFields);
};

/**
 * Transform Prisma result for API response
 * @param {Object|Array} data - Prisma query result
 * @param {Object} options - Transform options
 * @param {string[]} options.exclude - Fields to exclude
 * @param {string[]} options.select - Fields to select (overrides exclude)
 * @returns {Object|Array} Transformed data
 */
const transformPrismaResult = (data, options = {}) => {
  const { exclude = [], select = [] } = options;

  // If select is provided, use it (it takes priority)
  if (select.length > 0) {
    return Array.isArray(data) ? selectFieldsFromArray(data, select) : selectFields(data, select);
  }

  // Otherwise use exclude
  if (exclude.length > 0) {
    return Array.isArray(data)
      ? excludeFieldsFromArray(data, exclude)
      : excludeFields(data, exclude);
  }

  return data;
};

/**
 * Deep clone object (for nested Prisma results)
 * @param {*} obj - Object to clone
 * @returns {*} Deep cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }

  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, deepClone(value)]));
};

/**
 * Exclude fields from nested Prisma result
 * @param {Object} obj - Nested Prisma object
 * @param {Object} fieldsMap - Map of nested field exclusions
 * @returns {Object} Object with excluded nested fields
 *
 * Example:
 * excludeNestedFields(user, {
 *   _root: ['password'],
 *   posts: ['deletedAt'],
 *   'posts.author': ['email']
 * })
 */
const excludeNestedFields = (obj, fieldsMap) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const cloned = deepClone(obj);

  // Exclude root level fields
  if (fieldsMap._root) {
    Object.keys(cloned).forEach((key) => {
      if (fieldsMap._root.includes(key)) {
        delete cloned[key];
      }
    });
  }

  // Exclude nested fields
  Object.keys(fieldsMap).forEach((path) => {
    if (path === '_root') return;

    const parts = path.split('.');
    let current = cloned;

    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]]) {
        current = current[parts[i]];
      } else {
        return;
      }
    }

    const lastKey = parts[parts.length - 1];
    if (Array.isArray(current[lastKey])) {
      current[lastKey] = excludeFieldsFromArray(current[lastKey], fieldsMap[path]);
    } else if (current[lastKey]) {
      current[lastKey] = excludeFields(current[lastKey], fieldsMap[path]);
    }
  });

  return cloned;
};

module.exports = {
  excludeFields,
  excludeFieldsFromArray,
  selectFields,
  selectFieldsFromArray,
  excludeSensitiveFields,
  transformPrismaResult,
  deepClone,
  excludeNestedFields,
};
