const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const { spawn } = require("child_process");

const router = express.Router();
router.use(cors({ origin: "http://localhost:3001" }));

const upload = multer({ dest: "uploads/" });
let transcriptionResult = []; // Store the final transcription result

// Convert audio file to WAV format if needed
const convertToWav = async (filePath) => {
  const wavPath = path.join("uploads", "converted_audio.wav");
  console.log(`[convertToWav] Starting conversion for ${filePath}`);
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn("ffmpeg", ["-i", filePath, "-ar", "16000", wavPath]);
    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        console.log(`[convertToWav] Conversion successful. Output: ${wavPath}`);
        resolve(wavPath);
      } else {
        console.error("[convertToWav] Failed to convert audio to WAV format");
        reject(new Error("Failed to convert audio to WAV format"));
      }
    });
  });
};

// Upload endpoint
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    console.error("[/upload] No file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }
  console.log(`[/upload] File uploaded successfully: ${req.file.path}`);
  res.json({ message: "File uploaded successfully", file_path: req.file.path });
});

// Process audio endpoint
router.post("/process_audio", async (req, res) => {
    const { file_path: filePath } = req.body;
  
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: "Invalid or missing file path" });
    }
  
    transcriptionResult = []; // Clear previous transcription
  
    try {
      const audioFilePath = await convertToWav(filePath);
      const pythonScriptPath = path.join(__dirname, "routes", "audio_processing.py");
  
      const pythonProcess = spawn("python3", [pythonScriptPath, audioFilePath]);
  
      let output = "";
  
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
  
      pythonProcess.stderr.on("data", (data) => {
        console.error("Python error:", data.toString());
      });
  
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          transcriptionResult.push(output.trim());
  
          // Clean up temporary files
          fs.remove(filePath).catch((err) => console.error("Failed to remove file:", err));
          fs.remove(audioFilePath).catch((err) => console.error("Failed to remove audio file:", err));
  
          res.json({ message: "Processing complete", transcription: transcriptionResult });
        } else {
          res.status(500).json({ error: "Python transcription failed" });
        }
      });
    } catch (error) {
      res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
  });
  

// Get transcription endpoint
router.get("/get_transcription", (req, res) => {
  console.log(`[/get_transcription] Returning transcription result`);
  res.json({ transcription: transcriptionResult });
});

module.exports = router;
