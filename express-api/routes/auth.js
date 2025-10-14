const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');
const router = express.Router();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
router.use(cookieParser());




const JWT_SECRET = process.env.JWT_SECRET;


require('dotenv').config(); 

const transporter = nodemailer.createTransport({
  host: 'mail.psitechconsultancy.com',
  port: 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.EMAIL_PASS,  
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); 
};

const sendOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: '"MEDai" <connect@psitechconsultancy.com>',
      to: email,
      subject: 'Your OTP for MEDai Signup',
      text: `Dear User,

Thank you for using MEDai!

Your One-Time Password (OTP) for login is: ${otp}

Please use this OTP to complete your login process. The OTP is valid for the next 10 minutes.

If you did not request this OTP, please ignore this email.

Best regards,
PsiTech Team`,
      html: `<p>Dear User,</p>
           <p>Thank you for using <b>MEDai</b>!</p>
           <p>Your One-Time Password (OTP) for login is: <b>${otp}</b></p>
           <p>Please use this OTP to complete your login process. The OTP is valid for the next 10 minutes.</p>
           <p>If you did not request this OTP, please ignore this email.</p>
           <p>Best regards,</p>
           <p><b>PsiTech Team</b>`,
    });
    console.log(`OTP sent to ${email}, otp: "${otp}"`); 
  } catch (error) {
    console.error(`Error sending OTP to ${email}:`, error);
  }
};


router.post('/signup', async (req, res) => {
  console.log('Signup route called'); 

  const { email, password, otp } = req.body; 

  if (!email || !password) {
    console.log('Email and password are required for signup');
    return res.status(400).json({ message: 'Email and password are required' });
  }


  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log(`Signup attempt: User already exists with email ${email}`);
    return res.status(400).json({ message: 'User already exists' });
  }


  const salt = await bcrypt.genSalt(15);  
  console.log(`Generated salt: ${salt}`); 

  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(`Hashed password with salt: ${hashedPassword}`); 


  const generatedOTP = generateOTP();
  await sendOTP(email, generatedOTP);

  const newUser = new User({ email, password: hashedPassword, otp: generatedOTP });
  await newUser.save();

  console.log(`New user created with email: ${newUser.email}`);

  if (otp) {
    console.log(`OTP verification attempt for user: ${email}, user otp: "${otp}"`);
    if (newUser.otp === otp) {
      console.log(`OTP verification successful for user: ${email}`);
      newUser.otp = undefined; 
      await newUser.save(); 
      const token = jwt.sign({ email: newUser.email }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ success: true, token });
    } else {
      console.log(`Invalid OTP attempt for user: ${email}`);
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  }

  res.json({ success: true, message: 'OTP sent to email. Please verify your OTP.' });
});


router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  console.log(`OTP verification attempt for user: ${email}`);


  const user = await User.findOne({ email });
  if (!user) {
    console.log(`OTP verification failed: User not found for email ${email}`);
    return res.status(400).json({ message: 'User not found' });
  }

  if (user.otp === otp) {
    console.log(`OTP verification successful for user: ${email}`);

    user.otp = undefined; 
    await user.save

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ success: true, token });
  } else {
    console.log(`Invalid OTP attempt for user: ${email}`);
    return res.status(400).json({ message: 'Invalid OTP' });
  }
});


router.post('/login', async (req, res) => {
  console.log('Login route called');

  const { email, password } = req.body;

  try {

    if (email === process.env.admin) {
      console.log(`Admin login attempt for email: ${email}`);

      if (password !== process.env.pass) {
        console.log('Invalid admin password');
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      console.log('Admin login successful');

      const token = jwt.sign(
        { id: 'admin', email: process.env.admin, isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      console.log('Generated Admin JWT Token');

      res.cookie('token', token, {
        httpOnly: true, 
        secure: true, 
        sameSite: 'None',
        maxAge: 24 * 60 * 60 * 1000, 
      });

      return res.json({ success: true, isAdmin: true });
    }

    console.log(`Regular user login attempt for email: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: User not found for email ${email}`);
      return res.status(400).json({ message: 'User does not exist' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isAccess) {
      console.log(`Access denied for user: ${email}`);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`Login successful for user: ${email}`);

    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Generated JWT Token');

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, isAdmin: user.isAdmin });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;


  const user = await User.findOne({ email });
  if (!user) {
    console.log(`User not found for email: ${email}`);
    return res.status(404).json({ message: 'User not found' });
  }

  const generatedOTP = generateOTP();
  await sendOTP(email, generatedOTP);


  user.otp = generatedOTP;
  await user.save();

  console.log(`OTP sent to ${email} for password reset`);
  res.status(200).json({ message: 'OTP sent to email. Please verify the OTP to reset your password.' });
});


router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;


  const user = await User.findOne({ email });
  if (!user) {
    console.log(`User not found for email: ${email}`);
    return res.status(404).json({ message: 'User not found' });
  }


  if (user.otp !== otp) {
    console.log(`Invalid OTP attempt for user: ${email}`);
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  const salt = await bcrypt.genSalt(15);  
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  user.otp = undefined;
  await user.save();

  console.log(`Password reset successful for user: ${email}`);
  res.status(200).json({ success: true, message: 'Password reset successfully' });

});

router.get('/user-email', authenticateToken, async (req, res) => {
  const { email } = req.user; 

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User not found for token email: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ email: user.email, isAccess: user.isAccess });
  } catch (error) {
    console.error('Error fetching user email:', error);
    return res.status(403).json({ message: 'Failed to authenticate token' });
  }
});


module.exports = router;