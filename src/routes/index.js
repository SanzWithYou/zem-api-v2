const express = require('express');
const { healthCheck } = require('../controllers/healthController');
const {
  createOrder,
  getAllOrders,
  getOrderById,
} = require('../controllers/jokiController');
const { serveFile } = require('../controllers/fileController');
const upload = require('../utils/upload').upload;
const router = express.Router();

router.get('/health', healthCheck);

// Joki
router.post('/joki/orders', upload.single('bukti_transfer'), createOrder);
router.get('/joki/orders', getAllOrders);
router.get('/joki/orders/:id', getOrderById);

router.get('/files/:folder/:filename', serveFile);

module.exports = router;
