const { JokiOrder } = require('../models');
const { success, error } = require('../utils/response');
const { uploadToS3 } = require('../utils/upload');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

// Format waktu
const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// Format output
const formatOrderResponse = (order, req) => {
  let fileUrl = null;
  if (order.bukti_transfer) {
    const fileName = path.basename(order.bukti_transfer);
    const folderName = process.env.UPLOAD_FOLDER || 'uploads';
    const filePath = order.bukti_transfer.includes(folderName)
      ? order.bukti_transfer
      : `${folderName}/${order.bukti_transfer}`;
    fileUrl = `${
      process.env.FILE_URL_BASE ||
      `${req.protocol}://${req.get('host')}/api/files`
    }/${filePath}`;
  }

  return {
    id: order.id,
    username: order.username,
    password: order.password,
    // Field baru
    tiktok_username: order.tiktok_username,
    whatsapp_number: order.whatsapp_number,
    jenis_joki: order.jenis_joki,
    bukti_transfer: fileUrl,
    createdAt: formatTimestamp(order.createdAt),
    updatedAt: formatTimestamp(order.updatedAt),
  };
};

// Buat order
const createOrder = async (req, res) => {
  const transaction = await JokiOrder.sequelize.transaction();

  try {
    const { username, password, jenis_joki, tiktok_username, whatsapp_number } =
      req.body;
    const buktiTransfer = req.file;

    // Validasi
    if (!username) {
      await transaction.rollback();
      return error(res, 'Username diperlukan', 400);
    }

    if (!password) {
      await transaction.rollback();
      return error(res, 'Password diperlukan', 400);
    }

    if (!jenis_joki) {
      await transaction.rollback();
      return error(res, 'Jenis joki diperlukan', 400);
    }

    if (!buktiTransfer) {
      await transaction.rollback();
      return error(res, 'Bukti transfer diperlukan', 400);
    }

    // Upload
    let buktiTransferUrl;
    try {
      buktiTransferUrl = await uploadToS3(buktiTransfer);
    } catch (uploadError) {
      await transaction.rollback();
      console.error('Upload error:', uploadError);
      return error(res, 'Gagal mengupload bukti transfer', 400);
    }

    // Buat ID
    let orderId;
    try {
      const timestamp = Date.now();
      const shortUuid = uuidv4().split('-')[0];
      orderId = `JKI-${timestamp}-${shortUuid}`;
    } catch (idError) {
      await transaction.rollback();
      console.error('ID generation error:', idError);
      return error(res, 'Gagal generate ID order', 500);
    }

    // Simpan
    try {
      const order = await JokiOrder.create(
        {
          id: orderId,
          username,
          password,
          tiktok_username,
          whatsapp_number,
          jenis_joki,
          bukti_transfer: buktiTransferUrl,
        },
        { transaction }
      );

      await transaction.commit();

      // Format output
      const formattedOrder = formatOrderResponse(order.toJSON(), req);

      success(res, formattedOrder, 'Order berhasil dibuat');
    } catch (createError) {
      await transaction.rollback();
      console.error('Create order error:', createError);

      if (createError.name === 'SequelizeValidationError') {
        const errorMessages = createError.errors.map((e) => e.message);
        return error(res, `Validasi gagal: ${errorMessages.join(', ')}`, 400);
      }

      return error(res, 'Gagal membuat order: ' + createError.message, 500);
    }
  } catch (err) {
    await transaction.rollback();
    console.error('Unexpected error:', err);
    error(res, 'Terjadi kesalahan tidak terduga: ' + err.message, 500);
  }
};

// Ambil semua
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validasi
    if (page < 1 || limit < 1) {
      return error(res, 'Page dan limit harus lebih dari 0', 400);
    }

    // Hitung total
    const total = await JokiOrder.count();

    // Ambil data
    const orders = await JokiOrder.findAll({
      order: [['createdAt', 'ASC']],
      limit,
      offset,
    });

    // Format output
    const formattedOrders = orders.map((order) =>
      formatOrderResponse(order.toJSON(), req)
    );

    success(
      res,
      {
        orders: formattedOrders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Data order berhasil diambil'
    );
  } catch (err) {
    console.error('Get orders error:', err);

    if (err.name === 'SequelizeDatabaseError') {
      return error(res, 'Error database: ' + err.message, 500);
    }

    error(res, 'Gagal mengambil data order: ' + err.message, 500);
  }
};

// Cari by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi
    if (!id) {
      return error(res, 'ID diperlukan', 400);
    }

    // Cari
    const order = await JokiOrder.findOne({
      where: { id },
    });

    if (!order) {
      return error(res, 'Order tidak ditemukan', 404);
    }

    // Format output
    const formattedOrder = formatOrderResponse(order.toJSON(), req);

    success(res, formattedOrder, 'Order berhasil ditemukan');
  } catch (err) {
    console.error('Get order by ID error:', err);

    if (err.name === 'SequelizeDatabaseError') {
      return error(res, 'Error database: ' + err.message, 500);
    }

    error(res, 'Gagal mengambil data order: ' + err.message, 500);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
};
