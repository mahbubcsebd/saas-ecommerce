/**
 * Image path utilities to decouple database paths from cloud domain and folder prefix.
 */

/**
 * Prepends base URL and brand/app prefix to a relative image path.
 * Leaves full URLs unchanged (ensures backward compatibility).
 *
 * @param {string} path - The image path stored in the database
 * @returns {string} - The fully qualified image URL
 */
const formatImageUrl = (path) => {
  if (!path) return path;
  if (typeof path !== 'string') return path;

  // If it's already a full URL (legacy or external), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const baseUrl = process.env.IMAGE_BASE_URL || '';
  const prefix = process.env.IMAGE_FOLDER_PREFIX || '';

  // 1. Clean the path from any versioning patterns (e.g. v1716.../)
  let cleanedPath = path.replace(/^v\d+\//, '');

  // 2. Clean the path from any redundant/duplicated prefix patterns
  if (prefix) {
    if (cleanedPath.startsWith(prefix + '/')) {
      cleanedPath = cleanedPath.substring(prefix.length + 1);
    }
    // Also handle if there's a version number after prefix (e.g., ecommerce/v12345/brands/...)
    cleanedPath = cleanedPath.replace(/^v\d+\//, '');
    if (cleanedPath.startsWith(prefix + '/')) {
      cleanedPath = cleanedPath.substring(prefix.length + 1);
    }
  }

  // Clean baseUrl (remove trailing slash)
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Now prepend the prefix once and build the clean path
  let relativePath = cleanedPath;
  if (prefix) {
    relativePath = `${prefix}/${cleanedPath.startsWith('/') ? cleanedPath.slice(1) : cleanedPath}`;
  }

  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${cleanBase}${cleanPath}`;
};

/**
 * Strips the base URL and top-level brand prefix from an image path/URL.
 * Keeps only the entity-specific relative path (e.g., 'users/avatar.webp').
 *
 * @param {string} pathOrUrl - The incoming path or full URL
 * @returns {string} - The cleaned relative path
 */
const stripImagePrefix = (pathOrUrl) => {
  if (!pathOrUrl) return pathOrUrl;
  if (typeof pathOrUrl !== 'string') return pathOrUrl;

  const baseUrl = process.env.IMAGE_BASE_URL || '';
  const prefix = process.env.IMAGE_FOLDER_PREFIX || '';

  let cleaned = pathOrUrl;

  // 1. If it's a full URL, strip the base URL or extract from upload/
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    // Extract from Cloudinary upload URL format (helps strip version number automatically)
    const matches = cleaned.match(/\/upload\/(?:v\d+\/)?(.+?)$/i);
    if (matches && matches[1]) {
      cleaned = matches[1];
    } else if (baseUrl && cleaned.startsWith(baseUrl)) {
      cleaned = cleaned.substring(baseUrl.length);
    }
  }

  // Ensure leading slash is removed
  if (cleaned.startsWith('/')) {
    cleaned = cleaned.slice(1);
  }

  // Strip leading version pattern if present (e.g. v123456/)
  cleaned = cleaned.replace(/^v\d+\//, '');

  // 2. Strip the brand prefix if present at the start of the path
  if (prefix) {
    if (cleaned.startsWith(prefix + '/')) {
      cleaned = cleaned.substring(prefix.length + 1);
    } else if (cleaned === prefix) {
      cleaned = '';
    }
  }

  return cleaned;
};

module.exports = {
  formatImageUrl,
  stripImagePrefix,
};
