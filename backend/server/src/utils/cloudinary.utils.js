const cloudinary = require('../config/cloudinary');

/**
 * Delete an image from Cloudinary using its URL
 * @param {string} imageUrl - The full Cloudinary image URL
 * @returns {Promise<boolean>} - Returns true if deletion was successful, false otherwise
 */
const deleteImageFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return false;

  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
      // Get everything after 'upload/' and before the file extension
      const publicIdWithExt = urlParts.slice(uploadIndex + 1).join('/');
      const publicId =
        publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;

      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    }

    return false;
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error);
    return false;
  }
};

module.exports = {
  deleteImageFromCloudinary,
};
