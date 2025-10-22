import React, { useState } from 'react';
import axios from 'axios';
import './InstrumentDetection.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:6006';

const InstrumentDetection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Detection options
  const [options, setOptions] = useState({
    fps: 0.5,
    method: 'owlvit',
    model: 'gpt-4o',
    confidence: 0.5,
    detect_playing: true,
    max_workers: 5,
    max_resolution: 1280,
    skip_similar: true,
    skip_duplicates: true,
    image_detail: 'low'
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska', 'video/webm'];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Invalid file type. Please upload a video file (MP4, AVI, MOV, MKV, WebM)');
        setSelectedFile(null);
      }
    }
  };

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Append all options
      Object.keys(options).forEach(key => {
        formData.append(key, options[key].toString());
      });

      const response = await axios.post(
        `${API_BASE_URL}/api/instrument-detection/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': localStorage.getItem('token')
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setJobId(response.data.job_id);
        setStatus('queued');
        // Start polling for status
        startStatusPolling(response.data.job_id);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload video');
      setLoading(false);
    }
  };

  const startStatusPolling = (jId) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/instrument-detection/status/${jId}`,
          {
            headers: {
              'Authorization': localStorage.getItem('token')
            },
            withCredentials: true
          }
        );

        const jobStatus = response.data.status;
        const jobProgress = response.data.progress || 0;

        setStatus(jobStatus);
        setProgress(jobProgress);

        if (jobStatus === 'completed') {
          clearInterval(intervalId);
          fetchResults(jId);
          setLoading(false);
        } else if (jobStatus === 'failed') {
          clearInterval(intervalId);
          setError(response.data.error || 'Detection failed');
          setLoading(false);
        }

      } catch (err) {
        console.error('Status polling error:', err);
        clearInterval(intervalId);
        setError('Failed to fetch status');
        setLoading(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  const fetchResults = async (jId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instrument-detection/results/${jId}`,
        {
          headers: {
            'Authorization': localStorage.getItem('token')
          },
          withCredentials: true
        }
      );

      setResults(response.data.results);

    } catch (err) {
      console.error('Fetch results error:', err);
      setError('Failed to fetch results');
    }
  };

  const downloadFile = async (filename) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/instrument-detection/download/${jobId}/${filename}`,
        {
          headers: {
            'Authorization': localStorage.getItem('token')
          },
          withCredentials: true,
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download file');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setJobId(null);
    setStatus(null);
    setProgress(0);
    setResults(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="instrument-detection-container">
      <h1>Instrument Detection</h1>
      <p className="subtitle">Upload a video to detect musical instruments</p>

      {/* File Upload Section */}
      <div className="upload-section">
        <div className="file-input-wrapper">
          <input
            type="file"
            accept="video/mp4,video/x-msvideo,video/quicktime,video/x-matroska,video/webm"
            onChange={handleFileChange}
            disabled={loading}
            id="video-file-input"
          />
          <label htmlFor="video-file-input" className="file-input-label">
            {selectedFile ? selectedFile.name : 'Choose Video File'}
          </label>
        </div>

        {selectedFile && !loading && !results && (
          <div className="options-section">
            <h3>Detection Options</h3>

            <div className="option-group">
              <label>Detection Method:</label>
              <select
                value={options.method}
                onChange={(e) => handleOptionChange('method', e.target.value)}
              >
                <option value="owlvit">OWL-ViT + OpenAI (Recommended)</option>
                <option value="openai">OpenAI Only</option>
              </select>
            </div>

            <div className="option-group">
              <label>Model:</label>
              <select
                value={options.model}
                onChange={(e) => handleOptionChange('model', e.target.value)}
              >
                <option value="gpt-4o">GPT-4o (Higher Accuracy)</option>
                <option value="gpt-4o-mini">GPT-4o-mini (Faster)</option>
              </select>
            </div>

            <div className="option-group">
              <label>Frame Sampling Rate (FPS): {options.fps}</label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={options.fps}
                onChange={(e) => handleOptionChange('fps', parseFloat(e.target.value))}
              />
            </div>

            <div className="option-group">
              <label>Confidence Threshold: {options.confidence}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={options.confidence}
                onChange={(e) => handleOptionChange('confidence', parseFloat(e.target.value))}
              />
            </div>

            <div className="option-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.detect_playing}
                  onChange={(e) => handleOptionChange('detect_playing', e.target.checked)}
                />
                Detect Playing Status
              </label>
            </div>

            <div className="option-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.skip_similar}
                  onChange={(e) => handleOptionChange('skip_similar', e.target.checked)}
                />
                Skip Similar Frames
              </label>
            </div>
          </div>
        )}

        {!loading && !results && selectedFile && (
          <button onClick={handleUpload} className="upload-button">
            Start Detection
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Progress Display */}
      {loading && (
        <div className="progress-section">
          <h3>Processing Video...</h3>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}>
              {progress}%
            </div>
          </div>
          <p className="status-text">Status: {status}</p>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="results-section">
          <h2>Detection Results</h2>

          <div className="summary-cards">
            <div className="summary-card">
              <h4>{results.summary.total_instruments}</h4>
              <p>Total Instruments</p>
            </div>
          </div>

          <h3>Detected Instruments</h3>
          <div className="instruments-list">
            {results.summary.instruments_detected.map((instrument, index) => (
              <div key={index} className="instrument-item">
                {results.instrument_images && results.instrument_images[instrument] ? (
                  <img
                    src={`${API_BASE_URL}/api/instrument-detection/download/${jobId}/${results.instrument_images[instrument]}`}
                    alt={instrument}
                    className="instrument-image"
                    onClick={() => downloadFile(results.instrument_images[instrument])}
                  />
                ) : (
                  <div className="no-image-placeholder">No image available</div>
                )}
                <p className="instrument-name">{instrument}</p>
              </div>
            ))}
          </div>

          <div className="download-section">
            <button
              onClick={() => downloadFile(results.json_file)}
              className="download-button"
            >
              Download Complete Analysis (JSON)
            </button>

            <button
              onClick={handleReset}
              className="reset-button"
            >
              Detect Another Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstrumentDetection;
