const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const { query } = require('../config/database');
const logger = require('../utils/logger');

// Ensure upload dirs exist
const uploadDirs = ['uploads/images', 'uploads/evidence', 'uploads/avatars'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed.'), false);
  }
};

const localStorage = (folder = 'images') => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join('uploads', folder);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadImages = multer({
  storage: localStorage('images'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter,
});

const uploadEvidence = multer({
  storage: localStorage('evidence'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadAvatar = multer({
  storage: localStorage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

async function uploadToCloudinary(filePath, folder, options = {}) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `back2you/${folder}`,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        ...(options.transformations || []),
      ],
      ...options,
    });

    // Clean up local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    logger.warn('Cloudinary upload failed, using local storage:', error.message);
    // Return local path as fallback
    const filename = path.basename(filePath);
    // Since all files are stored in uploads/images/, use that path
    return {
      url: `/uploads/images/${filename}`,
      publicId: null,
      width: null,
      height: null,
      format: path.extname(filename).replace('.', ''),
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
    };
  }
}

async function deleteFromCloudinary(publicId) {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    logger.warn('Cloudinary delete failed:', error.message);
  }
}

module.exports = {
  uploadImages,
  uploadEvidence,
  uploadAvatar,
  uploadToCloudinary,
  deleteFromCloudinary,
};
