import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { CSVLink } from 'react-csv';
import Alert from './Alert';
import PageHeader from './PageHeader'; 

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown !== null) {
        const dropdowns = document.querySelectorAll('.dropdown-menu');
        let clickedInside = false;

        dropdowns.forEach((dropdown) => {
          if (dropdown.contains(event.target)) {
            clickedInside = true;
          }
        });

        const dropdownButtons = document.querySelectorAll('.dropdown-button');
        dropdownButtons.forEach((button) => {
          if (button.contains(event.target)) {
            clickedInside = true;
          }
        });

        if (!clickedInside) {
          setShowDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);


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
      fetchAssignedSheets();
      closeSheetModal();
      setSelectedSheets([]);
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
            withCredentials: true,
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
          withCredentials: true,
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
      withCredentials: true,
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
    <div className='text-gray-800 min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]' style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>

      <PageHeader
        title={
          <>
            <span
              className="text-gray-500 hover:text-[#4CAF50] cursor-pointer transition-colors"
              onClick={() => navigate('/dashboard/project')}
            >
              Projects
            </span>
            <span className="text-gray-400 mx-2">›</span>
            <span className="text-gray-800">{workspaceName}</span>
          </>
        }
      />


      <div className="p-[22px] flex justify-between items-center bg-white/50 backdrop-blur-sm">
  <div className="flex gap-3">
    <button
      onClick={openModal}
      className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white py-2.5 px-6 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
    >
      Create Folder
    </button>
    <button
      onClick={openSheetModal}
      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 px-6 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
    >
      Assign Sheets
    </button>
  </div>
  <input
    type="text"
    placeholder="Search..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="ml-2 px-4 py-2 w-48 rounded-xl bg-white text-gray-800 border border-gray-200 focus:border-[#4CAF50] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 text-sm shadow-sm"
  />
</div>




      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredFolders.length > 0 ? (
          filteredFolders.map((folder, index) => (
            <div
              key={index}
              className="group bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:border-[#4CAF50] transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl relative overflow-hidden"
              onClick={() => handleDoubleClick(folder.folderName)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#4CAF50]/0 to-[#66BB6A]/0 group-hover:from-[#4CAF50]/5 group-hover:to-[#66BB6A]/5 transition-all duration-300 rounded-2xl"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4CAF50] to-[#66BB6A] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <FontAwesomeIcon icon={faEllipsisV} className="text-white text-lg" />
                  </div>
                  <div
                    className="dropdown-button p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown(index);
                    }}
                  >
                    <FontAwesomeIcon icon={faEllipsisV} className="text-gray-400 hover:text-gray-700 cursor-pointer" />
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 truncate group-hover:text-[#4CAF50] transition-colors">
                    {folder.folderName}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">
                    Click to open
                  </p>
                </div>

                <div className="mt-4 h-1.5 w-0 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] group-hover:w-full transition-all duration-500 rounded-full"></div>
              </div>

              {showDropdown === index && (
                <div className="dropdown-menu absolute right-2 top-16 bg-white border border-gray-200 shadow-xl rounded-xl z-20 overflow-hidden min-w-[150px]">
                  <button
                    className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left flex items-center gap-2 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRenameModal(folder._id, folder.folderName);
                      setShowDropdown(null);
                    }}
                  >
                    Rename
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button
                    className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left flex items-center gap-2 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder._id);
                      setShowDropdown(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <span className="text-4xl">📁</span>
            </div>
            <h3 className="text-gray-700 text-xl font-semibold">No folders found</h3>
            <p className="text-gray-500 text-sm mt-2">Create your first folder to get started</p>
          </div>
        )}
      </div>



      <div className="p-6 bg-white/50 backdrop-blur-sm mx-6 rounded-2xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Assigned Sheets</h3>
        {filteredAssignedSheets.length > 0 ? (
          filteredAssignedSheets.map((sheet, index) => (
            <div key={index} className="mb-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#4CAF50] transition-all flex justify-between items-center">
              <div className="flex items-center space-x-3 w-1/3">
                <span className="w-8 h-8 bg-gradient-to-br from-[#4CAF50] to-[#66BB6A] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </span>
                <h3 className="font-semibold text-gray-800">
                  {sheet.tableData[0]?.['Program Name'] || 'N/A'}
                </h3>
              </div>

              <div className="w-1/3 text-gray-500 text-center text-sm">
                {new Date(sheet.savedAt).toLocaleDateString()}
              </div>

              <div className="w-1/3 flex justify-end space-x-2">
                <button
                  onClick={() => handleViewTable(sheet.tableData)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
                >
                  View
                </button>

                <CSVLink data={sheet.tableData} filename={`${sheet.tableData[0]['Program Name'] || 'unknown'}_cue-sheet.csv`}>
                  <button className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white py-2 px-4 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                    Download CSV
                  </button>
                </CSVLink>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No assigned sheets.</p>
        )}
      </div>



      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Create Folder"
        className="bg-white p-8 rounded-3xl max-w-md mx-auto border border-gray-200 shadow-2xl"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">New Folder</h2>
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="w-full p-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 focus:border-[#4CAF50] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 mb-6"
          placeholder="Enter folder name..."
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateFolder}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Create
          </button>
        </div>
      </Modal>



      <Modal
        isOpen={isSheetModalOpen}
        onRequestClose={closeSheetModal}
        contentLabel="Add Sheets"
        className="bg-white p-8 rounded-3xl max-w-lg mx-auto border border-gray-200 shadow-2xl"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Sheets</h2>

        {sheets.length > 0 ? (
          <ul className="mb-6 max-h-96 overflow-y-auto">
            {sheets.map((sheet, index) => (
              <li key={index} className="flex items-center justify-between p-3 mb-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <span className="text-gray-800 font-medium">{sheet.tableData[0]?.['Program Name'] || 'Untitled Program'}</span>
                <input
                  type="checkbox"
                  checked={selectedSheets.includes(sheet._id)}
                  onChange={() => handleSheetSelection(sheet._id)}
                  className="w-5 h-5 text-[#4CAF50] rounded focus:ring-[#4CAF50] cursor-pointer"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-8">No sheets available.</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={closeSheetModal}
            className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitSheets}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Add Sheets
          </button>
        </div>
      </Modal>



      <Modal
        isOpen={viewedTableData !== null}
        onRequestClose={closeModalView}
        className="bg-white p-6 rounded-3xl max-w-6xl mx-auto border border-gray-200 shadow-2xl"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Table Data</h2>
        {viewedTableData && viewedTableData.length > 0 ? (
          <div className="overflow-auto max-h-[500px] rounded-xl border border-gray-200">
            <table className="min-w-full text-gray-800 border-collapse">
              <thead className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] sticky top-0">
                <tr>
                  {Object.keys(viewedTableData[0]).map((key, index) => (
                    <th key={index} className="border-b border-white/20 px-4 py-3 text-white font-semibold text-left">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {viewedTableData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                    {Object.values(row).map((value, colIndex) => (
                      <td key={colIndex} className="border-b border-gray-100 px-4 py-3 text-sm">
                        {value || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No data available to display.</p>
        )}

        <button
          onClick={closeModalView}
          className="mt-6 px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all"
        >
          Close
        </button>
      </Modal>


<Modal
  isOpen={renameModalOpen}
  onRequestClose={() => setRenameModalOpen(false)}
  contentLabel="Rename Folder"
  className="bg-white p-8 rounded-3xl max-w-md mx-auto border border-gray-200 shadow-2xl"
  overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
>
  <h2 className="text-2xl font-bold text-gray-800 mb-6">Rename Folder</h2>
  <input
    type="text"
    value={newFolderNameForRename}
    onChange={(e) => setNewFolderNameForRename(e.target.value)}
    className="w-full p-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 mb-6"
    placeholder="Enter new folder name..."
  />
  <div className="flex justify-end gap-3">
    <button
      onClick={() => setRenameModalOpen(false)}
      className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all"
    >
      Cancel
    </button>
    <button
      onClick={handleRenameFolder}
      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
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
