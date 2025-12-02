const sequelize = require('../config/sequelize');
const { success, error } = require('../utils/response');
const { sendEmail } = require('../utils/email');

const APP_NAME = process.env.APP_NAME || 'Application';
const FOOTER_APP_NAME = APP_NAME.toLocaleLowerCase();

/**
 * =====================
 * Health Check Endpoint
 * =====================
 */
const healthCheck = async (req, res) => {
  const healthStatus = {
    service: APP_NAME,
    database: false,
    api: true,
    timestamp: new Date().toISOString(),
  };

  try {
    await sequelize.query('SELECT 1');
    healthStatus.database = true;
  } catch (err) {
    console.error(`[${APP_NAME}] Health detail error:`, err);
    healthStatus.database = false;
  }

  if (healthStatus.database) {
    success(res, healthStatus, 'Semua sistem normal');
  } else {
    error(res, 'Beberapa sistem bermasalah', 503);
  }
};

/**
 * =====================
 * Test SMTP Email Endpoint
 * =====================
 * Email hanya dikirim ke SMTP_USER (email admin)
 */
const testEmail = async (req, res) => {
  try {
    const receiver = process.env.SMTP_USER;

    if (!receiver) {
      throw new Error('SMTP_USER not configured');
    }

    await sendEmail({
      to: receiver,
      subject: `✅ ${APP_NAME} || SMTP Test Success`,
      html: `
        <div style="font-family: Arial; max-width:600px; margin:auto;">
          <h2>🚀 ${APP_NAME}</h2>

          <p>SMTP berhasil dikonfigurasi dan server sedang berjalan normal.</p>

          <ul>
            <li><b>Service:</b> ${APP_NAME}</li>
            <li><b>Status:</b> OK</li>
            <li><b>Time:</b> ${new Date().toLocaleString()}</li>
          </ul>

          <hr/>

          <p style="color:#666; margin-top:16px;">
            Email ini dikirim otomatis oleh sistem backend ${FOOTER_APP_NAME}.
          </p>
        </div>
      `,
    });

    success(
      res,
      {
        app: APP_NAME,
        email: receiver,
        status: 'sent',
      },
      'Test email berhasil dikirim'
    );
  } catch (err) {
    console.error(`[${APP_NAME}] Email test error:`, err);
    error(res, 'Gagal mengirim test email', 500);
  }
};

module.exports = {
  healthCheck,
  testEmail,
};
