import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Project from './Project';
import MySheet from './MySheet';
import CueSheetGenerator from './CueSheetGenerator';
import Account from './Account';
import Folder from './Folder';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons'; 
import SubFolder from './SubFolder';
import MetadataCreation from './MetadataCreation';
import AutoSubtitling from './AutoSubtitling'
import AIVoiceover from './AIVoiceover'
import Metamorphosis from './Metamorphosis'
import GenreIdentification from './GenreIdentification'
import AutoDubbing from './AutoDubbing'



const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // const fetchWithAuth = async (url, options = {}) => {
  //   try {
  //     // Retrieve the token from localStorage
  //     const token = localStorage.getItem('token');
  //     if (!token) {
  //       throw new Error("Token not found. Logging out...");
  //     }
  
  //     const headers = {
  //       ...options.headers,
  //       Authorization: `${token}`,
  //     };
  
  //     const response = await fetch(url, { ...options, headers });
  
  //     if (response.status === 401 || response.status === 403) {
  //       console.error("Authorization error. Logging out...");
  //       handleLogout();
  //       return null;
  //     }

  //     return await response.json();
  //   } catch (error) {
  //     console.error("Error during fetch:", error.message);
  //     handleLogout();
  //   }
  // };
  
  // // Function to handle user logout
  // const handleLogout = () => {
  //   localStorage.removeItem('token');
  //   window.location.href = '/login';
  // };
  
  // fetchWithAuth(`${API_BASE_URL}/api/auth/user-email`)
  // .then((data) => {
  //   if (data) {
  //     console.log("Fetched data:", data);
  //   }
  // });

  
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]">
      {/* Conditionally render the toggle button */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="md:hidden p-4 text-gray-700 z-50 fixed top-2 left-1 bg-white rounded-lg shadow-md"
        >
          <FontAwesomeIcon icon={faBars} size="1x" />
        </button>
      )}

      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:w-64 bg-white border-r border-gray-200 h-full fixed z-40 shadow-lg`}
      >
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>

      <div className="flex-grow md:ml-64 bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5] overflow-y-auto">
        <Routes>
          <Route index element={<Project />} />
          <Route path="project" element={<Project />} />
          <Route path="project/:workspaceName" element={<Folder />} />
          <Route path="project/:workspaceName/:folderName" element={<SubFolder />} />
          <Route path="mysheet" element={<MySheet />} />
          <Route path="CueSheetGenerator" element={<CueSheetGenerator />} />
          <Route path="metadatacreation" element={<MetadataCreation/>} />
          <Route path="autosubtitling" element={<AutoSubtitling/>} />
          <Route path="aivoiceover" element={<AIVoiceover/>} />
          <Route path="metamorphosis" element={<Metamorphosis/>} />
          <Route path="genreidentification" element={<GenreIdentification/>} />
          <Route path="autodubbing" element={<AutoDubbing/>} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
