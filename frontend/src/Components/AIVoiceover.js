// import React, { useState } from 'react';
// import axios from 'axios';

// const AIVoiceover = () => {
//   const [text, setText] = useState('');
//   const [translatedText, setTranslatedText] = useState('');
//   const [selectedLanguage, setSelectedLanguage] = useState('en-US');
//   const [selectedVoice, setSelectedVoice] = useState('en-US-Wavenet-B');
//   const [audioUrl, setAudioUrl] = useState(null);
//   const [audioKey, setAudioKey] = useState(Date.now());

//   const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
//   // Language and Voice options with multiple accents
//   const languages = [
//     { label: 'English (US)', value: 'en-US' },
//     { label: 'English (UK)', value: 'en-GB' },
//     { label: 'English (Australian)', value: 'en-AU' },
//     { label: 'English (Indian)', value: 'en-IN' },
//     { label: 'Hindi (IN)', value: 'hi-IN' },
//     { label: 'Marathi (IN)', value: 'mr-IN' },
//     { label: 'Telugu (Fallback to English)', value: 'te-IN' },
//     { label: 'Tamil (Fallback to English)', value: 'ta-IN' },
//     { label: 'Malayalam (Fallback to English)', value: 'ml-IN' },
//   ];

//   // Available voices
//   const voices = {
//     'en-US': [
//       { label: 'Male (Wavenet)', value: 'en-US-Wavenet-B' },
//       { label: 'Female (Wavenet)', value: 'en-US-Wavenet-F' },
//       { label: 'Male (Standard)', value: 'en-US-Standard-B' },
//       { label: 'Female (Standard)', value: 'en-US-Standard-C' },
//     ],
//     'en-GB': [
//       { label: 'Male (Standard)', value: 'en-GB-Standard-A' },
//       { label: 'Female (Standard)', value: 'en-GB-Standard-B' },
//     ],
//     'en-AU': [
//       { label: 'Male (Standard)', value: 'en-AU-Standard-B' },
//       { label: 'Female (Standard)', value: 'en-AU-Standard-C' },
//     ],
//     'en-IN': [
//       { label: 'Male (Standard)', value: 'en-IN-Standard-B' },
//       { label: 'Female (Standard)', value: 'en-IN-Standard-A' },
//     ],
//     'hi-IN': [
//       { label: 'Male (Wavenet)', value: 'hi-IN-Wavenet-B' },
//       { label: 'Female (Wavenet)', value: 'hi-IN-Wavenet-A' },
//     ],
//     'mr-IN': [
//       { label: 'Male (Wavenet)', value: 'mr-IN-Wavenet-B' },
//       { label: 'Female (Wavenet)', value: 'mr-IN-Wavenet-A' },
//     ],
//     // Fallback to English voices for Telugu, Tamil, and Malayalam
//     'te-IN': [
//       { label: 'Male (English Fallback)', value: 'en-US-Wavenet-B' },
//       { label: 'Female (English Fallback)', value: 'en-US-Wavenet-F' },
//     ],
//     'ta-IN': [
//       { label: 'Male (English Fallback)', value: 'en-US-Wavenet-B' },
//       { label: 'Female (English Fallback)', value: 'en-US-Wavenet-F' },
//     ],
//     'ml-IN': [
//       { label: 'Male (English Fallback)', value: 'en-US-Wavenet-B' },
//       { label: 'Female (English Fallback)', value: 'en-US-Wavenet-F' },
//     ],
//   };

//   const handleTextChange = (e) => setText(e.target.value);

//   const handleLanguageChange = (e) => {
//     setSelectedLanguage(e.target.value);
//     setSelectedVoice(voices[e.target.value][0].value);
//   };

//   const handleVoiceChange = (e) => setSelectedVoice(e.target.value);

//   const handleTranslateAndSynthesize = async () => {
    
//     try {
//       // Step 1: Translate the text into the selected language
//       const translateUrl = `${API_BASE_URL}/api/voice/translate`;
//       const translateResponse = await axios.post(translateUrl, {
//         q: text,
//         target: selectedLanguage.split('-')[0], // Language code, e.g., 'en' for 'en-US'
//       });
//       const translatedText = translateResponse.data.data.translations[0].translatedText;
//       setTranslatedText(translatedText);

