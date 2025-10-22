import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import Alert from './Alert';
import eLogo from '../Assets/e-logo.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import FolderExplorer from './FolderExplorer';
import Modal from 'react-modal';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import PageHeader from './PageHeader';



const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PYTHON_API_BASE = process.env.REACT_APP_API_BASE_URL_P;

const CueSheetGenerator = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingMessageVisible, setProcessingMessageVisible] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState(0);
  const [detectedSongs, setDetectedSongs] = useState([]);
  const [disableButtons, setDisableButtons] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [fileName, setFileName] = useState('');
  const [shortenedUrls, setShortenedUrls] = useState({});
  const [allLinksShortened, setAllLinksShortened] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [userId, setUserId] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);
  const [videoDurationInSec, setVideoDurationInSec] = useState(null);
  const [isS3Upload, setIsS3Upload] = useState(false);
  const [fileUploadedUsingHandleProcessAudio, setFileUploadedUsingHandleProcessAudio] = useState(false);
  const [detectionResults, setDetectionResults] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddingKeys, setIsAddingKeys] = useState(false);
  const [newAccessKey, setNewAccessKey] = useState('');
  const [newSecretKey, setNewSecretKey] = useState('');
  const [isEditingKeys, setIsEditingKeys] = useState(false);
  const [isFileUploadedUsingHandle, setIsFileUploadedUsingHandle] = useState(false);
  const [showFileList, setShowFileList] = useState(false);
  const [isS3Detection, setIsS3Detection] = useState(false);
  const [videoDurationInSecFE, setVideoDurationInSecFE] = useState([]);






  const [parentUUIDs, setParentUUIDs] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleParentUUIDs = (uuids) => {
    setParentUUIDs(uuids);
  };

  const handleVidDur = (totalVideoDuration) => {
    setVideoDurationInSecFE(totalVideoDuration);
  };

  const handleS3Upload = (fileCount, totalDuration) => {
    const newFile = {
      id: Date.now(),
      fileName: `${fileCount} file(s) from S3`,
      userId: null,
      duration: totalDuration,
      uploadType: 's3',
      uploadTime: new Date().toISOString(),
      fileCount: fileCount
    };
    setUploadedFiles(prev => [...prev, newFile]);
  };

  const [formData, setFormData] = useState(() => {
    return JSON.parse(localStorage.getItem('formData')) || {
      tvChannel: '',
      programName: '',
      episodeNumber: '',
      onAirDate: '',
      movieAlbum: '',
    };
  });


  const navigate = useNavigate();

  useEffect(() => {


    const savedFormData = JSON.parse(localStorage.getItem('formData')) || {
      tvChannel: '',
      programName: '',
      episodeNumber: '',
      onAirDate: '',
      movieAlbum: '',
    };
    const savedSongs = JSON.parse(localStorage.getItem('detectedSongs'));
    const savedFileName = localStorage.getItem('fileName');
    const savedShortenedUrls = JSON.parse(localStorage.getItem('shortenedUrls'));
    const savedVideoDuration = localStorage.getItem('videoDuration');

    if (savedFormData) {
      setFormData(savedFormData);
    }
    if (savedSongs) {
      setDetectedSongs(savedSongs);
      setShowTable(true);
      setAllLinksShortened(true);
      setShowButtons(true);
    }
    if (savedFileName) setFileName(savedFileName);
    if (savedShortenedUrls) setShortenedUrls(savedShortenedUrls);
    if (savedVideoDuration) setVideoDuration(savedVideoDuration);
  }, [navigate]);

  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem('formData', JSON.stringify(formData));
    }
    if (detectedSongs.length > 0) {
      localStorage.setItem('detectedSongs', JSON.stringify(detectedSongs));
    }
    if (fileName) {
      localStorage.setItem('fileName', fileName);
    }
    if (videoDuration) {
      localStorage.setItem('videoDuration', videoDuration);
    }
    if (Object.keys(shortenedUrls).length > 0) {
      localStorage.setItem('shortenedUrls', JSON.stringify(shortenedUrls));
    }
  }, [formData, detectedSongs, fileName, videoDuration, shortenedUrls]);

  const resetTableAndLoader = () => {
    setDetectedSongs([]);
    setProgress(0);
    setShowTable(false);
    setAllLinksShortened(false);
    setShowButtons(false);
    localStorage.removeItem('detectedSongs');
    localStorage.removeItem('formData');
    localStorage.removeItem('fileName');
    localStorage.removeItem('shortenedUrls');
  };


  const [keys, setKeys] = useState({ accessKey: '', secretKey: '', bucket: '' });
  const [isKeysLoaded, setIsKeysLoaded] = useState(false);

  const fetchKeys = async () => {
    try {
      // Retrieve token from localStorage



      // Make API request with the token
      const response = await axios.get(`${API_BASE_URL}/api/keys/gkeys`,  { withCredentials: true });

      if (response.data) {
        const { accessKey, secretKey, bucket } = response.data;

        setKeys({
          accessKey: accessKey,
          secretKey: secretKey,
          bucket: response.data.bucket
        });

        // configureAmplifyWrapper(accessKey, secretKey, bucket, region);
        setIsKeysLoaded(true);
      } else {
        console.error('No data received from the server.');
      }
    } catch (error) {
      console.error('Error fetching keys:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);





  const handleSubmitKeys = async () => {
    try {
      await postKeys(newAccessKey, newSecretKey, newBucket); // Call the function to post keys
      setKeys({ accessKey: newAccessKey, secretKey: newSecretKey, bucket: newBucket });
      setNewAccessKey('');
      setNewSecretKey('');
      setNewBucket('');
      setIsAddingKeys(false);
    } catch (error) {
      console.error('Error submitting keys:', error);
    }
  };

  const handleEditKeys = async () => {
    try {


      const payload = {
        accessKey: newAccessKey,
        secretKey: newSecretKey,
        bucket: newBucket,
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/keys/edit-keys`,
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const data = response.data;
        setKeys({
          accessKey: data.accessKey,
          secretKey: data.secretKey,
          bucket: data.bucket,
        });

        // Clear inputs and close the editing mode
        setNewAccessKey('');
        setNewSecretKey('');
        setNewBucket('');
        setIsEditingKeys(false);
        setAlertMessage('Keys updated successfully!');
        setAlertType('success');
        setAlertVisible(true);
        window.location.reload();
      } else {
        console.error('Failed to update keys:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating keys:', error.response?.data || error.message);
    }
  };

  const [newBucket, setNewBucket] = useState('');

  const postKeys = async (newAccessKey, newSecretKey, newBucket) => {
    try {



      // Prepare the payload
      const payload = {
        accessKey: newAccessKey,
        secretKey: newSecretKey,
        bucket: newBucket
      };

      // Make API request to post the keys
      const response = await axios.post(
        `${API_BASE_URL}/api/keys/pkeys`,
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data) {
      } else {
        console.error('No response data received from the server.');
      }
    } catch (error) {
      console.error('Error posting keys:', error.response?.data || error.message);
    }
  };



  const handleFileUpload = async () => {
    setFileUploadedUsingHandleProcessAudio(true);
    const fileInput = document.getElementById('file').files[0];
    if (!fileInput) {
      setAlertMessage('Please upload an audio file before initiating the detection process.');
      setAlertType('warning');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      return;
    }

    const fileName = fileInput.name.split('.')[0];
    const fileParts = fileName.split('_');

    let updatedFormData = {}; // Declare the object here
    if (fileParts.length === 5) {
      const [tvChannel, programName, episodeNumber, onAirDate, movieAlbum] = fileParts;
      updatedFormData = {
        tvChannel: tvChannel,
        programName: programName,
        episodeNumber: episodeNumber,
        onAirDate: onAirDate.replace(/-/g, '/'),
        movieAlbum: movieAlbum,
      };
      setFormData(updatedFormData);
      localStorage.setItem('formData', JSON.stringify(updatedFormData));
    } else {
      console.warn('File name format does not match the expected pattern.');
      setAlertMessage(`Invalid file name format. Expected format: TvChannel_ProgramName_EpisodeNumber_OnAirDate_MovieAlbum

Your file: "${fileInput.name}"
Found ${fileParts.length} parts, expected 5 parts separated by underscores.

Example: ZeeTV_KumkumBhagya_123_2024-01-15_MovieName.mp3`);
      setAlertType('warning');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 10000);
      return;
    }

    setIsUploading(true);
    const form = document.getElementById('metadataForm');
    const formData = new FormData(form);

    try {
      const response = await axios.post(`${PYTHON_API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { fileName, userId } = response.data;

      // Add file to uploaded files list
      const newFile = {
        id: Date.now(), // Unique ID for each file
        fileName: fileName,
        userId: userId,
        duration: response.data.Duration_seconds,
        uploadType: 'direct',
        uploadTime: new Date().toISOString()
      };

      setUploadedFiles(prev => [...prev, newFile]);
      setFileName(fileName);
      setUserId(userId);
      setVideoDurationInSec(response.data.Duration_seconds)
      setAlertMessage('File uploaded successfully');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 1500);

      // Close modal after successful upload
      setIsModalOpen(false);
      setIsS3Upload(false);

      // setIsFileUploadedUsingHandle(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      setAlertMessage('An error occurred during the upload.');
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      // setIsFileUploadedUsingHandle(false);
    } finally {
      setIsUploading(false);
    }
  };

  const sendDurationToBackend = async (durationSeconds, videoDurationInSecFE) => {

    // Determine which duration to use: priority to durationSeconds if it's available, otherwise fallback to videoDurationInSecFE
    const finalDuration = videoDurationInSecFE || durationSeconds;

    if (!finalDuration) {
      console.error('No valid duration available to send to the backend.');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/c/userMinutes`,
        {
          minutesUsed: finalDuration,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        return true;
      } else {
        console.error('Not enough minutes available');
        return false;
      }
    } catch (error) {
      console.error('Not enough minutes available');
      return false;
    }
  };




  const handleProcessAudio = async () => {
    setAlertMessage('Please DO NOT REFRESH OR NAVIGATE the page, as it may affect the final result.');
    setAlertType('warning');
    setAlertVisible(true);
    setTimeout(() => setAlertVisible(false), 10000);
    resetTableAndLoader();
    setDisableButtons(true);
    setIsS3Detection(false);
    setShowFileList(false);
    setProcessingMessageVisible(true); // Start showing the loader
    setFileUploadedUsingHandleProcessAudio(false);

    // Display sequential loading messages
    const messages = [
      "Your audio is in progress, this may take some time...",
      "Processing frames of your audio...",
      "Analyzing sound patterns for track detection...",
      "Detecting music tracks...",
      "Matching detected patterns with the database...",
      "Cross-checking detected songs for reliability...",
      "Optimizing the results for better accuracy...",
      "Finalizing the detected tracks...",
      "Generating the cue sheet for the audio file...",
      "Wrapping up the process, almost done...",
    ];

    let messageIndex = 0;
    const displayNextMessage = () => {
      if (messageIndex < messages.length) {
        setLoadingText(messages[messageIndex]);
        messageIndex++;
        setTimeout(displayNextMessage, 90000);
      }
    };
    displayNextMessage();

    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prevProgress + (95 / 600);
      });
    }, 1000);

    setTimeout(async () => {
      try {
        const response = await axios.post(`${PYTHON_API_BASE}/detect`, { userId });

        setDetectedSongs(response.data.songs);
        setAllLinksShortened(true);
        setVideoDuration(response.data.videoDuration);
        setVideoDurationInSec(response.data.Duration_seconds)
        setShowTable(true);
        setShowButtons(true);
        setProcessingMessageVisible(false);
        setDisableButtons(false);
        clearInterval(progressInterval);
        setIsFileUploadedUsingHandle(true);
      } catch (error) {
        console.error("Error processing audio:", error);
        setDisableButtons(false);
        setProcessingMessageVisible(false);
        clearInterval(progressInterval);
        setIsFileUploadedUsingHandle(false);
      } finally {
        setProcessingMessageVisible(false); // Hide loader
        setDisableButtons(false);
      }
    }, 100);
  };



  const handleProcessAudioS3 = async () => {
    setAlertMessage('Please DO NOT REFRESH the page, as it may affect the final result.');
    setAlertType('warning');
    setAlertVisible(true);
    localStorage.removeItem('detectedSongs');
    localStorage.removeItem('formData');
    localStorage.removeItem('fileName');
    localStorage.removeItem('shortenedUrls');
    resetTableAndLoader();
    setIsS3Detection(true);
    setDetectedSongs([]);
    setDetectionResults([]);
    setDetectionResultss3({});
    setShowTable(false); // Ensure table is hidden
    setShowFileList(false);
    setDisableButtons(true);
    setProcessingMessageVisible(true); // Show loader

    // Define loading messages
    const messages = [
      "Your audio is in progress, this may take some time...",
      "Processing frames of your audio...",
      "Analyzing sound patterns for track detection...",
      "Detecting music tracks...",
      "Matching detected patterns with the database...",
      "Cross-checking detected songs for reliability...",
      "Optimizing the results for better accuracy...",
      "Finalizing the detected tracks...",
      "Generating the cue sheet for the audio file...",
      "Wrapping up the process, almost done...",
    ];

    let messageIndex = 0;
    const displayNextMessage = () => {
      const messageInterval = 4 * 60 * 1000;
      if (messageIndex < messages.length) {
        setLoadingText(messages[messageIndex]);
        messageIndex++;
        setTimeout(displayNextMessage, messageInterval);
      }
    };
    displayNextMessage();

    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prevProgress + (95 / 1200);
      });
    }, 1000);

    try {
      if (!parentUUIDs || parentUUIDs.length === 0) {
        setAlertMessage("Please upload an audio file before initiating the detection process.");
        setAlertType("warning");
        setAlertVisible(true);
        setProcessingMessageVisible(false);
        return;
      }
      const response = await fetch(`${PYTHON_API_BASE}/detectS3`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parentUUIDs }),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error("Error from /detectS3:", error);
        setAlertType("error");
        setAlertVisible(true);
        setProcessingMessageVisible(false);
        return;
      }

      const result = await response.json();

      setDetectionResults(result.songs);
      setDetectionResultss3(result.songs);
      setProcessingMessageVisible(false);
      setShowFileList(true);
      setAlertMessage("Detection complete! Check the results.");
      setAlertType("success");
      setAlertVisible(true);

    } catch (error) {
      console.error("Error during /detectS3 request:", error);
      setAlertMessage("An error occurred while processing the audio files.");
      setAlertType("error");
      setAlertVisible(true);
    } finally {
      setProcessingMessageVisible(false); // Hide loader
      setDisableButtons(false);
      clearInterval(progressInterval);
    }
  };



  const formatTime = (timeInSeconds) => {
    if (timeInSeconds === undefined || timeInSeconds === null || isNaN(timeInSeconds)) {
      return "00:00:00";
    }
    return new Date(timeInSeconds * 1000).toISOString().substr(11, 8);
  };



const mergeDetectedSongs = (songs, gapTolerance = 1.0) => {
  if (!Array.isArray(songs) || songs.length === 0) return [];

  // Ensure we process in chronological order
  const ordered = [...songs].sort(
    (a, b) => (a.start_time ?? 0) - (b.start_time ?? 0)
  );

  const merged = [];

  for (const s of ordered) {
    const song = { ...s };

    // Never merge these — each occurrence gets its own row
    if (song.title === "May contain music") {
      merged.push(song);
      continue;
    }

    const last = merged[merged.length - 1];

    // Merge only if the previous *merged* item is the same title
    // and the new chunk starts within a tiny gap of the previous end.
    if (
      last &&
      last.title === song.title &&
      (song.start_time ?? 0) <= (last.end_time ?? 0) + gapTolerance
    ) {
      // Extend the current block
      last.end_time = Math.max(last.end_time ?? 0, song.end_time ?? song.start_time ?? 0);
    } else {
      // Start a new block (either first item, or interrupted by another song)
      merged.push(song);
    }
  }

  return merged;
};



  const mergedSongs = mergeDetectedSongs(detectedSongs);


  const [detectionResultss3, setDetectionResultss3] = useState({});
  const [isModalOpens3, setIsModalOpens3] = useState(false);
  const [viewedTableData, setViewedTableDatas3] = useState([]);
  const openModal = (tableData) => {
    setViewedTableDatas3(tableData);
    setIsModalOpens3(true);
  };

  const closeModal = () => {
    setIsModalOpens3(false);
    setViewedTableDatas3([]);
  };

  const renderFileList = () => {
    let lineNumber = 1;

    return Object.entries(detectionResultss3).map(([uuid, arrays], index) => (
      arrays.map((songs, arrayIndex) => {
        const mergedSongs = mergeDetectedSongs(songs); // Call mergeDetectedSongs here

        const csvData = mergedSongs.map((song) => ({
          'TV Channel': song.tv_channel || '',
          'Program Name': song.program_name || '',
          'Episode Number': song.ep_number || '',
          'On-Air Date': song.on_air_date || '',
          'Track Title': song.title,
          'Artist': song.artist || '-',
          'Label': song.label || '-',
          'Copyright Link': song.song_link || '-',
          'Video File Name': song.video_file_name || '',
          'TC In': formatTime(song.start_time),
          'TC Out': formatTime(song.end_time),
          'Movie / Album Name': song.mov_album || '',
        }));

        const csvFileName = `${formData.video_file_name || fileName}_cue-sheet.csv`;
        const videoFileName = mergedSongs[0]?.video_file_name || `Unknown File ${index + 1}.${arrayIndex + 1}`;
        const currentLine = lineNumber;
        lineNumber += 1;

        return (
          <div key={`${uuid}-${arrayIndex}`} className="flex justify-between items-center mb-4 font-normal text-sm">
            <span className="text-white">{`${currentLine}. ${videoFileName}`}</span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openModal(csvData)}
                className="text-[#10B981] underline hover:text-[#059669]"
              >
                View
              </button>
              <CSVLink
                data={csvData}
                filename={csvFileName}
                className="py-2 px-4 rounded-md transition-all transform bg-[#28603D] hover:bg-[#417155] hover:scale-102"
              >
                Download CSV
              </CSVLink>
            </div>
          </div>
        );
      })
    ));
  };

  const downloadDetectedSongsAsZip = (detectedSongs) => {
    const zip = new JSZip(); // Initialize JSZip instance
    const folder = zip.folder("Detected_Songs_Files"); // Create a folder inside the ZIP

    detectedSongs.forEach((songsGroup, groupIndex) => {
      if (!songsGroup || songsGroup.length === 0) return; // Skip empty groups

      songsGroup.forEach((songsArray, arrayIndex) => {
        if (!songsArray || songsArray.length === 0) return; // Skip empty arrays

        // Apply the mergeDetectedSongs function to merge the songs
        const mergedSongs = mergeDetectedSongs(songsArray);

        if (mergedSongs.length === 0) return; // Skip if mergedSongs is empty

        // Map merged songs to CSV data
        const csvData = mergedSongs.map((song) => ({
          "TV Channel": song.tv_channel || "",
          "Program Name": song.program_name || "",
          "Episode Number": song.ep_number || "",
          "On-Air Date": song.on_air_date || "",
          "Track Title": song.title === "May contain music" ? "May contain music" : song.title,
          Artist: song.artist || "-",
          Label: song.label || "-",
          "Copyright Link": song.song_link || "-",
          "Video File Name": song.video_file_name || "",
          "TC In": formatTime(song.start_time),
          "TC Out": formatTime(song.end_time),
          "Movie / Album Name": song.mov_album || "",
        }));

        // Convert CSV data to a string
        const csvContent = convertToCSV(csvData);

        // Use a unique filename for each CSV file
        const videoFileName =
          mergedSongs[0]?.video_file_name || `Unknown_File_${groupIndex + 1}_${arrayIndex + 1}`;
        const csvFileName = `${videoFileName}_cue-sheet.csv`;

        // Add the CSV file to the folder
        folder.file(csvFileName, csvContent);
      });
    });

    // Generate the ZIP file and trigger download
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "Detected_Songs.zip");
    });
  };

  // Utility function to convert data to CSV format
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ""; // Handle empty data
    const headers = Object.keys(data[0] || {}).join(","); // Get headers
    const rows = data.map((row) =>
      Object.values(row)
        .map((value) => `"${value}"`) // Add quotes to handle commas in values
        .join(",")
    ); // Format rows
    return [headers, ...rows].join("\n"); // Combine headers and rows
  };


  useEffect(() => {
    if (isFileUploadedUsingHandle && showTable) {
      const timer = setTimeout(() => setShowButtons(true), 1000);
      return () => clearTimeout(timer); // Cleanup timeout
    }
  }, [isFileUploadedUsingHandle, showTable]);


  const renderTable = () => {
    return (
      <div className="overflow-x-auto ml-5">
        <table className="w-full border-collapse mt-5">
          <thead>
            <tr className="text-black">
              <th className="border px-4 py-2 bg-gray-200">TV Channel</th>
              <th className="border px-4 py-2 bg-gray-200">Program Name</th>
              <th className="border px-4 py-2 bg-gray-200">Episode Number</th>
              <th className="border px-4 py-2 bg-gray-200">On-Air Date</th>
              <th className="border px-4 py-2 bg-gray-200">Track Title</th>
              <th className="border px-4 py-2 bg-gray-200">Artist</th>
              <th className="border px-4 py-2 bg-gray-200">Label</th>
              <th className="border px-4 py-2 bg-gray-200">Copyright Link</th>
              <th className="border px-4 py-2 bg-gray-200">Video File Name</th>
              <th className="border px-4 py-2 bg-gray-200">Video Duration</th>
              <th className="border px-4 py-2 bg-gray-200">TC In</th>
              <th className="border px-4 py-2 bg-gray-200">TC Out</th>
              <th className="border px-4 py-2 bg-gray-200">Movie / Album Name</th>
            </tr>
          </thead>
          <tbody>
            {mergedSongs.map((song, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">{formData.tvChannel || ''}</td>
                <td className="border px-4 py-2">{formData.programName || ''}</td>
                <td className="border px-4 py-2">{formData.episodeNumber || ''}</td>
                <td className="border px-4 py-2">{formData.onAirDate || ''}</td>
                <td className="border px-4 py-2">
                  {song.title === "May contain music" ? (
                    <span className="text-yellow-600">May contain music</span>
                  ) : (
                    song.title
                  )}
                </td>
                <td className="border px-4 py-2">{song.artist || '-'}</td>
                <td className="border px-4 py-2">{song.label || '-'}</td>
                <td className="border px-4 py-2">
                  {song.song_link ? (
                    <a href={song.song_link} target="_blank" rel="noopener noreferrer">
                      {song.song_link}
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="border px-4 py-2">{fileName}</td>
                <td className="border px-4 py-2">{`${videoDuration}sec`}</td>

                <td className="border px-4 py-2">{formatTime(song.start_time)}</td>
                <td className="border px-4 py-2">{formatTime(song.end_time)}</td>
                <td className="border px-4 py-2">{formData.movieAlbum || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const csvData = mergedSongs.map((song) => ({
    'TV Channel': formData.tvChannel || '',
    'Program Name': formData.programName || '',
    'Episode Number': formData.episodeNumber || '',
    'On-Air Date': formData.onAirDate || '',
    'Track Title': song.title === "May contain music" ? "May contain music" : song.title,
    'Artist': song.artist || '-',
    'Label': song.label || '-',
    'Copyright Link': song.song_link || '-',
    'Video File Name': fileName,
    'Video Duration': `${videoDuration}sec`,
    'TC In': formatTime(song.start_time),
    'TC Out': formatTime(song.end_time),
    'Movie / Album Name': formData.movieAlbum || ''
  }));


  const csvFileName = `${fileName}_cue-sheet.csv`;

  const handleSave = async () => {
    try {
      // Use the contiguous merge for saving (same logic as your table/CSV)
      const mergedForSave = mergeDetectedSongs(detectedSongs);
  
      const tableData = mergedForSave.map((song) => ({
        'TV Channel': formData.tvChannel || '',
        'Program Name': formData.programName || '',
        'Episode Number': formData.episodeNumber || '',
        'On-Air Date': formData.onAirDate || '',
        'Track Title': song.title === 'May contain music' ? 'May contain music' : song.title,
        // keep the original column name you were sending; fall back to `artist`
        'Artist 1': song.artist1 || song.artist || '-',
        // prefer any shortened link you might have; fall back to song_link
        'Copyright Link': shortenedUrls[song.title] || song.song_link || '-',
        'Video File Name': fileName,
        'Video Duration': `${videoDuration}sec`,
        'TC In': formatTime(song.start_time),
        'TC Out': formatTime(song.end_time),
        'Movie / Album Name': formData.movieAlbum || '',
      }));
  
      await axios.post(
        `${API_BASE_URL}/save-table`,
        { tableData },
        { withCredentials: true }
      );
  
      setAlertMessage('Table saved successfully!');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    } catch (error) {
      console.error('Error saving table:', error);
      setAlertMessage('Failed to save table.');
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };
  

  return (
    <div id="modalBlur" className="bg-gray-50 dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 min-h-screen transition-colors duration-300">
      <PageHeader title="Create Cue-Sheet" />

      <div className="mt-6 ml-6 mr-6">
        {/* Top Action Bar - Always visible */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:from-[#059669] hover:to-[#0d9488] text-white hover:shadow-lg"
          >
            Upload
          </button>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="py-2.5 px-4 rounded-xl text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white/80 dark:hover:bg-gray-700 shadow-md transition-all flex items-center justify-center bg-white dark:bg-gray-800"
            style={{ minWidth: '40px', height: '40px' }}
          >
            <FontAwesomeIcon icon={faSliders} size="lg" />
          </button>
        </div>

        {/* Uploaded Files List - Show when files are uploaded */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Uploaded Files ({uploadedFiles.length})</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {uploadedFiles.map((file, index) => (
                <div key={file.id} className="p-6">
                  <div className="flex items-center gap-4">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>

                    {/* File Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-400">
                          Uploaded
                        </span>
                        {file.uploadType === 's3' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400">
                            S3
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {file.fileName}
                      </h3>
                      {file.duration && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Duration: {Math.floor(file.duration / 60)} min {Math.floor(file.duration % 60)} sec
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Uploaded at {new Date(file.uploadTime).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          // Set the current file as active for processing
                          setFileName(file.fileName);
                          setUserId(file.userId);
                          setVideoDurationInSec(file.duration);
                          setFileUploadedUsingHandleProcessAudio(file.uploadType === 'direct');

                          const isDurationSent = await sendDurationToBackend(file.duration, file.duration);

                          if (isDurationSent) {
                            if (file.uploadType === 'direct') {
                              handleProcessAudio();
                            } else {
                              handleProcessAudioS3();
                            }
                          } else {
                            setAlertMessage('Not enough minutes available');
                            setAlertType('error');
                            setAlertVisible(true);
                            setTimeout(() => setAlertVisible(false), 5000);
                          }
                        }}
                        className={`py-2.5 px-6 rounded font-semibold text-sm transition-all ${
                          disableButtons
                            ? 'bg-surface-200 text-surface-500 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md'
                        }`}
                        disabled={disableButtons}
                      >
                        Start Process
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
                          // If this was the current file, clear the state
                          if (fileName === file.fileName) {
                            setFileName('');
                            setUserId('');
                            setVideoDurationInSec(null);
                            setFileUploadedUsingHandleProcessAudio(false);
                          }
                        }}
                        className="text-surface-400 hover:text-error-600 transition-colors"
                        title="Remove file"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Download ZIP button for S3 detection */}
            {isS3Detection && detectionResultss3 && Object.keys(detectionResultss3).length > 0 && (
              <div className="border-t border-surface-200 px-6 py-4">
                <button
                  onClick={() => downloadDetectedSongsAsZip(Object.values(detectionResultss3))}
                  className="py-2.5 px-6 rounded font-semibold text-sm bg-secondary-600 hover:bg-secondary-700 text-white shadow-sm hover:shadow-md transition-all"
                >
                  Download ZIP
                </button>
              </div>
            )}
          </div>
        )}
      </div>


      {/* {processingMessageVisible ? (
        <div id="loadingContainer" className="loading-container mt-20 opacity-100 mx-4">
          <div className="loading-text text-lg text-center mb-2">{loadingText}</div>
          <div className="progress-bar bg-gray-700 rounded-lg w-full mx-4 h-4">
            <div className="progress-bar-fill bg-[#417155] h-full rounded-lg" style={{ width: `${progress}%`, transition: 'width 1s ease' }}></div>
          </div>
        </div>
      ) : (
        <>
          {isFileUploadedUsingHandle && showTable && renderTable()}
          {showFileList && (
            <div className="p-5 relative mt-5">
              <div className="absolute top-0 right-5"></div>
              {renderFileList()}
            </div>
          )}
        </>
      )} */}

      {processingMessageVisible ? (
        <div id="loadingContainer" className="loading-container mt-20 opacity-100 mx-6">
          <div className="loading-text text-lg text-center mb-4 text-gray-800 dark:text-gray-100 font-semibold transition-colors duration-300">{loadingText}</div>
          <div className="progress-bar bg-gray-200 dark:bg-gray-700 rounded-xl w-full h-4 shadow-inner transition-colors duration-300">
            <div className="progress-bar-fill bg-gradient-to-r from-[#10B981] to-[#14B8A6] h-full rounded-xl" style={{ width: `${progress}%`, transition: 'width 1s ease' }}></div>
          </div>
        </div>
      ) : (
        <>
          {isFileUploadedUsingHandle && showTable && (
            <>
              {renderTable()}
              {showButtons && (
                <div className="flex justify-center items-center mt-6 space-x-4">
                  <CSVLink
                    data={csvData}
                    filename={csvFileName}
                    className="bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:from-[#059669] hover:to-[#0d9488] py-2.5 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-white font-semibold flex items-center space-x-2"
                  >
                    <img src={eLogo} alt="Download CSV" className="h-5 w-5" />
                  </CSVLink>

                  <button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:from-[#059669] hover:to-[#0d9488] text-white py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Save
                  </button>
                </div>
              )}
            </>
          )}

          {showFileList && (
            <div className="p-6 relative mt-6">
              <div className="absolute top-0 right-5"></div>
              {renderFileList()}
            </div>
          )}
        </>
      )}



      <Modal
        isOpen={isModalOpens3}
        onRequestClose={closeModal}
        className="bg-white rounded-lg max-w-7xl w-full mx-4 border border-surface-200 shadow-xl"
        overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      >
        {/* Header */}
        <div className="border-b border-surface-200 px-6 py-4 bg-surface-50 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-surface-900">Cue Sheet Data</h2>
            <p className="text-sm text-surface-600 mt-1">View detected songs and metadata</p>
          </div>
          <button
            onClick={closeModal}
            className="text-surface-400 hover:text-surface-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <table className="min-w-full border-collapse">
            <thead className="bg-primary-600 text-white sticky top-0 z-10">
              <tr>
                {Object.keys(viewedTableData[0] || {}).map((key, index) => (
                  <th
                    key={index}
                    className="border-r border-primary-700 last:border-r-0 px-4 py-3 text-left font-semibold text-sm uppercase tracking-wide whitespace-nowrap"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {viewedTableData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-surface-50'
                  } hover:bg-secondary-50 transition-colors`}
                >
                  {Object.values(row).map((value, colIndex) => (
                    <td
                      key={colIndex}
                      className="border border-surface-200 px-4 py-3 text-sm text-surface-900 whitespace-nowrap"
                    >
                      {value && value !== '-' && value !== 'N/A' ? (
                        String(value).startsWith('http') ? (
                          <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary-600 hover:text-secondary-700 underline"
                          >
                            {value.length > 40 ? value.substring(0, 40) + '...' : value}
                          </a>
                        ) : (
                          <span className="text-surface-900">{value}</span>
                        )
                      ) : (
                        <span className="text-surface-400 italic">N/A</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-surface-200 px-6 py-4 bg-surface-50 rounded-b-lg flex items-center justify-between">
          <p className="text-sm text-surface-600">
            Showing {viewedTableData.length} {viewedTableData.length === 1 ? 'record' : 'records'}
          </p>
          <button
            onClick={closeModal}
            className="border border-surface-300 hover:bg-white text-surface-700 py-2 px-6 rounded font-medium text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>





      {isSettingsOpen && (
        <div
          className="fixed z-50 bg-white border border-surface-200 rounded-lg shadow-xl"
          style={{
            position: 'absolute',
            top: 'calc(5rem + 40px)',
            right: '2rem',
            width: '400px',
          }}
        >
          {/* Header */}
          <div className="border-b border-surface-200 px-6 py-4 bg-surface-50">
            <h3 className="text-lg font-semibold text-surface-900">AWS S3 Configuration</h3>
            <p className="text-xs text-surface-600 mt-1">Manage your S3 bucket credentials</p>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {!keys.accessKey || !keys.secretKey || !keys.bucket ? (
              // If keys or bucket are not available
              <div>
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-warning-800">
                    <strong>No credentials found.</strong> Please add your AWS S3 credentials to enable S3 file uploads.
                  </p>
                </div>
                {isAddingKeys ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">
                        Access Key <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter AWS Access Key"
                        className="w-full px-3 py-2.5 border border-surface-300 rounded text-surface-900 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition"
                        value={newAccessKey}
                        onChange={(e) => setNewAccessKey(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">
                        Secret Key <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Enter AWS Secret Key"
                        className="w-full px-3 py-2.5 border border-surface-300 rounded text-surface-900 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition"
                        value={newSecretKey}
                        onChange={(e) => setNewSecretKey(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">
                        Bucket Name <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter S3 Bucket Name"
                        className="w-full px-3 py-2.5 border border-surface-300 rounded text-surface-900 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition"
                        value={newBucket}
                        onChange={(e) => setNewBucket(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setIsAddingKeys(false)}
                        className="flex-1 border border-surface-300 hover:bg-surface-50 text-surface-700 py-2.5 px-4 rounded font-medium text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitKeys}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded font-medium text-sm transition-colors uppercase tracking-wide"
                      >
                        Save Keys
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingKeys(true)}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded font-medium text-sm transition-colors uppercase tracking-wide"
                  >
                    Add Credentials
                  </button>
                )}
              </div>
            ) : (
              <div>
                {isEditingKeys ? (
                  // Input fields for editing keys
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">
                        Access Key <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter new Access Key"
                        className="w-full px-3 py-2.5 border border-surface-300 rounded text-surface-900 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition"
                        value={newAccessKey}
                        onChange={(e) => setNewAccessKey(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">
                        Secret Key <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Enter new Secret Key"
                        className="w-full px-3 py-2.5 border border-surface-300 rounded text-surface-900 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition"
                        value={newSecretKey}
                        onChange={(e) => setNewSecretKey(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">
                        Bucket Name <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter new Bucket Name"
                        className="w-full px-3 py-2.5 border border-surface-300 rounded text-surface-900 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition"
                        value={newBucket}
                        onChange={(e) => setNewBucket(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setIsEditingKeys(false)}
                        className="flex-1 border border-surface-300 hover:bg-surface-50 text-surface-700 py-2.5 px-4 rounded font-medium text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleEditKeys();
                          setIsEditingKeys(false);
                        }}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded font-medium text-sm transition-colors uppercase tracking-wide"
                      >
                        Update Keys
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display keys
                  <div className="space-y-4">
                    <div className="bg-surface-50 border border-surface-200 rounded-lg p-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-surface-600 mb-1 uppercase tracking-wide">
                            Access Key
                          </label>
                          <p className="text-sm text-surface-900 font-mono break-all">
                            {keys.accessKey || 'Not configured'}
                          </p>
                        </div>
                        <div className="border-t border-surface-200 pt-3">
                          <label className="block text-xs font-medium text-surface-600 mb-1 uppercase tracking-wide">
                            Secret Key
                          </label>
                          <p className="text-sm text-surface-900 font-mono">
                            {'•'.repeat(20)}
                          </p>
                        </div>
                        <div className="border-t border-surface-200 pt-3">
                          <label className="block text-xs font-medium text-surface-600 mb-1 uppercase tracking-wide">
                            Bucket Name
                          </label>
                          <p className="text-sm text-surface-900 font-mono">
                            {keys.bucket || 'Not configured'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditingKeys(true)}
                      className="w-full border border-surface-300 hover:bg-surface-50 text-surface-700 py-2.5 px-4 rounded font-medium text-sm transition-colors"
                    >
                      Edit Credentials
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-surface-200 px-6 py-4 bg-surface-50">
            <button
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen)
                setIsAddingKeys(false);
                setIsEditingKeys(false);
              }}
              className="w-full border border-surface-300 hover:bg-white text-surface-700 py-2 px-4 rounded font-medium text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}



      {isModalOpen && (
        <div className="fixed z-50 inset-0 bg-black/40 dark:bg-black/60 flex justify-center items-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full border border-gray-200 dark:border-gray-700 shadow-xl max-h-[95vh] overflow-y-auto transition-colors duration-300">
            {/* Modal Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900 sticky top-0 z-10 transition-colors duration-300">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isS3Upload ? "Browse S3 Folders" : "Upload Audio File"}
              </h2>
              <button
                onClick={() => {
                  setIsS3Upload(false);
                  setIsModalOpen(false);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6">
              {isS3Upload ? (
                <div>
                  <FolderExplorer
                    accessKey={keys.accessKey}
                    secretKey={keys.secretKey}
                    bucketName={keys.bucket}
                    region="us-east-1"
                    onUUIDsGenerated={handleParentUUIDs}
                    onVidDur={handleVidDur}
                    onUploadComplete={(fileCount, totalDuration) => {
                      handleS3Upload(fileCount, totalDuration);
                      setIsModalOpen(false);
                      setIsS3Upload(false);
                    }}
                  />
                </div>
              ) : (
                <form id="metadataForm" encType="multipart/form-data">
                  {/* Info Box */}
                  <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                      </svg>
                      <div className="text-xs sm:text-sm">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">File Naming Format</p>
                        <p className="text-gray-700 dark:text-gray-300 mb-2 break-all">
                          TvChannelName_ProgramName_EpisodeNumber_OnAirDate_Movie/AlbumName
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                          If any field is not available, use "NA" in its place.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Audio File <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition bg-white dark:bg-[#2d2d30] file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-800/40"
                      type="file"
                      id="file"
                      name="file"
                      accept=".mp3,.mp4"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Supported format: MP3</p>
                  </div>

                  {/* OR Divider */}
                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-xs sm:text-sm">
                      <span className="px-3 sm:px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">OR</span>
                    </div>
                  </div>

                  {/* S3 Upload Button */}
                  <button
                    type="button"
                    onClick={() => setIsS3Upload(true)}
                    className="w-full mb-4 sm:mb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 bg-gray-50 dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900/20 py-3 sm:py-4 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    <span className="font-medium text-xs sm:text-sm">Upload from S3 Bucket</span>
                  </button>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsS3Upload(false);
                        setIsModalOpen(false);
                      }}
                      className="w-full sm:flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded font-medium text-sm transition-colors order-2 sm:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="uploadButton"
                      onClick={handleFileUpload}
                      className="w-full sm:flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded font-medium text-sm transition-colors uppercase tracking-wide order-1 sm:order-2"
                    >
                      Upload File
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}


      {isUploading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darken the screen
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000, // Ensure it's above other content
          }}
        >
          <div
            className="loader"
          ></div>
        </div>
      )}
      <Alert
        message={alertMessage}
        type={alertType}
        visible={alertVisible}
        setVisible={setAlertVisible}
      />



    </div>


  );
};

export default CueSheetGenerator;




