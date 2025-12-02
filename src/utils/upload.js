const s3 = require('../config/objectStorage');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Upload S3
const uploadToS3 = async (file, folder = 'bukti-transfer') => {
  const timestamp = Date.now();
  const ext = file.originalname
    ? file.originalname.substring(file.originalname.lastIndexOf('.'))
    : '.png';
  const fileName = `${timestamp}_${uuidv4()}${ext}`;

  const fullPath = `${folder}/${fileName}`;

  const params = {
    Bucket: process.env.OS_BUCKET_NAME,
    Key: fullPath,
    Body: file.buffer || file,
    ContentType: file.mimetype || 'image/png',
    ACL: 'public-read',
  };

  await s3.upload(params).promise();

  return fullPath;
};

module.exports = { upload, uploadToS3 };
