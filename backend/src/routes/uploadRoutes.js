const express = require('express');
const router = express.Router();
const { uploadAvatar, uploadBanner, uploadMedia, handleUploadError } = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const path = require('path');

// All upload routes require authentication
router.use(authenticate);

// Upload avatar
router.post('/avatar', handleUploadError, uploadAvatar, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  
  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: { avatar: avatarUrl },
  });
});

// Upload banner
router.post('/banner', handleUploadError, uploadBanner, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const bannerUrl = `/uploads/banners/${req.file.filename}`;
  
  res.json({
    success: true,
    message: 'Banner uploaded successfully',
    data: { banner: bannerUrl },
  });
});

// Upload post media (multiple files)
router.post('/media', handleUploadError, uploadMedia, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded',
    });
  }

  const media = req.files.map((file, index) => {
    const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    return {
      type: fileType,
      url: `/uploads/media/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
    };
  });

  res.json({
    success: true,
    message: 'Media uploaded successfully',
    data: { media },
  });
});

// Upload single media file
router.post('/media/single', handleUploadError, async (req, res) => {
  // Use a simple upload for single files
  uploadMedia(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    const media = {
      type: fileType,
      url: `/uploads/media/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size,
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: { media },
    });
  });
});

module.exports = router;

