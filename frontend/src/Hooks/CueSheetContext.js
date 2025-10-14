import React, { createContext, useState } from 'react';

export const CueSheetContext = createContext();

export const CueSheetProvider = ({ children }) => {
  const [detectedSongs, setDetectedSongs] = useState([]);
  const [fileName, setFileName] = useState('');
  const [shortenedUrls, setShortenedUrls] = useState({});
  const [showTable, setShowTable] = useState(false);
  const [allLinksShortened, setAllLinksShortened] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

 
  const [formData, setFormData] = useState({
    tvChannel: '',
    programName: '',
    episodeNumber: '',
    onAirDate: '',
    movieAlbum: ''
  });

  return (
    <CueSheetContext.Provider value={{
      detectedSongs,
      setDetectedSongs,
      fileName,
      setFileName,
      shortenedUrls,
      setShortenedUrls,
      showTable,
      setShowTable,
      allLinksShortened,
      setAllLinksShortened,
      showButtons,
      setShowButtons,
      formData,             
      setFormData           
    }}>
      {children}
    </CueSheetContext.Provider>
  );
};
