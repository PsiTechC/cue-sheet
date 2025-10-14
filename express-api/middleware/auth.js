

// const jwt = require('jsonwebtoken');
// const JWT_SECRET = process.env.JWT_SECRET;

// const authenticateToken = (req, res, next) => {
//   const token = req.headers['authorization'];

//   if (!token) {
//     return res.status(401).json({ message: 'Access token missing' });
//   }

//   jwt.verify(token, JWT_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(403).json({ message: 'Invalid token' });
//     }
//     req.user = decoded; 
//     next();
//   });
// };

// module.exports = authenticateToken;




const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  console.log("Cookies received:", req.cookies);
  const token = req.cookies?.token;
  

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }



  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

module.exports = authenticateToken;



