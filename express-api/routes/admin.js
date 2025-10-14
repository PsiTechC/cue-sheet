// routes/admin.js
const express = require('express');
const User = require('../models/User'); 
const isAdmin = require('../middleware/isAdmin'); 
const cookieParser = require('cookie-parser');


const router = express.Router();
router.use(cookieParser());

router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;
