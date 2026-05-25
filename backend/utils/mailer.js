const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const sendEmail = async (to, subject, text, html) => {
  if (!transporter) {
    console.log(`[MAILER MOCK] Skip email (SMTP not configured). To: ${to} | Subject: ${subject}`);
    return { messageId: 'mock-id-' + Date.now() };
  }
  try {
    const info = await transporter.sendMail({
      from: `"TalentCollab" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw, just log. We don't want to break the app if email fails.
  }
};

module.exports = { sendEmail };
