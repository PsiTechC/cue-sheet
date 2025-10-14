import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import Alert from './Alert';
import eLogo from '../Assets/e-logo.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import FolderExplorer from './FolderExplorer';
import Modal from 'react-modal';
import JSZip from "jszip";
import { saveAs } from "file-saver";



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

  const handleParentUUIDs = (uuids) => {
    setParentUUIDs(uuids);
  };

  const handleVidDur = (totalVideoDuration) => {
    setVideoDurationInSecFE(totalVideoDuration);
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
      setAlertMessage('Invalid file name format. Ensure it follows the correct pattern.');
      setAlertType('warning');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
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
      setFileName(fileName);
      setUserId(userId);
      setVideoDurationInSec(response.data.Duration_seconds)
      setAlertMessage('File uploaded successfully');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 1500);
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
                className="text-blue-500 underline hover:text-blue-700"
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
    <div id="modalBlur" className="bg-[#171717]  text-gray-300 min-h-screen">
      <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E] bg-[#1E1E1E]">
        <h2 className="text-xl font-normal text-center flex-grow text-white">Create Cue-Sheet</h2>
      </div>

      <div className="mt-5 flex justify-between items-center text-white ml-5 text-sm">
        <div className="flex space-x-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className={`py-2 px-4 rounded-md transition-all transform ${disableButtons ? 'bg-[#3d3d3d] text-white cursor-not-allowed' : 'bg-[#28603D] hover:bg-[#417155] hover:scale-102'
              }`}
            disabled={disableButtons}
          >
            Upload
          </button>

          <button
            id="detectButton"
            onClick={async () => {
              const isDurationSent = await sendDurationToBackend(videoDurationInSecFE, videoDurationInSec);

              if (isDurationSent) {
                // Only trigger the functions if the backend call was successful
                if (fileUploadedUsingHandleProcessAudio) {
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
            className={`py-2 px-4 rounded-md transition-all transform ${disableButtons
              ? 'bg-[#3d3d3d] text-white cursor-not-allowed'
              : 'bg-[#28603D] hover:bg-[#417155] hover:scale-102'
              }`}
            disabled={disableButtons}
          >
            Start Process
          </button>


          {isS3Detection && detectionResultss3 && Object.keys(detectionResultss3).length > 0 && (
            <button
              onClick={() => downloadDetectedSongsAsZip(Object.values(detectionResultss3))}
              className="py-2 px-4 rounded-md transition-all transform bg-[#28603D] hover:bg-[#417155] hover:scale-102"
            >
              Download ZIP
            </button>
          )}

        </div>

        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="py-2 px-4 rounded-md text-white hover:scale-105 shadow-md transition-all flex items-center justify-center"
          style={{ minWidth: '40px', height: '40px' }}
        >
          <FontAwesomeIcon icon={faSliders} size="lg" />
        </button>
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
        <div id="loadingContainer" className="loading-container mt-20 opacity-100 mx-4">
          <div className="loading-text text-lg text-center mb-2">{loadingText}</div>
          <div className="progress-bar bg-gray-700 rounded-lg w-full mx-4 h-4">
            <div className="progress-bar-fill bg-[#417155] h-full rounded-lg" style={{ width: `${progress}%`, transition: 'width 1s ease' }}></div>
          </div>
        </div>
      ) : (
        <>
          {isFileUploadedUsingHandle && showTable && (
            <>
              {renderTable()}
              {showButtons && (
                <div className="flex justify-center items-center mt-5 space-x-4">
                  <CSVLink
                    data={csvData}
                    filename={csvFileName}
                    className="bg-[#28603D] hover:bg-[#417155] py-2 px-4 rounded-md transition-all transform flex items-center justify-center"
                  >
                    <img src={eLogo} alt="Download CSV" className="h-5 w-5" />
                  </CSVLink>

                  <button
                    onClick={handleSave}
                    className="bg-[#669de3] hover:bg-[#9dc1f5] text-white py-1.5 px-4 rounded-md ml-4 transition-all transform"
                  >
                    Save
                  </button>
                </div>
              )}
            </>
          )}

          {showFileList && (
            <div className="p-5 relative mt-5">
              <div className="absolute top-0 right-5"></div>
              {renderFileList()}
            </div>
          )}
        </>
      )}



      <Modal
        isOpen={isModalOpens3}
        onRequestClose={closeModal}
        className="bg-gray-800 p-5 rounded-md max-w-3xl sm:max-w-2xl lg:max-w-4xl mx-auto "
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-40"
      >

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white font-normal">Table Data</h2>
        </div>
        <div className="overflow-auto max-h-96">
          <table className="min-w-full text-white border-collapse border border-gray-600">
            <thead className="bg-gray-700">
              <tr>
                {Object.keys(viewedTableData[0] || {}).map((key, index) => (
                  <th key={index} className="border border-gray-600 px-2 py-1">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {viewedTableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((value, colIndex) => (
                    <td key={colIndex} className="border border-gray-600 px-2 py-1">
                      {value || 'N/A'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={closeModal}
          className="mt-4 bg-red-500 hover:bg-red-400 text-white py-1 px-4 rounded-md text-sm"
        >
          Close
        </button>
      </Modal>





      {isSettingsOpen && (
        <div
          className="fixed z-50 bg-gray-200 text-black shadow-md rounded-md"
          style={{
            position: 'absolute',
            top: 'calc(5rem + 40px)', // Adjust as needed
            right: '2rem', // Adjust as needed
            width: '300px',
            padding: '20px',
          }}
        >
          <h3 className="text-lg font-semibold mb-3">Your Keys</h3>
          {!keys.accessKey || !keys.secretKey || !keys.bucket ? (
            // If keys or bucket are not available
            <div>
              <p>Keys or bucket are not available.</p>
              {isAddingKeys ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Access Key"
                    className="w-full p-2 border rounded-md"
                    value={newAccessKey}
                    onChange={(e) => setNewAccessKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Secret Key"
                    className="w-full p-2 border rounded-md"
                    value={newSecretKey}
                    onChange={(e) => setNewSecretKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Bucket"
                    className="w-full p-2 border rounded-md"
                    value={newBucket}
                    onChange={(e) => setNewBucket(e.target.value)}
                  />
                  <button
                    onClick={handleSubmitKeys}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded-md w-full"
                  >
                    Submit
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingKeys(true)}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md mt-3 w-full"
                >
                  Add Keys
                </button>
              )}
            </div>
          ) : (
            <div>
              {isEditingKeys ? (
                // Input fields for editing keys
                <div className="space-y-3 text-xs">
                  <input
                    type="text"
                    placeholder="New Access Key"
                    className="w-full p-1 border rounded-md"
                    value={newAccessKey}
                    onChange={(e) => setNewAccessKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="New Secret Key"
                    className="w-full p-1 border rounded-md"
                    value={newSecretKey}
                    onChange={(e) => setNewSecretKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="New Bucket Name"
                    className="w-full p-1 border rounded-md"
                    value={newBucket}
                    onChange={(e) => setNewBucket(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      handleEditKeys(); // Call the editKeys function
                      setIsEditingKeys(false); // Hide the input fields after editing
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded-md w-full"
                  >
                    Submit
                  </button>
                </div>
              ) : (
                // Display keys
                <div className="space-y-3 text-xs">
                  <div>
                    <strong>Access Key:</strong> {keys.accessKey || 'Access Key not available'}
                  </div>
                  <div>
                    <strong>Secret Key:</strong> {keys.secretKey || 'Secret Key not available'}
                  </div>
                  <div>
                    <strong>Bucket:</strong> {keys.bucket || 'Bucket not available'}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="text-right mt-3">
            {!isEditingKeys && (
              <button
                onClick={() => setIsEditingKeys(true)} // Show input fields for editing
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-4 rounded-md"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen)
                setIsAddingKeys(false);
                setIsEditingKeys(false);
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-4 rounded-md ml-2"
            >
              Close
            </button>
          </div>
        </div>
      )}



      {isModalOpen && (
        <div className="fixed z-50 inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center text-black">
          <div className="bg-gray-200 w-1/2 p-5 rounded-md shadow-lg">
            <div className="modal-header flex justify-between items-center border-b pb-3">
              <h3 className="text-xl">{isS3Upload ? "Browse Folders" : "Upload Audio File"}</h3>
            </div>
            <div className="modal-body py-5">
              {isS3Upload ? (
                // Render FolderExplorer instead of S3 Upload Form
                <div className="ml-7"> {/* Adds a left margin */}
                  <FolderExplorer
                    accessKey={keys.accessKey}
                    secretKey={keys.secretKey}
                    bucketName={keys.bucket}
                    region="us-east-1"
                    onUUIDsGenerated={handleParentUUIDs}
                    onVidDur={handleVidDur}
                  />
                </div>
              ) : (
                <form id="metadataForm" encType="multipart/form-data">
                  <p className="flex flex-col text-gray-600 text-sm mb-4">
                    <span className="flex items-center mb-2">
                      <FontAwesomeIcon icon={faCircleInfo} className="mr-2" />
                      <span className="font-bold">Format to be used for the file upload: TvChannelName_ProgramName_EpisodeNumber_OnAirDate_Movie/AlbumName.</span>
                    </span>
                    <span className='pl-6'>If any of the fields are not available, type "NA" in its place.</span>
                  </p>

                  <label className="block mb-3" htmlFor="file">Upload MP3 File:</label>

                  <div className="flex items-center mb-3 justify-center relative">
                    <input
                      className="w-full p-1 border rounded-md"
                      type="file"
                      id="file"
                      name="file"
                      accept=".mp3"
                      required
                    />
                    <span className="absolute mx-10 text-center">OR</span>
                    <button
                      className="bg-green-600 hover:bg-green-500 text-white py-1.5 px-4 rounded-md transition-all transform text-sm"
                      onClick={() => setIsS3Upload(true)}
                    >
                      Upload using S3
                    </button>
                  </div>
                  <div className="flex justify-start mt-3">
                    {/* bulk upload and folder select */}
                    <button
                      type="button"
                      id="uploadButton"
                      className="bg-green-600 hover:bg-green-500 text-white py-1.5 px-4 rounded-md transition-all transform text-sm"
                      onClick={handleFileUpload}
                    >
                      Upload File
                    </button>
                  </div>
                </form>
              )}
            </div>
            <div className="modal-footer flex justify-end pt-3 border-t">
              <button
                onClick={() => {
                  setIsS3Upload(false); // Reset S3Upload state when closing
                  setIsModalOpen(false);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-4 rounded-md"
              >
                Close
              </button>
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




