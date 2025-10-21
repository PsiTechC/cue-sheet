
import React, { useState } from "react";
import axios from "axios";
import Alert from "./Alert";
import PageHeader from "./PageHeader";

const AutoSubtitling = () => {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("en-US");
  const [transcription, setTranscription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);

  const PYTHON_API_BASE = process.env.REACT_APP_API_BASE_URL_TS;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setAlertMessage("Please choose a file first!");
      setAlertType("error");
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post(`${PYTHON_API_BASE}/uploads`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Save the file path returned by the backend
      setFilePath(response.data.file_path);

      setAlertMessage("File uploaded successfully!");
      setAlertType("success");
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      setAlertMessage("Failed to upload file.");
      setAlertType("error");
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };

  const handleStartProcessing = async () => {
    if (!filePath) {
      setAlertMessage("Please upload the file first.");
      setAlertType("error");
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      return;
    }
    setIsProcessing(true);
    setTranscription("");
    try {
      const response = await axios.post(`${PYTHON_API_BASE}/process_audio`, {
        file_path: filePath, 
        language,
      });

      // Display transcription
      setTranscription(response.data.transcription);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error starting transcription:", error);
      setAlertMessage("Error processing the file.");
      setAlertType("error");
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      setIsProcessing(false);
    }
  };


  const handleDownload = () => {
    const blob = new Blob([transcription], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transcription.vtt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] transition-colors duration-300">
      <PageHeader title="Auto Subtitling" />
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {/* Main Content Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Audio Transcription</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Upload an audio file to generate automatic subtitles</p>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-6 rounded font-medium text-sm transition-colors uppercase tracking-wide flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Audio
              </button>
              <button
                onClick={handleStartProcessing}
                disabled={isProcessing || !filePath}
                className={`py-2.5 px-6 rounded font-medium text-sm transition-colors uppercase tracking-wide flex items-center justify-center gap-2 ${
                  isProcessing || !filePath
                    ? 'bg-surface-200 text-surface-400 cursor-not-allowed'
                    : 'border border-surface-300 hover:bg-surface-50 text-surface-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isProcessing ? 'Processing...' : 'Start Process'}
              </button>
            </div>
          </div>

          {/* Transcription Area */}
          <div className="p-6">
            <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">
              Transcription Output
            </label>
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="Subtitles will appear here after processing..."
              rows="12"
              className="w-full px-4 py-3 border border-surface-300 rounded text-surface-900 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition bg-white font-mono resize-none"
            ></textarea>

            {/* Download Button */}
            {transcription && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleDownload}
                  className="bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded font-medium text-sm transition-colors uppercase tracking-wide flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download VTT File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl text-center">
            <div className="loader mb-4"></div>
            <p className="text-surface-700 font-medium">Processing audio file...</p>
            <p className="text-sm text-surface-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full border border-surface-200 shadow-xl">
            {/* Modal Header */}
            <div className="border-b border-surface-200 px-6 py-4 flex items-center justify-between bg-surface-50">
              <h2 className="text-lg font-semibold text-surface-900">Upload Audio File</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-surface-400 hover:text-surface-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-5">
                <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">
                  Audio File <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".mp3,.wav"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2.5 border border-surface-300 rounded text-surface-900 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition bg-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-secondary-50 file:text-secondary-700 hover:file:bg-secondary-100"
                  />
                </div>
                <p className="text-xs text-surface-500 mt-1">Supported formats: MP3, WAV</p>
                {file && (
                  <p className="text-xs text-secondary-600 mt-2 font-medium">Selected: {file.name}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">
                  Language <span className="text-error-500">*</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 border border-surface-300 rounded text-surface-900 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition bg-white"
                >
                  <option value="en-US">English (US)</option>
                  <option value="hi-IN">Hindi (India)</option>
                  <option value="es">Spanish (Spain)</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-surface-300 hover:bg-surface-50 text-surface-700 py-2.5 px-4 rounded font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file}
                  className={`flex-1 py-2.5 px-4 rounded font-medium text-sm transition-colors uppercase tracking-wide ${
                    !file
                      ? 'bg-surface-200 text-surface-400 cursor-not-allowed'
                      : 'bg-secondary-600 hover:bg-secondary-700 text-white'
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
    </div>
  );
};

export default AutoSubtitling;



// import React from 'react';

// const GenreIdentification = () => {
//   return (
//     <div className="text-white" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
//       <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E] bg-[#1E1E1E]">
//         <h2 className="text-xl font-normal text-center flex-grow">Auto Subtitling</h2>
//       </div>

//       <div className="p-4">
//         <p className="text-center text-gray-400 text-lg mt-20">Access Restricted by Admin</p>
//       </div>
//     </div>
//   );
// };

// export default GenreIdentification;
