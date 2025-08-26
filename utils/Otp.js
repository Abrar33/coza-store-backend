// utils/generateOTP.js
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); // ensures 6-digit number
}

module.exports = generateOTP;