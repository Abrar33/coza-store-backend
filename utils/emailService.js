// utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,     // Set this in .env
    pass: process.env.EMAIL_PASSWORD, // App password if 2FA is enabled
  },
});

function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to:email,
    subject: 'Your ShopSphere OTP Code',
    text: `Welcome to ShopSphere! Your verification code is ${otp}. It's valid for 10 minutes.`,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendOTPEmail;