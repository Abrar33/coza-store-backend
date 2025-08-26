const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/user-model');
const generateOTP = require('../utils/Otp');
const sendOTPEmail = require('../utils/emailService');


// ✅ Signup — Creates user and sends OTP
const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    const otp = generateOTP(); // e.g. 6-digit code
    await sendOTPEmail(email, otp);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      otp, // stored as plain OTP
      otpExpiry: Date.now() + 10 * 60 * 1000, // 10 min validity
      isEmailVerified: false,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully. OTP sent to email.',
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ success: false, error: 'Signup failed' });
  }
};

// 🔐 Signin — Email & password → JWT
const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Invalid credentials' });

     const accessToken = jwt.sign(
    { id: user._id, role: user.role, },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
  });

  // res.json({ accessToken, role: user.role });

    

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      role: user.role,
    });
  } catch (error) {
    console.error('Signin error:', error.message);
    res.status(500).json({ success: false, error: 'Signin failed' });
  }
};

// 📩 Verify plain OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ success: false, error: 'OTP not set' });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }

    if (user.otp !== String(otp)) {
      
      return (res.status(400).json({ success: false, error: 'Invalid OTP', otp,}));
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isEmailVerified = true;
    await user.save();

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error.message);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

module.exports = {
  signup,
  signin,
  verifyOtp,
};