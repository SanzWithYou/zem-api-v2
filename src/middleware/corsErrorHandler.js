const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak: Origin tidak diizinkan',
    });
  } else {
    next(err);
  }
};

module.exports = corsErrorHandler;
