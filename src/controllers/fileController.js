const { success, error } = require('../utils/response');
const s3 = require('../config/objectStorage');
require('dotenv').config();

// Serve file
const serveFile = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return error(res, 'Filename is required', 400);
    }

    // Buat key
    const folder = process.env.UPLOAD_FOLDER || 'uploads';
    const key = `${folder}/${filename}`;

    // Ambil file
    const data = await s3
      .getObject({
        Bucket: process.env.OS_BUCKET_NAME,
        Key: key,
      })
      .promise();

    // Set header
    res.set({
      'Content-Type': data.ContentType,
      'Content-Length': data.ContentLength,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    });

    // Kirim file
    res.send(data.Body);
  } catch (err) {
    console.error('Serve file error:', err);

    if (err.code === 'NoSuchKey') {
      return error(res, 'File not found', 404);
    }

    error(res, 'Failed to serve file', 500);
  }
};

module.exports = {
  serveFile,
};
