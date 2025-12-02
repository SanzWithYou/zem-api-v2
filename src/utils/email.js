const transporter = require('../config/mailer');

async function sendEmail({ to, subject, text = '', html = '' }) {
  try {
    if (!to) {
      throw new Error('Recipient email is required');
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

module.exports = {
  sendEmail,
};
