// import React, { useState } from 'react';
// import axios from 'axios';
// import Alert from './Alert';

// const MetadataCreation = () => {
//   const [metadata, setMetadata] = useState(null);
//   const [customProperties, setCustomProperties] = useState([]);
//   const [downloadLink, setDownloadLink] = useState(''); // New state for download link
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertType, setAlertType] = useState('');
//   const [alertVisible, setAlertVisible] = useState(false); 
  

//   const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

//   const commonMetadataFields = [
//     'title', 'comment', 'artist', 'album', 'genre', 'description', 'copyright',
//     'year'
//   ];

//   const handleFileUpload = async (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const formData = new FormData();
//       formData.append('video', file);

//       try {
//         const response = await axios.post(`${API_BASE_URL}/api/metadata/upload`, formData, {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         });
//         const { userUuid, filename } = response.data;
//         setMetadata({ ...response.data, userUuid, filename });
//         setMetadata({ ...response.data, filename: response.data.filename });
//       } catch (error) {
//         console.error('Error uploading file:', error);
//         setMetadata({ error: 'Failed to retrieve metadata' });
//       }
//     }
//   };

//   const addCustomProperty = () => {
//     const newProperty = { label: '', value: '' };
//     setCustomProperties([...customProperties, newProperty]);
//   };

//   const handleCustomPropertyChange = (index, field, value) => {
//     const updatedProperties = [...customProperties];
//     updatedProperties[index][field] = value;
//     setCustomProperties(updatedProperties);
//   };

//   const saveMetadataToBackend = async () => {
//     try {
//       const { filename, userUuid } = metadata;
//       if (!filename || !userUuid) {
//         throw new Error('Filename or UUID missing from metadata');
//     }
//       const payload = {
//         filename: metadata.filename,
//         userUuid,
//         customProperties: customProperties.reduce((acc, prop) => {
//           acc[prop.label] = prop.value;
//           return acc;
//         }, {}),
//       };

//       const response = await axios.post(`${API_BASE_URL}/api/metadata/save`, payload);

//       if (response.data.downloadPath) {
//         setDownloadLink(`${API_BASE_URL}${response.data.downloadPath}`);
//         console.log(response.data.downloadPath);
//       }

//       setAlertMessage('Metadata saved successfully!');
//       setAlertType('success');
//       setAlertVisible(true);
//       setTimeout(() => setAlertVisible(false), 5000);
//     } catch (error) {
//       console.error('Error saving metadata:', error);
//       setAlertMessage('Failed to save metadata!');
//       setAlertType('error');
//       setAlertVisible(true);
//       setTimeout(() => setAlertVisible(false), 5000);
//     }
//   };

//   const renderField = (label, value, editable = false) => (
//     <div className="flex justify-between items-center py-2">
//       <label className="text-gray-300">{label}</label>
//       <input
//         type="text"
//         value={value || ''}
//         readOnly={!editable}
//         className="bg-gray-800 text-white rounded px-2 py-1 w-1/2 text-left"
//       />
//     </div>
//   );

//   const renderTags = (tags) => (
//     <>
//       {Object.entries(tags).map(([key, value]) => (
//         <div key={key} className="flex justify-between items-center py-2">
//           <label className="text-gray-300">{key}</label>
//           <input
//             type="text"
//             value={value || ''}
//             readOnly
//             className="bg-gray-800 text-white rounded px-2 py-1 w-1/2 text-left"
//           />
//         </div>
//       ))}
//       {/* Custom Properties for Tags */}
//       {customProperties.map((prop, index) => (
//         <div key={index} className="flex justify-between items-center py-2">
//           <select
//             value={prop.label}
//             onChange={(e) => handleCustomPropertyChange(index, 'label', e.target.value)}
//             className="bg-gray-800 text-white rounded px-2 py-1 w-1/2 text-left"
//           >
//             <option value="">Select Key</option>
//             {commonMetadataFields.map((field) => (
//               <option key={field} value={field}>{field}</option>
//             ))}
//           </select>
//           <input
//             type="text"
//             placeholder="Property Value"
//             value={prop.value}
//             onChange={(e) => handleCustomPropertyChange(index, 'value', e.target.value)}
//             className="bg-gray-800 text-white rounded px-2 py-1 w-1/2 text-left"
//           />
//         </div>
//       ))}
//       <button
//         onClick={addCustomProperty}
//         className="mt-4 bg-blue-500 text-white px-4 py-1 rounded cursor-pointer"
//       >
//         + Add property
//       </button>
//       <button
//         onClick={saveMetadataToBackend}
//         className="ml-4 mt-4 bg-green-500 text-white px-4 py-1 rounded cursor-pointer"
//       >
//         Save
//       </button>
//     </>
//   );