//       // Step 2: Synthesize the translated text to speech
//       const ttsUrl = `${API_BASE_URL}/api/voice/tts`;
//       const ttsRequestData = {
//         input: { text: translatedText },
//         voice: { languageCode: selectedLanguage, name: selectedVoice },
//         audioConfig: { audioEncoding: 'MP3' },
//       };

//       const ttsResponse = await axios.post(ttsUrl, ttsRequestData);
//       const audioContent = ttsResponse.data.audioContent;

//       if (audioContent) {
//         setAudioUrl(`data:audio/mp3;base64,${audioContent}`);
//         setAudioKey(Date.now());
//       } else {
//         console.log("No audio content received");
//       }
//     } catch (error) {
//       console.error("Error in translation or TTS request:", error.response ? error.response.data : error.message);
//       alert("The selected language or voice may not be supported by TTS. Defaulting to English voice.");
//     }
//   };

//   const handleDownloadText = () => {
//     const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = 'AI_translated_text.txt';
//     link.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="text-gray-800 min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
//       <div className="p-6 flex justify-between items-center border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm" style={{ minHeight: '73px' }}>
//         <h2 className="text-xl font-semibold text-center flex-grow text-gray-800">AI Voiceover</h2>
//       </div>

//       <div className="p-4 mr-4">
//         <div className="flex flex-col items-start mt-10">
//           {/* Language and Voice Selection */}
//           <div className="w-full max-w-lg -mt-10 flex space-x-2 mb-4">
//             <select
//               className="w-1/2 p-2 border border-gray-600 bg-[#1E1E1E] text-white text-lg rounded focus:outline-none font-normal"
//               value={selectedLanguage}
//               onChange={handleLanguageChange}
//             >
//               {languages.map((language) => (
//                 <option key={language.value} value={language.value}>
//                   {language.label}
//                 </option>
//               ))}
//             </select>

//             <select
//               className="w-1/2 p-2 border border-gray-600 bg-[#1E1E1E] text-white text-lg rounded focus:outline-none font-normal"
//               value={selectedVoice}
//               onChange={handleVoiceChange}
//             >
//               {voices[selectedLanguage].map((voice) => (
//                 <option key={voice.value} value={voice.value}>
//                   {voice.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Text Input */}
//           <textarea
//             className="w-full max-w-lg p-3 border border-gray-600 bg-white text-black rounded focus:outline-none"
//             placeholder="Enter text here..."
//             value={text}
//             onChange={handleTextChange}
//             rows={10}
//           ></textarea>

//           {/* Translate and Synthesize Button */}
//           <button
//             className="mt-6 bg-[#28603D] hover:bg-[#417155] text-white rounded py-2 px-4 rounded-md text-sm"
//             onClick={handleTranslateAndSynthesize}
//           >
//             Translate and Synthesize
//           </button>

//           {/* Translated Text Display */}
//           {translatedText && (
//             <p className="mt-4 text-lg text-gray-400">Translated Text: {translatedText}</p>
//           )}

//           {/* Audio Playback and Download */}
//           {audioUrl && (
//             <>
//               <audio key={audioKey} controls className="mt-4">
//                 <source src={audioUrl} type="audio/mp3" />
//                 Your browser does not support the audio element.
//               </audio>
//               <div className="mt-4 flex space-x-4">
//                 <a
//                   href={audioUrl}
//                   download="AI_audio.mp3"
//                   className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
//                 >
//                   Download MP3
//                 </a>
//                 <button
//                   onClick={handleDownloadText}
//                   className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
//                 >
//                   Download Text
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AIVoiceover;


import React from 'react';
import PageHeader from './PageHeader';

const AIVoiceover = () => {
  return (
    <div className="text-gray-800 min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
      <PageHeader title="AI Voiceover" />

      <div className="p-4">
        <p className="text-center text-gray-400 text-lg mt-20">Access Restricted by Admin</p>
      </div>
    </div>
  );
};

export default AIVoiceover;
