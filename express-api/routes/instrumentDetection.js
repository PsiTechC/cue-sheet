const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const authenticateToken = require('../middleware/auth');

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska', 'video/webm'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Instrument Detection Service URL
const INSTRUMENT_DETECTION_SERVICE = process.env.INSTRUMENT_DETECTION_SERVICE || 'http://localhost:8001';

/**
 * Upload video for instrument detection
 * POST /api/instrument-detection/upload
 */
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // Get user ID from authenticated token
    const userId = req.user.id;

    // Create form data to forward to microservice
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('userId', userId);

    // Forward detection options from request body
    const options = {
      fps: req.body.fps || '0.5',
      method: req.body.method || 'owlvit',
      model: req.body.model || 'gpt-4o',
      confidence: req.body.confidence || '0.5',
      detect_playing: req.body.detect_playing || 'true',
      max_workers: req.body.max_workers || '5',
      max_resolution: req.body.max_resolution || '1280',
      skip_similar: req.body.skip_similar || 'true',
      skip_duplicates: req.body.skip_duplicates || 'true',
      image_detail: req.body.image_detail || 'low'
    };

    // Append options to form data
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });

    // Forward request to instrument detection microservice
    const response = await axios.post(
      `${INSTRUMENT_DETECTION_SERVICE}/upload`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('Error uploading to instrument detection service:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to upload video to instrument detection service' });
    }
  }
});

/**
 * Get detection job status
 * GET /api/instrument-detection/status/:jobId
 */
router.get('/status/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    const response = await axios.get(`${INSTRUMENT_DETECTION_SERVICE}/status/${jobId}`);
    res.json(response.data);

  } catch (error) {
    console.error('Error fetching status from instrument detection service:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  }
});

/**
 * Get detection results
 * GET /api/instrument-detection/results/:jobId
 */
router.get('/results/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    const response = await axios.get(`${INSTRUMENT_DETECTION_SERVICE}/results/${jobId}`);
    res.json(response.data);

  } catch (error) {
    console.error('Error fetching results from instrument detection service:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to fetch results' });
    }
  }
});

/**
 * Download result file (JSON or image)
 * GET /api/instrument-detection/download/:jobId/:filename
 */
router.get('/download/:jobId/:filename', authenticateToken, async (req, res) => {
  try {
    const { jobId, filename } = req.params;

    const response = await axios.get(
      `${INSTRUMENT_DETECTION_SERVICE}/download/${jobId}/${filename}`,
      { responseType: 'stream' }
    );

    // Forward headers
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', response.headers['content-disposition']);

    // Add CORS headers aligned with credentialed requests
    const allowedOrigin = req.headers.origin || process.env.REACT_FE;
    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Pipe the response
    response.data.pipe(res);

  } catch (error) {
    console.error('Error downloading file from instrument detection service:', error.message);
    if (error.response) {
      res.status(error.response.status).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Failed to download file' });
    }
  }
});

/**
 * Delete/cleanup detection job
 * DELETE /api/instrument-detection/cleanup/:jobId
 */
router.delete('/cleanup/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    const response = await axios.delete(`${INSTRUMENT_DETECTION_SERVICE}/cleanup/${jobId}`);
    res.json(response.data);

  } catch (error) {
    console.error('Error cleaning up job:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to cleanup job' });
    }
  }
});

/**
 * List all detection jobs for current user
 * GET /api/instrument-detection/jobs
 */
router.get('/jobs', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${INSTRUMENT_DETECTION_SERVICE}/jobs`);

    // Filter jobs for current user
    const userId = req.user.id;
    const userJobs = response.data.jobs.filter(job => job.user_id === userId);

    res.json({ jobs: userJobs });

  } catch (error) {
    console.error('Error fetching jobs:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }
});

/**
 * Health check for instrument detection service
 * GET /api/instrument-detection/health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${INSTRUMENT_DETECTION_SERVICE}/`);
    res.json({
      status: 'ok',
      service: response.data
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Instrument detection service is unavailable'
    });
  }
});

module.exports = router;