//   return (
// <div className="text-white" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
//   <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E] bg-[#1E1E1E]">
//     <h2 className="text-xl font-normal text-center flex-grow">Metadata Creation</h2>
//   </div>

//   <div className="p-5">
//     <label
//       htmlFor="videoUpload"
//       className="bg-[#28603D] hover:bg-[#417155] text-white py-2 px-4 rounded-md text-sm cursor-pointer"
//     >
//       Upload Video
//     </label>
//     <input
//       type="file"
//       accept="video/*"
//       onChange={handleFileUpload}
//       style={{ display: 'none' }}
//       id="videoUpload"
//     />
//   </div>

//   {metadata ? (
//     <div className="mt-10">
//       {metadata.error ? (
//         <p className="text-red-500 text-center">{metadata.error}</p>
//       ) : (
//         <div>
//           {/* File Format Info */}
//           <div className="mt-6 bg-gray-900 p-4 rounded">
//             <h3 className="text-lg font-semibold text-gray-400 mb-4">File Format Info</h3>
//             {renderField("Filename", metadata.originalname || metadata.filename)}
//             {renderField("Format Name", metadata.format?.format_name)}
//             {renderField("Format Long Name", metadata.format?.format_long_name)}
//             {renderField("Duration", metadata.format?.duration)}
//             {renderField("Size", metadata.format?.size)}
//             {renderField("Bit Rate", metadata.format?.bit_rate)}
//             {renderField("Start Time", metadata.format?.start_time)}
//             <p className="text-gray-400 italic mt-2">Field not editable</p>
//           </div>

//           {/* Tags */}
//           {metadata.format?.tags && (
//             <div className="mt-6 bg-gray-900 p-4 rounded">
//               <h3 className="text-lg font-semibold text-gray-400 mb-4">Tags</h3>
//               {renderTags(metadata.format.tags)}
//             </div>
//           )}

//           {/* Streams */}
//           {metadata.streams?.map((stream, index) => (
//             <div key={index} className="mt-6 bg-gray-900 p-4 rounded">
//               <h3 className="text-lg font-semibold text-gray-400 mb-4">
//                 Stream {index + 1} - {stream.codec_type.toUpperCase()}
//               </h3>
//               {Object.entries(stream).map(([label, value]) => renderField(label, value))}
//               <p className="text-gray-400 italic mt-2">Field not editable</p>
//             </div>
//           ))}

//           {/* Download Button */}
//           {downloadLink && (
//             <div className="mt-10 text-center">
//               <a
//                 href={downloadLink}
//                 download
//                 className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer"
//               >
//                 Download Updated Video
//               </a>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   ) : (
//     <p className="text-center text-gray-400 text-lg mt-20">No file uploaded yet</p>
//   )}

//   <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
// </div>

//   );
// };

// export default MetadataCreation;

import React, { useState } from 'react';
import axios from 'axios';
import Alert from './Alert';

