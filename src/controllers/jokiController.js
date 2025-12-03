const { JokiOrder } = require('../models');
const { success, error } = require('../utils/response');
const { uploadToS3 } = require('../utils/upload');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { sendEmail, createEmailTemplate } = require('../utils/email');
const { encrypt, decrypt } = require('../utils/encryption');
const {
  detectCountryFromClientIP,
  getCountryInfo,
  formatTimestamp,
} = require('../utils/countryDetector');
require('dotenv').config();

// Format output sederhana
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

  // Deteksi negara dari nomor WhatsApp untuk timezone
  const countryCode = 'id'; // Default ke Indonesia untuk format timestamp

  return {
    id: order.id,
    username: order.username,
    password: order.password,
    tiktok_username: order.tiktok_username,
    whatsapp_number: order.whatsapp_number,
    jenis_joki: order.jenis_joki,
    bukti_transfer: fileUrl,
    createdAt: formatTimestamp(order.createdAt, countryCode),
    updatedAt: formatTimestamp(order.updatedAt, countryCode),
  };
};

// Fungsi untuk membuat URL lengkap dari path file
const createFullFileUrl = (filePath, req) => {
  if (!filePath) return null;

  const fileName = path.basename(filePath);
  const folderName = process.env.UPLOAD_FOLDER || 'uploads';
  const formattedPath = filePath.includes(folderName)
    ? filePath
    : `${folderName}/${filePath}`;

  return `${
    process.env.FILE_URL_BASE ||
    `${req.protocol}://${req.get('host')}/api/files`
  }/${formattedPath}`;
};

// Fungsi untuk mengirim email notifikasi order (sederhana)
const sendOrderEmail = async (data, req, countryCode = 'id') => {
  const {
    username,
    password,
    tiktok_username,
    whatsapp_number,
    jenis_joki,
    orderId,
    buktiTransferUrl,
  } = data;

  // Buat URL lengkap untuk bukti transfer
  const fullBuktiTransferUrl = createFullFileUrl(buktiTransferUrl, req);

  const subject = `New Joki Order: ${orderId}`;
  const content = `
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p><strong>Username:</strong> ${username}</p>
    <p><strong>Password:</strong> ${password}</p>
    <p><strong>TikTok Username:</strong> ${tiktok_username || '-'}</p>
    <p><strong>WhatsApp Number:</strong> ${whatsapp_number || '-'}</p>
    <p><strong>Jenis Joki:</strong> ${jenis_joki}</p>
    <p><strong>Bukti Transfer:</strong> <a href="${fullBuktiTransferUrl}" target="_blank">View File</a></p>
    <p><strong>Order Time:</strong> ${formatTimestamp(
      new Date(),
      countryCode
    )}</p>
  `;

  const html = createEmailTemplate('New Joki Order Received', content);

  // Gunakan SMTP_USER sebagai penerima email
  const adminEmail = process.env.SMTP_USER;

  await sendEmail({
    to: adminEmail,
    subject,
    html,
  });
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

    // Deteksi negara dari IP client
    let countryCode = 'id'; // Default ke Indonesia
    try {
      countryCode = await detectCountryFromClientIP(req);
      console.log(`🌍 Country detected from IP: ${countryCode}`);
    } catch (countryError) {
      console.error('Country detection error:', countryError);
    }

    // Simpan data asli untuk email (sebelum enkripsi)
    const originalData = {
      username,
      password,
      tiktok_username,
      whatsapp_number,
      jenis_joki,
      orderId,
      buktiTransferUrl,
    };

    // Kirim email sebelum menyimpan ke database
    let emailSent = false;
    try {
      await sendOrderEmail(originalData, req, countryCode);
      emailSent = true;
      console.log('✅ Email notification sent successfully');
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      // Lanjutkan proses meskipun email gagal dikirim
    }

    // Simpan data ke database (enkripsi akan dilakukan otomatis oleh hooks)
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

      // Format output (data sudah terenkripsi di database, kita dekripsi untuk response)
      const decryptedOrder = {
        ...order.toJSON(),
        username: decrypt(order.username),
        password: decrypt(order.password),
        tiktok_username: order.tiktok_username
          ? decrypt(order.tiktok_username)
          : null,
        whatsapp_number: order.whatsapp_number
          ? decrypt(order.whatsapp_number)
          : null,
      };

      const formattedOrder = formatOrderResponse(decryptedOrder, req);

      // Tambahkan informasi status email di response
      const message = emailSent
        ? 'Order berhasil dibuat dan notifikasi email telah dikirim'
        : 'Order berhasil dibuat, tetapi notifikasi email gagal dikirim';

      success(res, formattedOrder, message);
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

    // Ambil data dengan raw: true untuk menghindari dekripsi otomatis
    const orders = await JokiOrder.findAll({
      order: [['createdAt', 'ASC']],
      limit,
      offset,
      raw: true,
    });

    // Periksa header untuk dekripsi
    const decryptKey = req.headers['x-decrypt-key'];
    const decryptIv = req.headers['x-decrypt-iv'];
    const shouldDecrypt =
      decryptKey &&
      decryptIv &&
      decryptKey === process.env.ENCRYPTION_KEY &&
      decryptIv === process.env.ENCRYPTION_IV;

    // Format output
    const formattedOrders = orders.map((order) => {
      // Buat salinan objek untuk dimodifikasi
      const formattedOrder = { ...order };

      // Dekripsi data sensitif jika header valid
      if (shouldDecrypt) {
        try {
          formattedOrder.username = decrypt(order.username);
          formattedOrder.password = decrypt(order.password);
          if (order.tiktok_username) {
            formattedOrder.tiktok_username = decrypt(order.tiktok_username);
          }
          if (order.whatsapp_number) {
            formattedOrder.whatsapp_number = decrypt(order.whatsapp_number);
          }
        } catch (decryptError) {
          console.error('Decryption error:', decryptError);
        }
      }

      // Format file URL dan timestamp
      return formatOrderResponse(formattedOrder, req);
    });

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

    // Cari dengan raw: true untuk menghindari dekripsi otomatis
    const order = await JokiOrder.findOne({
      where: { id },
      raw: true,
    });

    if (!order) {
      return error(res, 'Order tidak ditemukan', 404);
    }

    // Periksa header untuk dekripsi
    const decryptKey = req.headers['x-decrypt-key'];
    const decryptIv = req.headers['x-decrypt-iv'];
    const shouldDecrypt =
      decryptKey &&
      decryptIv &&
      decryptKey === process.env.ENCRYPTION_KEY &&
      decryptIv === process.env.ENCRYPTION_IV;

    // Buat salinan objek untuk dimodifikasi
    const formattedOrder = { ...order };

    // Dekripsi data sensitif jika header valid
    if (shouldDecrypt) {
      try {
        formattedOrder.username = decrypt(order.username);
        formattedOrder.password = decrypt(order.password);
        if (order.tiktok_username) {
          formattedOrder.tiktok_username = decrypt(order.tiktok_username);
        }
        if (order.whatsapp_number) {
          formattedOrder.whatsapp_number = decrypt(order.whatsapp_number);
        }
      } catch (decryptError) {
        console.error('Decryption error:', decryptError);
      }
    }

    // Format output
    const finalOrder = formatOrderResponse(formattedOrder, req);

    success(res, finalOrder, 'Order berhasil ditemukan');
  } catch (err) {
    console.error('Get order by ID error:', err);
    error(res, 'Gagal mengambil data order: ' + err.message, 500);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
};
