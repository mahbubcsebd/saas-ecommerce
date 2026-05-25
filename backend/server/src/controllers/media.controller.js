const cloudinary = require('../config/cloudinary');
const { successResponse } = require('../utils/response');

/**
 * List all assets uploaded to Cloudinary
 */
exports.listMedia = async (req, res, next) => {
  try {
    const { max_results = 50, next_cursor, prefix } = req.query;
    
    const folderPrefix = prefix || process.env.IMAGE_FOLDER_PREFIX || 'ecommerce';

    // Query Cloudinary Admin API
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderPrefix ? `${folderPrefix}/` : undefined,
      max_results: parseInt(max_results),
      next_cursor: next_cursor || undefined
    });

    return successResponse(res, {
      message: 'Media files fetched successfully',
      data: {
        resources: result.resources.map(r => ({
          public_id: r.public_id,
          format: r.format,
          version: r.version,
          resource_type: r.resource_type,
          secure_url: r.secure_url,
          bytes: r.bytes,
          width: r.width,
          height: r.height,
          created_at: r.created_at
        })),
        next_cursor: result.next_cursor
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific asset from Cloudinary
 */
exports.deleteMedia = async (req, res, next) => {
  try {
    const { public_id } = req.body;
    
    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'public_id is required'
      });
    }

    // Call Cloudinary Uploader API to delete the image
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === 'ok' || result.result === 'not found') {
      return successResponse(res, {
        message: 'Media deleted successfully',
        data: result
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Failed to delete media from Cloudinary: ${result.result}`,
        data: result
      });
    }
  } catch (error) {
    next(error);
  }
};