const MetadataCreation = () => {
  const [metadata, setMetadata] = useState(null);
  const [customProperties, setCustomProperties] = useState([]);
  const [downloadLink, setDownloadLink] = useState(''); // New state for download link
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false); 
  

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const commonMetadataFields = [
    'title', 'comment', 'artist', 'album', 'genre', 'description', 'copyright',
    'year'
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('video', file);

      try {
        const response = await axios.post(`${API_BASE_URL}/api/metadata/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const { userUuid, filename } = response.data;
        setMetadata({ ...response.data, userUuid, filename });
        setMetadata({ ...response.data, filename: response.data.filename });
      } catch (error) {
        console.error('Error uploading file:', error);
        setMetadata({ error: 'Failed to retrieve metadata' });
      }
    }
  };

  const addCustomProperty = () => {
    const newProperty = { label: '', value: '' };
    setCustomProperties([...customProperties, newProperty]);
  };

  const handleCustomPropertyChange = (index, field, value) => {
    const updatedProperties = [...customProperties];
    updatedProperties[index][field] = value;
    setCustomProperties(updatedProperties);
  };

  const saveMetadataToBackend = async () => {
    try {
      const { filename, userUuid } = metadata;
      if (!filename || !userUuid) {
        throw new Error('Filename or UUID missing from metadata');
    }
      const payload = {
        filename: metadata.filename,
        userUuid,
        customProperties: customProperties.reduce((acc, prop) => {
          acc[prop.label] = prop.value;
          return acc;
        }, {}),
      };

      const response = await axios.post(`${API_BASE_URL}/api/metadata/save`, payload);

      if (response.data.downloadPath) {
        setDownloadLink(`${API_BASE_URL}${response.data.downloadPath}`);
      }

      setAlertMessage('Metadata saved successfully!');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    } catch (error) {
      console.error('Error saving metadata:', error);
      setAlertMessage('Failed to save metadata!');
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };

  const renderField = (label, value, editable = false) => (
    <div className="flex justify-between items-center py-2">
      <label className="text-gray-300">{label}</label>
      <input
        type="text"
        value={value || ''}
        readOnly={!editable}
        className="bg-gray-800 text-white rounded px-2 py-1 w-1/2 text-left"
      />
    </div>
  );

  const renderTags = (tags) => (
    <>
      {Object.entries(tags).map(([key, value]) => (
        <div key={key} className="flex justify-between items-center py-2">
          <label className="text-gray-300">{key}</label>
          <input
            type="text"
            value={value || ''}
            readOnly
            className="bg-gray-800 text-white rounded px-2 py-1 w-1/2 text-left"
          />
        </div>
      ))}
      {/* Custom Properties for Tags */}
      {customProperties.map((prop, index) => (
        <div key={index} className="flex justify-between items-center py-2">
          <select
            value={prop.label}
            onChange={(e) => handleCustomPropertyChange(index, 'label', e.target.value)}
            className="bg-gray-800 text-white rounded px-2 py-1 w-1/2 text-left"
          >
            <option value="">Select Key</option>
            {commonMetadataFields.map((field) => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Property Value"
            value={prop.value}
            onChange={(e) => handleCustomPropertyChange(index, 'value', e.target.value)}
            className="bg-gray-800 text-white rounded px-2 py-1 w-1/2 text-left"
          />
        </div>
      ))}
      <button
        onClick={addCustomProperty}
        className="mt-4 bg-blue-500 text-white px-4 py-1 rounded cursor-pointer"
      >
        + Add property
      </button>
      <button
        onClick={saveMetadataToBackend}
        className="ml-4 mt-4 bg-green-500 text-white px-4 py-1 rounded cursor-pointer"
      >
        Save
      </button>
    </>
  );

  return (
<div className="text-white" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
  <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E] bg-[#1E1E1E]">
    <h2 className="text-xl font-normal text-center flex-grow">Metadata Creation</h2>
  </div>
  <div className="p-4">
    <p className="text-center text-gray-400 text-lg mt-20">Access Restricted by Admin</p>
  </div>
</div>


  );
};

export default MetadataCreation;