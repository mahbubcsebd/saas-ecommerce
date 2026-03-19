const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configuration for single image upload
const singleImageUpload = (folderName, fieldName) => {
  return multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder: folderName, // Dynamic folder name
        format: 'webp', // Optional: Convert images to a specific format
        transformation: { width: 500, height: 500, crop: 'fill' }, // Optional: Resize and crop the image
      },
    }),
  }).single(fieldName);
};

// Configuration for multiple image uploads
const multipleImageUpload = (folderName, fieldName, maxCount = 5) => {
  return multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder: folderName, // Dynamic folder name
        format: 'webp', // Optional: Convert images to a specific format
        transformation: { width: 500, height: 500, crop: 'fill' }, // Optional: Resize and crop the image
      },
    }),
  }).array(fieldName, maxCount);
};

// Configuration for single file upload
const singleFileUpload = (folderName, fieldName, options = {}) => {
  const { transformation = {}, format = 'auto', limits = {} } = options;

  return multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder: folderName, // Dynamic folder name
        format, // Use 'auto' to detect the file format
        transformation: {
          ...transformation, // Allow custom transformations (optional for non-image files)
        },
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file size limit by default
      ...limits, // Allow custom file size limits
    },
    fileFilter: (req, file, cb) => {
      // Allow all file types
      cb(null, true);
    },
  }).single(fieldName);
};

// Configuration for multiple file uploads
const multipleFileUpload = (folderName, fieldName, maxCount = 5, options = {}) => {
  const { transformation = {}, format = 'auto', limits = {} } = options;

  return multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder: folderName, // Dynamic folder name
        format, // Use 'auto' to detect the file format
        transformation: {
          ...transformation, // Allow custom transformations (optional for non-image files)
        },
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file size limit by default
      ...limits, // Allow custom file size limits
    },
    fileFilter: (req, file, cb) => {
      // Allow all file types
      cb(null, true);
    },
  }).array(fieldName, maxCount);
};

// Configuration for any image upload (flexible fields)
const anyImageUpload = (folderName) => {
  return multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder: folderName,
        format: 'webp',
        transformation: { width: 500, height: 500, crop: 'fill' },
      },
    }),
  }).any();
};

module.exports = {
  singleImageUpload,
  multipleImageUpload,
  singleFileUpload,
  multipleFileUpload,
  anyImageUpload,
};
