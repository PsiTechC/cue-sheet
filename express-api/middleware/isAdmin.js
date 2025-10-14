const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET;


require('dotenv').config();

const isAdmin = async (req, res, next) => {
  const token = req.cookies?.token;


  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      decoded.email !== process.env.admin || 
      !decoded.isAdmin
    ) {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }


    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = isAdmin;
