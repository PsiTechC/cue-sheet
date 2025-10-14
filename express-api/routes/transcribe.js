// routes/transcribe.js
const express = require("express");
const multer = require("multer");
const { SpeechClient } = require("@google-cloud/speech");
const fs = require("fs");
require("dotenv").config();

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const client = new SpeechClient();

router.post("/", upload.single("audio"), async (req, res) => {
    try {
        const audioPath = req.file.path;

        const audio = {
            content: fs.readFileSync(audioPath).toString("base64"),
        };
        
        const request = {
            audio: audio,
            config: {
                encoding: "LINEAR16",
                sampleRateHertz: 16000,
                languageCode: req.body.language || "en-US",
                enableAutomaticPunctuation: true,
            },
        };

        const [response] = await client.recognize(request);
        
        let transcription = "WEBVTT\n\n";
        response.results.forEach((result, index) => {
            const startTime = index * 2; // assuming 2-second intervals
            const endTime = startTime + 2;
            const transcript = result.alternatives[0].transcript;

            transcription += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
            transcription += `${transcript}\n\n`;
        });

        res.json({ transcription });
        
        // Delete file after processing
        fs.unlinkSync(audioPath);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const formatTime = (seconds) => {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${secs}.000`;
};

module.exports = router;
