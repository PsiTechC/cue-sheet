const express = require('express');
const SavedTable = require('../models/SavedTable');
const authenticateToken = require('../middleware/auth');
const User = require('../models/User'); 
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const router = express.Router();
router.use(cookieParser());
// Save table route
router.post('/save-table', authenticateToken, async (req, res) => {
  try {
    const { tableData } = req.body;
    const email = req.user.email;

    // Log the received data
    console.log("Received POST request to save table with email:", email);

    // Fetch the user based on the email
    const user = await User.findOne({ email });

    // Log the user object retrieved from the database

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the user ID
    console.log("User ID:", user._id);

    // Double-check if user._id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(user._id)) {
      console.error("Invalid ObjectId for user._id:", user._id);
      return res.status(500).json({ message: 'Invalid user ID' });
    }

    // Create the SavedTable object
    const savedTable = new SavedTable({
      userId: user._id,  // Use the user._id directly
      tableData,
      savedAt: new Date(),
    });

    // Log the savedTable object before saving

    // Save the table
    await savedTable.save();

    console.log("Table saved successfully for user:", user._id);

    res.status(200).json({ message: 'Table saved successfully' });
  } catch (error) {
    console.error('Error during table save process:', error);
    res.status(500).json({ message: 'Failed to save table', error: error.message });
  }
});


router.get('/get-tables', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;

    // Log the received email
    console.log("Received GET request to fetch tables for email:", email);

    // Fetch the user based on the email
    const user = await User.findOne({ email });

    // Log the user object retrieved from the database

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: 'User not found' });
    }


    // Fetch all saved tables for the user
    const savedTables = await SavedTable.find({ userId: user._id });


    res.status(200).json({ savedTables });
  } catch (error) {
    console.error('Error fetching saved tables:', error);
    res.status(500).json({ message: 'Failed to fetch saved tables', error: error.message });
  }
});

router.put('/rename-table/:tableId', authenticateToken, async (req, res) => {
  try {
    const { tableId } = req.params;
    const { newProgramName } = req.body;  // Expecting 'newProgramName' in the request body
    const email = req.user.email;

    // Log the received email and table ID
    console.log("Received request to rename Program Name for email:", email, "with tableId:", tableId);

    // Fetch the user based on the email
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the table exists and belongs to the user
    const table = await SavedTable.findOne({ _id: tableId, userId: user._id });

    if (!table) {
      console.log("Table not found or does not belong to the user:", tableId);
      return res.status(404).json({ message: 'Table not found' });
    }

    // Update the 'Program Name' in the first entry of the 'tableData' array (or whichever index you need)
    if (table.tableData.length > 0) {
      table.tableData[0]['Program Name'] = newProgramName;  // Update the program name
    }

    await table.save();

    console.log("Program Name renamed successfully for user:", user._id);
    res.status(200).json({ message: 'Program Name renamed successfully' });
  } catch (error) {
    console.error('Error renaming Program Name:', error);
    res.status(500).json({ message: 'Failed to rename Program Name', error: error.message });
  }
});


// Delete table route
router.delete('/delete-table/:tableId', authenticateToken, async (req, res) => {
  try {
    const { tableId } = req.params;
    const email = req.user.email;

    // Log the received email and table ID
    console.log("Received request to delete table for email:", email, "with tableId:", tableId);

    // Fetch the user based on the email
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the table exists and belongs to the user
    const table = await SavedTable.findOne({ _id: tableId, userId: user._id });

    if (!table) {
      console.log("Table not found or does not belong to the user:", tableId);
      return res.status(404).json({ message: 'Table not found' });
    }

    // Use deleteOne to remove the table
    await SavedTable.deleteOne({ _id: tableId, userId: user._id });

    console.log("Table deleted successfully for user:", user._id);
    res.status(200).json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ message: 'Failed to delete table', error: error.message });
  }
});


module.exports = router;
