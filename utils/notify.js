// Backend/utils/notify.js
// Twilio + Nodemailer thin wrappers. If env vars are missing, calls are no-ops.

const twilio = require('twilio');
const nodemailer = require('nodemailer');

let smsClient = null;
if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
  smsClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
}

let mailer = null;
if (process.env.SMTP_HOST) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

exports.sendSMS = async (to, body) => {
  if (!smsClient || !to || !body) return;
  try {
    await smsClient.messages.create({ to, from: process.env.TWILIO_FROM, body });
  } catch (e) {
    console.warn('SMS send failed:', e?.message);
  }
};

exports.sendEmail = async (to, subject, text) => {
  if (!mailer || !to || !subject || !text) return;
  try {
    await mailer.sendMail({ from: process.env.SMTP_FROM || 'no-reply@medislot.local', to, subject, text });
  } catch (e) {
    console.warn('Email send failed:', e?.message);
  }
};
