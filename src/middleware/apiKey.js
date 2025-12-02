const error = require('../utils/response').error;

const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return error(res, 'API Key is required', 401);
  }

  if (apiKey !== process.env.API_KEY) {
    return error(res, 'Invalid API Key', 401);
  }

  next();
};

module.exports = apiKeyMiddleware;
