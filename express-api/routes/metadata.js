const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Custom storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userUuid = uuidv4();
        const userFolder = path.join(__dirname, '../uploads', userUuid);
        if (!fs.existsSync(userFolder)) {
            fs.mkdirSync(userFolder, { recursive: true });
        }
        req.userUuid = userUuid; // Attach the UUID to the request for later use
        cb(null, userFolder);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

const sanitizeKey = (key) => key.replace(/[^a-zA-Z0-9_]/g, '');

router.post('/upload', upload.single('video'), (req, res) => {
    const videoPath = req.file.path;
    exec(`ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`, (error, stdout) => {
        if (error) {
            console.error(`Error executing ffprobe: ${error}`);
            return res.status(500).json({ error: 'Failed to extract metadata' });
        }

        try {
            const metadata = JSON.parse(stdout);
            metadata.filename = req.file.filename;
            metadata.originalname = req.file.originalname;
            metadata.userUuid = req.userUuid; // Include UUID for reference
            res.json(metadata);
        } catch (parseError) {
            console.error('Error parsing ffprobe output:', parseError);
            res.status(500).json({ error: 'Error parsing metadata' });
        }
    });
});

router.post('/save', (req, res) => {
    const { filename, customProperties, userUuid } = req.body;

    // Validate request payload
    if (!filename) {
        console.error('Error: "filename" is missing in the request body');
        return res.status(400).json({ error: '"filename" is required' });
    }
    if (!userUuid) {
        console.error('Error: "userUuid" is missing in the request body');
        return res.status(400).json({ error: '"userUuid" is required' });
    }

    const userFolder = path.join(__dirname, '../uploads', userUuid);
    const originalFilePath = path.join(userFolder, filename);
    const updatedFilePath = path.join(userFolder, `updated_${filename}`);

    console.log("Original file path:", originalFilePath);
    console.log("Does the original file exist?", fs.existsSync(originalFilePath));

    if (!fs.existsSync(originalFilePath)) {
        return res.status(404).json({ error: 'Video file not found' });
    }

    // Apply each metadata option separately
    const ffmpegCommand = ffmpeg(originalFilePath).output(updatedFilePath);

    Object.entries(customProperties || {}).forEach(([key, value]) => {
        const sanitizedKey = sanitizeKey(key);
        ffmpegCommand.outputOption('-metadata', `${sanitizedKey}=${value}`);
    });

    ffmpegCommand
        .outputOptions('-map_metadata 0') // Copy all metadata from input
        .outputOptions('-c:v libx264') // Force re-encoding to apply metadata
        .outputOptions('-c:a aac')    // Re-encode audio to ensure compatibility with .mp4
        .on('end', () => {
            console.log("Metadata applied, now verifying with ffprobe...");

            exec(`ffprobe -v quiet -print_format json -show_format -show_streams "${updatedFilePath}"`, (error, stdout) => {
                if (error) {
                    console.error(`Error verifying metadata: ${error}`);
                    return res.status(500).json({ error: 'Failed to verify metadata in updated file' });
                }

                try {
                    const updatedMetadata = JSON.parse(stdout);

                    const metadataCheck = Object.entries(customProperties || {}).every(([key, value]) =>
                        updatedMetadata.format?.tags?.[sanitizeKey(key)] === value
                    );

                    if (!metadataCheck) {
                        console.error("Verification failed: Metadata not found as expected.");
                        return res.status(500).json({ error: 'Metadata embedding verification failed' });
                    }

                    // Schedule folder cleanup after 30 minutes
                    setTimeout(() => {
                        if (fs.existsSync(userFolder)) {
                            fs.rmSync(userFolder, { recursive: true, force: true });
                            console.log(`User folder ${userFolder} deleted after 30 minutes.`);
                        }
                    }, 30 * 60 * 1000); // 30 minutes

                    res.status(200).json({
                        message: 'Metadata saved and verified successfully',
                        downloadPath: `/api/metadata/download/${userUuid}/${path.basename(updatedFilePath)}` // Include userUuid
                    });
                } catch (parseError) {
                    console.error('Error parsing ffprobe verification output:', parseError);
                    res.status(500).json({ error: 'Failed to parse verification metadata' });
                }
            });
        })
        .on('error', (error) => {
            console.error('Error updating metadata:', error);
            res.status(500).json({ error: 'Failed to save metadata' });
        })
        .run();
});



router.get('/download/:userUuid/:filename', (req, res) => {
    console.log('Request Parameters:', req.params);

    const { userUuid, filename } = req.params;

    // Construct the correct file path using userUuid and filename
    const filePath = path.join(__dirname, '../uploads', userUuid, filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath); // Serve the file for download
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

  

module.exports = router;
