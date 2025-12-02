const transporter = require('../config/mailer');

async function sendEmail({ to, subject, text = '', html = '' }) {
  try {
    if (!to) {
      throw new Error('Recipient email is required');
    }

    // Validasi SMTP_USER
    if (!process.env.SMTP_USER) {
      throw new Error('SMTP_USER environment variable is not set');
    }

    const mailOptions = {
      from: `"Sanz Store" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

// Fungsi untuk format HTML yang lebih baik
function createEmailTemplate(title, content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; margin-top: 20px; }
        h2 { color: #2c3e50; margin: 0; }
        p { margin-bottom: 15px; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .info-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${title}</h2>
        </div>
        <div class="content">
          <div class="info-box">
            ${content}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Sanz Store. All rights reserved.</p>
          <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  sendEmail,
  createEmailTemplate,
};
