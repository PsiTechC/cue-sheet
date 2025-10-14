const express = require('express');
const UserMinutes = require('../models/UserMinutes');  // Import UserMinutes model
const User = require('../models/User');  // Import User model
const authenticateToken = require('../middleware/auth');  // Authentication middleware
const router = express.Router();
const cookieParser = require('cookie-parser');
router.use(cookieParser());

router.post('/userMinutes', authenticateToken, async (req, res) => {
  const { minutesUsed } = req.body;

  if (!minutesUsed) {
    return res.status(400).json({ error: 'Missing minutesUsed in request' });
  }

  try {
    const email = req.user.email;  // Assuming the token contains the user's email

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: 'User not found' });
    }

    let userMinutes = await UserMinutes.findOne({ userId: user._id });

    if (!userMinutes) {
      console.log(`User minutes record not found for user: ${user._id}`);

      userMinutes = new UserMinutes({
        userId: user._id,
        minutesUsed: 0,  // Default to 0 minutes if no record is found
      });
      await userMinutes.save();
      console.log(`Created new UserMinutes record for user: ${user._id}`);
    }

    const minutesUsedInMinutes = minutesUsed / 60;  // Convert seconds to minutes

    console.log(`Minutes used (converted): ${minutesUsedInMinutes} minutes`);

    const updatedMinutes = userMinutes.minutesUsed - minutesUsedInMinutes;

    if (updatedMinutes < 0) {
      return res.status(400).json({ error: 'Not enough minutes available' });
    }

    userMinutes.minutesUsed = updatedMinutes;
    await userMinutes.save();

    const roundedMinutes = updatedMinutes.toFixed(2);

    console.log(`User ID: ${user._id} - Deducted ${minutesUsedInMinutes} minutes. New balance: ${roundedMinutes} minutes`);

    res.status(200).json({ message: 'Minutes deducted successfully', newMinutesBalance: roundedMinutes });
  } catch (error) {
    console.error('Error deducting minutes:', error);
    res.status(500).json({ message: 'Server error while updating minutes' });
  }
});


  // Endpoint to get user minutes
router.get('/userMinutes', authenticateToken, async (req, res) => {
    try {
      // Extract the authenticated user's email from the token
      const email = req.user.email;  // Assuming the token contains the user's email
  
      // Fetch the user from the database using the email
      const user = await User.findOne({ email });
  
      if (!user) {
        console.log("User not found for email:", email);
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Find the user's minutes record in the UserMinutes collection using the user ID
      const userMinutes = await UserMinutes.findOne({ userId: user._id });
  
      if (!userMinutes) {
        return res.status(404).json({ message: 'User minutes record not found' });
      }
  
      // Respond back with the user's minutes
      res.status(200).json({ minutesUsed: userMinutes.minutesUsed });
    } catch (error) {
      console.error('Error fetching user minutes:', error);
      res.status(500).json({ message: 'Server error while fetching minutes' });
    }
  });
  
  

module.exports = router;
