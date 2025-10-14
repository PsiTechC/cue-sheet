const express = require('express');
const axios = require('axios');

const router = express.Router();

const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
router.post('/translate', async (req, res) => {
    try {
        const { q, target } = req.body; 
        const payload = {
            q,      
            target, 
        };

        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
            payload
        );

        res.json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).send(error.response.data.error.message);
        } else {
            res.status(500).send('Unexpected Error');
        }
    }
});



router.post('/tts', async (req, res) => {
    try {
        const { input, voice, audioConfig } = req.body;

        const text = input?.text; 
        const languageCode = voice?.languageCode; 
        const voiceName = voice?.name; 

        if (!text || !languageCode || !voiceName) {
            return res.status(400).send('Missing required fields: text, languageCode, or voiceName');
        }

        const payload = {
            input: { text }, 
            voice: { languageCode, name: voiceName }, 
            audioConfig: { audioEncoding: audioConfig?.audioEncoding || 'MP3' }, 
        };

        const response = await axios.post(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
            payload
        );

        res.json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).send(error.response.data.error.message);
        } else {
            res.status(500).send('Unexpected Error in Text-to-Speech');
        }
    }
});



module.exports = router;
