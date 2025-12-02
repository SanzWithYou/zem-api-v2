const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Cek jenis error
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file terlalu besar (maksimal 5MB)',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Field file tidak valid',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Error upload file: ' + err.message,
    });
  }

  // Error umum
  res.status(500).json({
    success: false,
    message: 'Kesalahan server: ' + err.message,
  });
};

module.exports = errorHandler;
