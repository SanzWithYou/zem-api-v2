const express = require('express');
const { healthCheck, testEmail } = require('../controllers/healthController');
const {
  createOrder,
  getAllOrders,
  getOrderById,
} = require('../controllers/jokiController');
const { serveFile } = require('../controllers/fileController');
const apiKeyMiddleware = require('../middleware/apiKey');
const upload = require('../utils/upload').upload;
const router = express.Router();

router.get('/health', healthCheck);
router.get('/test-email', testEmail);

// Joki
router.post('/joki/orders', upload.single('bukti_transfer'), createOrder);
router.get('/joki/orders', apiKeyMiddleware, getAllOrders);
router.get('/joki/orders/:id', apiKeyMiddleware, getOrderById);

router.get('/files/:folder/:filename', serveFile);

module.exports = router;
