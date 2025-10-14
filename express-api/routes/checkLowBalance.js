const nodemailer = require('nodemailer');
const UserMinutes = require('../models/UserMinutes');  // Import UserMinutes model
const User = require('../models/User');  // Import User model

// Configure the nodemailer transport
const transporter = nodemailer.createTransport({
  host: 'mail.psitechconsultancy.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.EMAIL_PASS,  
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Helper function to send email
const sendLowBalanceEmail = async (email, availableBalance) => {
  try {
    await transporter.sendMail({
      from: '"MEDai" <connect@psitechconsultancy.com>',
      to: email,
      subject: 'Low Balance Alert - Action Required',
      text: `Dear User,

      Your account balance is low. Your current balance is ${availableBalance} minutes. Please top-up to avoid any interruptions in your service.

      Best regards,
      MEDai Team`,
      html: `<p>Dear User,</p>
             <p>Your account balance is low. Your current balance is <b>${availableBalance}</b> minutes.</p>
             <p>Please top-up to avoid any interruptions in your service.</p>
             <p>Best regards,</p>
             <p>MEDai Team</p>`,
    });
    console.log(`Low balance email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending low balance email to ${email}:`, error);
  }
};

// Function to check the user's balance every 10 minutes
const checkLowBalanceEvery10Minutes = () => {
  setInterval(async () => {
    try {
      // Get all users with their corresponding user minutes data
      const users = await User.find();

      for (let user of users) {
        const userMinutes = await UserMinutes.findOne({ userId: user._id });

        if (!userMinutes) {
          console.log(`User minutes record not found for user: ${user._id}`);
          continue;
        }

        const currentBalance = userMinutes.minutesUsed;
        const email = user.email;

        // If balance is less than 50 and email hasn't been sent yet, send email
        if (currentBalance < 5000 && !userMinutes.lowBalanceEmailSent) {
          await sendLowBalanceEmail(email, currentBalance.toFixed(2));
          userMinutes.lowBalanceEmailSent = true;  // Set the flag to true to prevent future emails
        }

        // If balance is more than 50 and email was already sent, reset the flag
        if (currentBalance >= 5000 && userMinutes.lowBalanceEmailSent) {
          userMinutes.lowBalanceEmailSent = false;  // Reset flag if balance is above 50
        }

        // Save the updated user minutes record
        await userMinutes.save();
      }

      console.log('Balance check completed for all users.');
    } catch (error) {
      console.error('Error checking low balances:', error);
    }
  }, 20 * 60 * 1000); 
};

module.exports = { checkLowBalanceEvery10Minutes };
