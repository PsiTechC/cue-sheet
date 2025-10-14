const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');
const cookieParser = require('cookie-parser');
router.use(cookieParser());

// Internal encryption key (secure this key in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 

function customEncrypt(text) {
    const key = ENCRYPTION_KEY; // Use the entire key
    const keyLength = key.length;
    let encrypted = '';

    for (let i = 0; i < text.length; i++) {
        // XOR the character code with a key character
        const xorChar = text.charCodeAt(i) ^ key.charCodeAt(i % keyLength);
        // Add a position-based shift
        const shiftedChar = xorChar + (i % 256);
        encrypted += String.fromCharCode(shiftedChar);
    }

    return Buffer.from(encrypted).toString('base64'); // Encode as Base64 for storage
}

function customDecrypt(text) {
    const key = ENCRYPTION_KEY; // Use the entire key
    const keyLength = key.length;
    const decodedText = Buffer.from(text, 'base64').toString(); // Decode Base64
    let decrypted = '';

    for (let i = 0; i < decodedText.length; i++) {
        // Reverse the position-based shift
        const shiftedChar = decodedText.charCodeAt(i) - (i % 256);
        // XOR with the key character to retrieve the original character
        const originalChar = shiftedChar ^ key.charCodeAt(i % keyLength);
        decrypted += String.fromCharCode(originalChar);
    }

    return decrypted;
}


// POST request to add accessKey and secretKey
router.post('/pkeys', authenticateToken, async (req, res) => {
    const { accessKey, secretKey, bucket } = req.body;
    const userId = req.user.id; // `authenticateToken` adds the user info to req.user

    if (!accessKey || !secretKey || !bucket) {
        return res.status(400).json({ message: 'AccessKey and SecretKey are required.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Encrypt the keys
        const encryptedAccessKey = customEncrypt(accessKey);
        const encryptedSecretKey = customEncrypt(secretKey);
        const encryptedBucket = customEncrypt(bucket);

        // Update the user with the encrypted keys
        user.accessKey = encryptedAccessKey;
        user.secretKey = encryptedSecretKey;
        user.bucket = encryptedBucket;
        await user.save();

        res.status(200).json({ message: 'Keys added successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// GET request to retrieve and decrypt keys
router.get('/gkeys', authenticateToken, async (req, res) => {
    const userId = req.user.id; // `authenticateToken` adds the user info to req.user

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (!user.accessKey || !user.secretKey || !user.bucket) {
            return res.status(404).json({ message: 'Keys not found for this user.' });
        }

        // Decrypt the keys
        const decryptedAccessKey = customDecrypt(user.accessKey);
        const decryptedSecretKey = customDecrypt(user.secretKey);
        const decryptedBucket = customDecrypt(user.bucket);

        res.status(200).json({ accessKey: decryptedAccessKey, secretKey: decryptedSecretKey, bucket: decryptedBucket });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});


// PUT request to edit existing accessKey, secretKey, and bucket
router.put('/edit-keys', authenticateToken, async (req, res) => {
    const { accessKey, secretKey, bucket } = req.body;
    const userId = req.user.id; // `authenticateToken` adds the user info to req.user

    if (!accessKey || !secretKey || !bucket) {
        return res.status(400).json({ message: 'AccessKey, SecretKey, and Bucket are required.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Encrypt the new keys and bucket
        const encryptedAccessKey = customEncrypt(accessKey);
        const encryptedSecretKey = customEncrypt(secretKey);
        const encryptedBucket = customEncrypt(bucket);

        // Update the user with the new encrypted keys and bucket
        user.accessKey = encryptedAccessKey;
        user.secretKey = encryptedSecretKey;
        user.bucket = encryptedBucket;
        await user.save();

        res.status(200).json({ message: 'Keys and bucket updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router;


module.exports = router;
