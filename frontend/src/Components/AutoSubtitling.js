
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
    <div className="text-gray-800 min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]" style={{ fontFamily: "Helvetica Neue, Arial, sans-serif" }}>
      <PageHeader title="Auto Subtitling" />
      <div className="p-6">
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Upload Audio
          </button>
          <button
            onClick={handleStartProcessing}
            disabled={isProcessing}
            className={`py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md ${isProcessing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white hover:shadow-lg'}`}
          >
            Start Process
          </button>
        </div>
        <div className="mb-4">
          <textarea
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="Subtitles will appear here..."
            rows="10"
            className="w-full bg-[#fcfcfc] text-black p-2 rounded"
          ></textarea>
        </div>
        <div>
          <button
            onClick={handleDownload}
            disabled={!transcription}
            className="bg-[#669de3] hover:bg-[#9dc1f5] text-white py-2 px-4 rounded-md transition-all transform text-sm"
          >
            Download Transcription (VTT)
          </button>
        </div>
      </div>
      {isProcessing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-5 fixed-loader-container">
          <div className="loader"></div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-md max-w-sm w-full">
            <h2 className="text-xl font-semibold text-white mb-4">Upload Audio</h2>
            <input type="file" accept=".mp3,.wav" onChange={handleFileChange} className="w-full mb-4 text-gray-300" />
            <label className="text-white block mb-2">Select Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full mb-4 bg-gray-900 text-white py-2 px-3 rounded"
            >
              <option value="en-US">English (US)</option>
              <option value="hi-IN">Hindi (India)</option>
              <option value="es">Spanish (Spain)</option>
            </select>
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded mr-2 text-sm"
              >
                Upload
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm"
              >
                Cancel
              </button>
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
