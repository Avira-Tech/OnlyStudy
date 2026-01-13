const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uuidv4()}${ext}`);
  },
});

// Configure storage for banners
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/banners'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `banner-${uuidv4()}${ext}`);
  },
});

// Configure storage for post media
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/media');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `media-${uuidv4()}${ext}`);
  },
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed!'));
};

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|webm|ogg|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('video/');

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only video files are allowed!'));
};

// File filter for any media
const mediaFileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const videoTypes = /mp4|webm|ogg|mov/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (imageTypes.test(extname) && (mimetype.startsWith('image/'))) {
    return cb(null, 'image');
  }
  if (videoTypes.test(extname) && (mimetype.startsWith('video/'))) {
    return cb(null, 'video');
  }
  cb(new Error('Only image and video files are allowed!'));
};

// Avatar upload (max 2MB)
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single('avatar');

// Banner upload (max 5MB)
const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single('banner');

// Post media upload (max 50MB for videos, 10MB for images)
const uploadMedia = multer({
  storage: mediaStorage,
  limits: { 
    fileSize: process.env.MAX_FILE_SIZE 
      ? parseInt(process.env.MAX_FILE_SIZE) 
      : 50 * 1024 * 1024 
  },
  fileFilter: mediaFileFilter,
}).array('media', 5);

// Multiple file upload for posts
const uploadPostMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: mediaFileFilter,
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

module.exports = {
  uploadAvatar,
  uploadBanner,
  uploadMedia,
  uploadPostMedia,
  handleUploadError,
  imageFileFilter,
  videoFileFilter,
  mediaFileFilter,
};

