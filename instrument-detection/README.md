# Instrument Detection Microservice

AI-powered musical instrument detection and tracking system for video analysis using OpenAI Vision and OWL-ViT models.

## Overview

This microservice provides a REST API for detecting and tracking musical instruments in video files. It uses advanced computer vision models to identify instruments, track them across frames, and provide comprehensive analysis including:

- **200+ instrument types** supported
- **Temporal tracking** across video frames
- **Playing status detection** (whether instruments are actively being played)
- **Confidence scoring** for each detection
- **Bounding box localization** for each instrument
- **JSON export** with complete analysis data

## Architecture

This microservice follows the same pattern as `ShazamAPI-main`:

```
instrument-detection/
├── app.py                    # Flask REST API server
├── models.py                 # MongoDB models
├── requirements.txt          # Python dependencies
├── .env                      # Environment configuration
├── uploads/                  # Temporary video storage
├── results/                  # Detection results storage
└── utils/                    # Detection utilities
    ├── openai_detector.py
    ├── owlvit_detector.py
    ├── video_processor.py
    ├── tracker.py
    ├── consolidator.py
    └── ...
```

## Features

### Detection Methods

1. **OWL-ViT + OpenAI (Recommended)**
   - Uses Google's OWL-ViT for initial object detection
   - OpenAI GPT-4o for classification and playing status
   - Cost-optimized with caching
   - Best accuracy/cost trade-off

2. **OpenAI Only**
   - Pure OpenAI Vision API approach
   - Structured outputs with JSON schema
   - Simpler but potentially higher API costs

### Key Capabilities

- **Frame Sampling**: Configurable FPS (0.5-5.0)
- **Similar Frame Skipping**: Reduces redundant processing
- **Multi-Object Tracking**: Hungarian algorithm + IoU matching
- **Skin Detection**: Filters out crops containing faces
- **Sharpness Selection**: Choose clearest frames for display
- **Parallel Processing**: Concurrent API requests (1-10 workers)
- **MongoDB Integration**: Persistent storage of results
- **User Minutes Tracking**: Automatic usage tracking

## Installation

### Prerequisites

- Python 3.12+
- MongoDB (connection URI required)
- OpenAI API Key
- CUDA-capable GPU (optional, for OWL-ViT)

### Setup

1. **Install Dependencies**
   ```bash
   cd instrument-detection
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**

   Edit `.env` file:
   ```bash
   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # MongoDB Configuration
   MONGO_URI=mongodb+srv://user:pass@host/database

   # Frontend URL (for CORS)
   REACT_FE=http://localhost:3000

   # Service Port
   PORT=8001
   ```

3. **Start the Service**
   ```bash
   python app.py
   ```

   The service will start on `http://localhost:8001`

## API Endpoints

### 1. Health Check
```
GET /
```

**Response:**
```json
{
  "service": "Instrument Detection Microservice",
  "status": "running",
  "version": "1.0.0"
}
```

### 2. Upload Video for Detection
```
POST /upload
```

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Video file (MP4, AVI, MOV, MKV, WebM)
  - `userId`: User ID (optional, for tracking)
  - `fps`: Frame sampling rate (default: 0.5)
  - `method`: Detection method (`owlvit` or `openai`, default: `owlvit`)
  - `model`: OpenAI model (`gpt-4o` or `gpt-4o-mini`, default: `gpt-4o`)
  - `confidence`: Confidence threshold (0.0-1.0, default: 0.5)
  - `detect_playing`: Detect playing status (`true` or `false`, default: `true`)
  - `max_workers`: Parallel workers (1-10, default: 5)
  - `max_resolution`: Max frame resolution (640-1920, default: 1280)
  - `skip_similar`: Skip similar frames (`true` or `false`, default: `true`)
  - `skip_duplicates`: Skip duplicate objects (`true` or `false`, default: `true`)
  - `image_detail`: Image detail level (`low` or `high`, default: `low`)

**Response:**
```json
{
  "success": true,
  "job_id": "uuid-string",
  "message": "Video uploaded successfully. Processing started.",
  "filename": "video.mp4"
}
```

### 3. Get Job Status
```
GET /status/<job_id>
```

**Response:**
```json
{
  "job_id": "uuid-string",
  "user_id": "user123",
  "filename": "video.mp4",
  "status": "processing",
  "progress": 45,
  "created_at": "2024-10-22T12:00:00",
  "options": {...}
}
```

**Status Values:**
- `queued`: Job is waiting to start
- `processing`: Currently being processed
- `completed`: Successfully completed
- `failed`: Processing failed

### 4. Get Detection Results
```
GET /results/<job_id>
```

**Response:**
```json
{
  "job_id": "uuid-string",
  "status": "completed",
  "results": {
    "json_file": "analysis_uuid.json",
    "instrument_images": {
      "guitar": "guitar.jpg",
      "drums": "drums.jpg"
    },
    "summary": {
      "total_instruments": 3,
      "total_tracks": 5,
      "total_detections": 45,
      "instruments_detected": ["guitar", "drums", "vocals"]
    }
  }
}
```

### 5. Download Result File
```
GET /download/<job_id>/<filename>
```

Downloads JSON analysis file or instrument image.

### 6. Cleanup Job
```
DELETE /cleanup/<job_id>
```

Removes job files and database records.

### 7. List Jobs
```
GET /jobs
```

Returns list of all active detection jobs.

## Integration with Express API

The microservice is integrated into the main Express API via proxy routes:

```javascript
// express-api/routes/instrumentDetection.js
router.post('/upload', authenticateToken, upload.single('file'), ...);
router.get('/status/:jobId', authenticateToken, ...);
router.get('/results/:jobId', authenticateToken, ...);
router.get('/download/:jobId/:filename', authenticateToken, ...);
router.delete('/cleanup/:jobId', authenticateToken, ...);
router.get('/jobs', authenticateToken, ...);
```

