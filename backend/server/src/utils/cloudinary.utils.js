const cloudinary = require('../config/cloudinary');

/**
 * Delete an image from Cloudinary using its URL
 * @param {string} imageUrl - The full Cloudinary image URL
 * @returns {Promise<boolean>} - Returns true if deletion was successful, false otherwise
 */
const deleteImageFromCloudinary = async (imageUrlOrPath) => {
  if (!imageUrlOrPath) return false;

  try {
    let publicId = imageUrlOrPath;

    if (imageUrlOrPath.startsWith('http://') || imageUrlOrPath.startsWith('https://')) {
      // Extract public_id from Cloudinary URL
      const urlParts = imageUrlOrPath.split('/');
      const uploadIndex = urlParts.indexOf('upload');

      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
        let subParts = urlParts.slice(uploadIndex + 1);
        // Skip version tag (e.g., v1716240000)
        if (subParts[0] && /^v\d+$/.test(subParts[0])) {
          subParts = subParts.slice(1);
        }
        const publicIdWithExt = subParts.join('/');
        publicId =
          publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;
      }
    } else {
      // Relative path from DB (e.g. 'users/xyz.webp' or 'users/xyz')
      // Strip extension if it exists
      if (publicId.includes('.')) {
        publicId = publicId.substring(0, publicId.lastIndexOf('.'));
      }

      // Prepend brand prefix if present and not already there
      const prefix = process.env.IMAGE_FOLDER_PREFIX || '';
      if (prefix && !publicId.startsWith(prefix + '/')) {
        publicId = `${prefix}/${publicId}`;
      }
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error);
    return false;
  }
};

module.exports = {
  deleteImageFromCloudinary,
};
