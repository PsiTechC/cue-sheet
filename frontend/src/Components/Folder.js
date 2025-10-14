import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { CSVLink } from 'react-csv'; 
import Alert from './Alert'; 

Modal.setAppElement('#root');
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Folder = () => {
  const { workspaceName } = useParams(); 
  const navigate = useNavigate();  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('Untitled folder');
  const [folders, setFolders] = useState([]);
  const [sheets, setSheets] = useState([]);  
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [assignedSheets, setAssignedSheets] = useState([]);
  const [viewedTableData, setViewedTableData] = useState(null);  
  const [showDropdown, setShowDropdown] = useState(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newFolderNameForRename, setNewFolderNameForRename] = useState('');
  const [searchQuery, setSearchQuery] = useState('');  

  
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);  

   
  const fetchFolders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/project/${workspaceName}/folders`, {
        withCredentials: true,
      });
      setFolders(response.data.folders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

   
  const fetchAssignedSheets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/project/${workspaceName}/assigned-sheets`, {
        withCredentials: true,
      });
      setAssignedSheets(response.data.assignedSheets || []);  
    } catch (error) {
      console.error('Error fetching assigned sheets:', error);
    }
  };

  useEffect(() => {
    fetchFolders();  
    fetchAssignedSheets();  
  }, [workspaceName]);

   
  const filteredFolders = folders.filter(folder =>
    folder.folderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignedSheets = assignedSheets.filter(sheet =>
    sheet.tableData[0]?.['Program Name']?.toLowerCase().includes(searchQuery.toLowerCase())
  );

   
  const openModal = () => {
    setIsModalOpen(true);
  };

   
  const closeModal = () => {
    setIsModalOpen(false);
    setNewFolderName('Untitled folder');  
  };

   
  const openSheetModal = () => {
    fetchSheets();
    setIsSheetModalOpen(true);
  };

   
  const closeSheetModal = () => {
    setIsSheetModalOpen(false);
  };

  
  const fetchSheets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get-tables`, {
        withCredentials: true,
      });
      setSheets(response.data.savedTables || []);  
    } catch (error) {
      console.error('Error fetching sheets:', error);
    }
  };

   
  const handleSheetSelection = (sheetId) => {
    setSelectedSheets((prevSelected) =>
      prevSelected.includes(sheetId)
        ? prevSelected.filter((s) => s !== sheetId)
        : [...prevSelected, sheetId]
    );
  };

   
  const handleSubmitSheets = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/project/${workspaceName}/add-sheets`,
        { sheets: selectedSheets },
        {
          withCredentials: true,
        }
      );
      fetchFolders();  
      closeSheetModal();
      setAlertMessage('Sheets added to project successfully!');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);  
    } catch (error) {
      console.error('Error adding sheets to project:', error);
      setAlertMessage('Error adding sheets to project.');
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);  
    }
  };

   
  const handleCreateFolder = async () => {
    if (newFolderName) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/project/${workspaceName}/add-folder`,
          { folderName: newFolderName },
          {
            headers: {
              Authorization: localStorage.getItem('token'),
            },
          }
        );
        setFolders([...folders, response.data]);
        closeModal();
        setAlertMessage('Folder created successfully!');
        setAlertType('success');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);  
      } catch (error) {
        console.error('Error creating folder:', error);
        setAlertMessage('Error creating folder.');
        setAlertType('error');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);  
      }
    }
  };

 
const handleRenameFolder = async () => {
  if (newFolderNameForRename) {
    try {
      await axios.put(
        `${API_BASE_URL}/api/project/${workspaceName}/rename-folder/${selectedFolder}`,
        { newFolderName: newFolderNameForRename },
        {
          headers: {
            Authorization: localStorage.getItem('token'),
          },
        }
      );
      fetchFolders();  
      setRenameModalOpen(false); 
      setAlertMessage('Folder renamed successfully!');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);  
      setShowDropdown(null);  
    } catch (error) {
      console.error('Error renaming folder:', error);
      setAlertMessage('Error renaming folder.');
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);  
    }
  }
};

 
const handleDeleteFolder = async (folderId) => {
  try {
    await axios.delete(`${API_BASE_URL}/api/project/${workspaceName}/delete-folder/${folderId}`, {
      headers: {
        Authorization: localStorage.getItem('token'),
      },
    });
    fetchFolders();  
    setAlertMessage('Folder deleted successfully!');
    setAlertType('success');
    setAlertVisible(true);
    setTimeout(() => setAlertVisible(false), 5000);  
    setShowDropdown(null);  
  } catch (error) {
    console.error('Error deleting folder:', error);
    setAlertMessage('Error deleting folder.');
    setAlertType('error');
    setAlertVisible(true);
    setTimeout(() => setAlertVisible(false), 5000);  
  }
};

  
  const toggleDropdown = (index) => {
    setShowDropdown(showDropdown === index ? null : index); 
  };

  
  const openRenameModal = (folderId, folderName) => {
    setSelectedFolder(folderId);
    setNewFolderNameForRename(folderName);
    setRenameModalOpen(true);
  };

   
  const handleViewTable = (tableData) => {
    if (tableData && tableData.length > 0) {
      setViewedTableData(tableData);
      setIsModalOpen(true);
    } else {
      console.error('No data available to view');
    }
  };

   
  const closeModalView = () => {
    setViewedTableData(null);
    setIsModalOpen(false);
  };

 
  const handleDoubleClick = (folderName) => {
    navigate(`/dashboard/project/${workspaceName}/${folderName}`); 
  };

  return (
    <div className='text-white' style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
       
      <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E]">
        <h2 className="text-xl font-normal text-center flex-grow ml-30">
          <span
            className="underline cursor-pointer"
            style={{ color: 'grey' }}
            onClick={() => navigate('/dashboard/project')}
          >
            Projects
          </span>
          {' > '}{workspaceName}
        </h2>

      
      </div>

    
      <div className="p-5 flex justify-between items-center">
  <div className="flex gap-4">
    <button
      onClick={openModal}
      className="bg-[#28603D] hover:bg-[#417155] text-white py-2 px-6 rounded-md text-sm"
    >
      Create Folder
    </button>
    <button
      onClick={openSheetModal}
      className="bg-[#669de3] hover:bg-[#9dc1f5] text-white py-2 px-6 rounded-md text-sm"
    >
      Assign Sheets
    </button>
  </div>
  <input
    type="text"
    placeholder="Search..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="ml-2 p-0.5 w-[7rem] rounded-md bg-gray-800 text-white border border-gray-600 text-sm"
  />
</div>


       
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {filteredFolders.length > 0 ? (
          filteredFolders.map((folder, index) => (
            <div
              key={index}
              className="bg-gray-200 text-black p-4 rounded-md flex justify-between items-center shadow-md border relative cursor-pointer"
              onClick={() => handleDoubleClick(folder.folderName)}  
            >
              <div className="flex items-center">
                <div className="bg-gray-500 text-white p-2 rounded-full mr-4"></div>
                <div className="font-normal">{folder.folderName}</div>
              </div>
              <div className="relative">
                <FontAwesomeIcon icon={faEllipsisV} className="cursor-pointer" onClick={() => toggleDropdown(index)} />
                {showDropdown === index && (
                  <div className="absolute right-0 top-10 bg-white shadow-lg rounded-md z-10">
                    <button
                      className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                      onClick={() => {
                        openRenameModal(folder._id, folder.folderName);
                        setShowDropdown(null);  
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                      onClick={() => {
                        handleDeleteFolder(folder._id);
                        setShowDropdown(null);  
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <h3 className="text-gray-400 text-lg">No folder or sheet assigned</h3>
        )}
      </div>

       
      <div className="p-5">
        <h3 className="text-xl font-normal mb-4">Assigned Sheets</h3>
        {filteredAssignedSheets.length > 0 ? (
          filteredAssignedSheets.map((sheet, index) => (
            <div key={index} className="mb-2 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2 w-1/3">
                <span>{index + 1}. </span>
                <h3 className="font-normal">
                  {sheet.tableData[0]?.['Program Name'] || 'N/A'}
                </h3>
              </div>

              <div className="w-1/3 text-gray-400 text-center ">
                {new Date(sheet.savedAt).toLocaleString()}
              </div>

              <div className="w-1/3 flex justify-end space-x-2">
                 
                <button
                  onClick={() => handleViewTable(sheet.tableData)}
                  className="text-blue-500 hover:underline"
                >
                  View
                </button>

                 
                <CSVLink data={sheet.tableData} filename={`${sheet.tableData[0]['Program Name'] || 'unknown'}_cue-sheet.csv`}>
                  <button className="bg-[#28603D] hover:bg-[#417155] text-white py-1 px-3 rounded-md text-sm font-normal">
                    Download CSV
                  </button>
                </CSVLink>
              </div>
            </div>
          ))
        ) : (
          <p>No assigned sheets.</p>
        )}
      </div>

       
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Create Folder"
        className="bg-white p-6 rounded-md max-w-lg mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <h2 className="text-lg font-bold mb-4">New Folder</h2>
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={closeModal}
            className="text-blue-500 hover:text-blue-600"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateFolder}
            className="text-blue-500 hover:text-blue-600"
          >
            Create
          </button>
        </div>
      </Modal>

       
      <Modal
        isOpen={isSheetModalOpen}
        onRequestClose={closeSheetModal}
        contentLabel="Add Sheets"
        className="bg-white p-6 rounded-md max-w-lg mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"
      >
        <h2 className="text-lg font-bold mb-4">Add Sheets</h2>
        
        {sheets.length > 0 ? (
          <ul className="mb-4">
            {sheets.map((sheet, index) => (
              <li key={index} className="flex items-center justify-between mb-2">
                <span>{sheet.tableData[0]?.['Program Name'] || 'Untitled Program'}</span>
                <input
                  type="checkbox"
                  checked={selectedSheets.includes(sheet._id)}
                  onChange={() => handleSheetSelection(sheet._id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>No sheets available.</p>
        )}
        <div className="flex justify-end gap-4">
          <button
            onClick={closeSheetModal}
            className="text-blue-500 hover:text-blue-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitSheets}
            className="text-blue-500 hover:text-blue-600"
          >
            Add Sheets
          </button>
        </div>
      </Modal>

       
      <Modal
        isOpen={viewedTableData !== null}  
        onRequestClose={closeModalView}
        className="bg-gray-900 p-5 rounded-md max-w-4xl mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-40"
      >
        <h2 className="text-xl font-semibold mb-4 text-white">Table Data</h2>
        {viewedTableData && viewedTableData.length > 0 ? (
          <div className="overflow-auto max-h-96">  
            <table className="min-w-full text-white border-collapse border border-gray-600">
              <thead className="bg-gray-700">
                <tr>
                  {Object.keys(viewedTableData[0]).map((key, index) => (
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
        ) : (
          <p>No data available to display.</p>
        )}
         
        <button
          onClick={closeModalView}
          className="mt-4 bg-red-500 hover:bg-red-400 text-white py-1 px-4 rounded-md"
        >
          Close
        </button>
      </Modal>

 
<Modal
  isOpen={renameModalOpen}
  onRequestClose={() => setRenameModalOpen(false)}  
  contentLabel="Rename Folder"
  className="bg-white p-6 rounded-md max-w-lg mx-auto"
  overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
>
  <h2 className="text-lg font-bold mb-4">Rename Folder</h2>
  <input
    type="text"
    value={newFolderNameForRename}
    onChange={(e) => setNewFolderNameForRename(e.target.value)}
    className="w-full p-2 border rounded mb-4"
  />
  <div className="flex justify-end gap-4">
    <button
      onClick={() => setRenameModalOpen(false)}
      className="text-blue-500 hover:text-blue-600"
    >
      Cancel
    </button>
    <button
      onClick={handleRenameFolder}
      className="text-blue-500 hover:text-blue-600"
    >
      Rename
    </button>
  </div>
</Modal>

      
      {alertVisible && (
        <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
      )}
    </div>
  );
};

export default Folder;