**Base URL:** `http://localhost:6006/api/instrument-detection`

## Frontend Integration

### React Component Usage

```javascript
import InstrumentDetection from './Components/InstrumentDetection';

function App() {
  return (
    <div>
      <InstrumentDetection />
    </div>
  );
}
```

### API Calls Example

```javascript
// Upload video
const formData = new FormData();
formData.append('file', videoFile);
formData.append('fps', '0.5');
formData.append('method', 'owlvit');

const response = await axios.post(
  'http://localhost:6006/api/instrument-detection/upload',
  formData,
  {
    headers: {
      'Authorization': localStorage.getItem('token')
    },
    withCredentials: true
  }
);

const jobId = response.data.job_id;

// Poll for status
const statusResponse = await axios.get(
  `http://localhost:6006/api/instrument-detection/status/${jobId}`,
  {
    headers: {
      'Authorization': localStorage.getItem('token')
    }
  }
);

// Fetch results when completed
if (statusResponse.data.status === 'completed') {
  const resultsResponse = await axios.get(
    `http://localhost:6006/api/instrument-detection/results/${jobId}`,
    {
      headers: {
        'Authorization': localStorage.getItem('token')
      }
    }
  );
}
```

## MongoDB Schema

### Detection Results Collection: `instrumentdetections`

```javascript
{
  job_id: String,           // Unique job identifier
  user_id: String,          // User who requested detection
  filename: String,         // Original video filename
  status: String,           // queued, processing, completed, failed
  progress: Number,         // 0-100
  options: Object,          // Detection configuration
  results: Object,          // Detection results (when completed)
  error: String,            // Error message (when failed)
  created_at: Date,         // Creation timestamp
  updated_at: Date          // Last update timestamp
}
```

## Performance Considerations

### Processing Time

- **Frame Sampling**: ~0.1s per frame
- **OpenAI Detection**: ~2-5s per frame (API latency)
- **OWL-ViT Detection**: ~1-3s per frame (local GPU)
- **Tracking**: ~0.01s per frame
- **Consolidation**: ~0.05s per instrument

### Cost Optimization

1. **Frame Sampling**: Lower FPS reduces API calls
2. **Similar Frame Skipping**: 50%+ cost reduction
3. **OWL-ViT Method**: Caches OpenAI classifications
4. **GPT-4o-mini**: 5x cheaper than GPT-4o
5. **Image Detail Low**: Faster processing, lower cost

### API Costs (OpenAI)

- **gpt-4o**: ~$0.01-0.05 per detection
- **gpt-4o-mini**: ~$0.002-0.01 per detection

**Example:** 60-second video at 0.5 FPS:
- 30 frames total
- With skip_similar: ~15 unique frames
- Cost: $0.15 - $0.75 (gpt-4o) or $0.03 - $0.15 (gpt-4o-mini)

## Supported Instruments

The system detects 200+ instruments across 8 categories:

### Strings
guitar, electric_guitar, acoustic_guitar, bass_guitar, violin, cello, viola, double_bass, harp, ukulele, banjo, mandolin, sitar, etc.

### Keyboards
piano, grand_piano, upright_piano, electric_piano, keyboard, synthesizer, organ, accordion, harpsichord, etc.

### Percussion
drums, drum_kit, snare_drum, bass_drum, tom_tom, cymbals, hi_hat, timpani, xylophone, marimba, vibraphone, etc.

### Brass
trumpet, trombone, french_horn, tuba, cornet, euphonium, saxophone, etc.

### Woodwinds
flute, clarinet, oboe, bassoon, piccolo, recorder, etc.

### Electronic
synthesizer, drum_machine, sampler, midi_controller, etc.

### Audio Equipment
microphone, speaker, amplifier, mixing_console, etc.

### World Instruments
didgeridoo, bagpipes, djembe, tabla, sitar, shamisen, etc.

## Troubleshooting

### Service Won't Start

1. Check Python version: `python --version` (requires 3.12+)
2. Verify dependencies: `pip install -r requirements.txt`
3. Check MongoDB connection in `.env`
4. Verify OpenAI API key in `.env`

### Detection Fails

1. Check video file format (MP4, AVI, MOV, MKV, WebM)
2. Verify file size < 500MB
3. Check OpenAI API key validity
4. Review logs for error messages

### Slow Processing

1. Lower FPS (try 0.5 instead of 1.0)
2. Enable skip_similar frames
3. Use gpt-4o-mini instead of gpt-4o
4. Reduce max_resolution (try 640 instead of 1280)
5. Use OWL-ViT method for caching benefits

### High API Costs

1. Lower frame sampling rate
2. Enable similar frame skipping
3. Use OWL-ViT method (caches classifications)
4. Switch to gpt-4o-mini model
5. Use `image_detail: 'low'`

## Security

- **Authentication**: All endpoints require JWT token
- **File Validation**: Checks file types and sizes
- **CORS**: Configured for specific frontend origin
- **Cleanup**: Automatic removal of old files (24 hours)
- **API Key**: Stored securely in environment variables

## Deployment

### Docker Deployment (Recommended)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["python", "app.py"]
```

Build and run:
```bash
docker build -t instrument-detection .
docker run -p 8001:8001 --env-file .env instrument-detection
```

### Production Considerations

1. Use a process manager (PM2, systemd, supervisord)
2. Set up proper logging
3. Configure reverse proxy (nginx)
4. Enable HTTPS
5. Set up monitoring (health checks)
6. Configure auto-restart on failure
7. Use Redis for detection status tracking (instead of in-memory)

## License

Proprietary - PSITech Consultancy

## Support

For issues or questions, contact: connect@psitechconsultancy.com
