const sequelize = require('../config/sequelize');
const { success, error } = require('../utils/response');

const healthCheck = async (req, res) => {
  const healthStatus = {
    database: false,
    api: true,
    timestamp: new Date().toISOString(),
  };

  try {
    await sequelize.query('SELECT 1');
    healthStatus.database = true;
  } catch (err) {
    console.error('Health detail error:', err);
    healthStatus.database = false;
  }

  if (healthStatus.database) {
    success(res, healthStatus, 'Semua sistem normal');
  } else {
    error(res, 'Beberapa sistem bermasalah', 503);
  }
};

module.exports = { healthCheck };
