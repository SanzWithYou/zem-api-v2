// Response standar
const success = (res, data, message = 'Sukses') => {
  res.status(200).json({
    success: true,
    message,
    data,
  });
};

const error = (res, message = 'Terjadi kesalahan', statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { success, error };
