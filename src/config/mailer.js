const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// test koneksi
transporter.verify((error, success) => {
  if (error) {
    console.log('STMP connection error', error);
  } else {
    console.log('STMP connection succecfully', success);
  }
});

module.exports = transporter;
