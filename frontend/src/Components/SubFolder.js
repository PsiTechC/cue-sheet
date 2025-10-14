import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';
import { CSVLink } from 'react-csv';  
import Alert from './Alert';  

Modal.setAppElement('#root');  
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const SubFolder = () => {
  const { workspaceName, folderName } = useParams(); 
  const navigate = useNavigate();  

  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [sheets, setSheets] = useState([]);  
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [assignedSheets, setAssignedSheets] = useState([]);  
  const [viewedTableData, setViewedTableData] = useState(null);  

   
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);  

   
  const [searchQuery, setSearchQuery] = useState('');  

   
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

   
  const fetchAssignedSheets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/project/${workspaceName}/${folderName}/assigned-sheets`, {
        withCredentials: true
      });
      setAssignedSheets(response.data.assignedSheets || []);  
    } catch (error) {
      console.error('Error fetching assigned sheets:', error);
    }
  };

   
  const openSheetModal = () => {
    fetchSheets();  
    setIsSheetModalOpen(true);
  };

   
  const closeSheetModal = () => {
    setIsSheetModalOpen(false);
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
        `${API_BASE_URL}/api/project/${workspaceName}/${folderName}/assign-sheets`, 
        { sheets: selectedSheets },  
        {
          headers: {
            Authorization: localStorage.getItem('token'),  
          },
        }
      );

      
      setAlertMessage('Sheets added successfully!');
      setAlertType('success');
      setAlertVisible(true);

       
      setTimeout(() => {
        setAlertVisible(false);  
      }, 3000);

      closeSheetModal();
      fetchAssignedSheets();  
    } catch (error) {
      console.error('Error assigning sheets:', error);
    }
  };
 
  const handleNavigation = (path) => {
    navigate(path);
  };

 
  useEffect(() => {
    fetchAssignedSheets();  
  }, [workspaceName, folderName]);

   
  const handleViewTable = (tableData) => {
    setViewedTableData(tableData);
    setIsSheetModalOpen(true);
  };

   
  const filteredAssignedSheets = assignedSheets.filter(sheet =>
    sheet.tableData[0]?.['Program Name']?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='text-white' style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
      
      <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E]">
        <h2 className="text-xl font-normal text-center flex-grow ml-30">
          
          <span
            className="underline cursor-pointer"
            style={{ color: 'grey' }}
            onClick={() => handleNavigation('/dashboard/project')}
          >
            Projects
          </span>
          {' > '}
          <span
            className="underline cursor-pointer"
            style={{ color: 'grey' }}
            onClick={() => handleNavigation(`/dashboard/project/${workspaceName}`)}
          >
            {workspaceName}
          </span>
          {' > '}
          {folderName} 
        </h2>

      </div>

      
      <div className="p-5 flex justify-between">
        <button
          onClick={openSheetModal}
          className="bg-[#669de3] hover:bg-[#9dc1f5] text-white py-2 px-6 rounded-md text-sm"
        >
          Add Sheets
        </button>
        <input
          type="text"
          placeholder="Search sheets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-2 p-0.5 w-[7rem] rounded-md bg-gray-800 text-white border border-gray-600 text-sm"
        />
      </div>

      
      <div className="p-5">
        <h3 className="text-xl font-normal mb-4">Assigned Sheets</h3>
        {filteredAssignedSheets.length > 0 ? (
          <ul className="mb-4">
            {filteredAssignedSheets.map((sheet, index) => (
              <div key={index} className="mb-2 flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2 w-1/3">
                  <span>{index + 1}. </span>
                  <h3 className="font-normal">
                    {sheet.tableData[0]?.['Program Name'] || 'N/A'}
                  </h3>
                </div>
                <div className="w-1/3 text-gray-400 text-center ">
                  Saved on: {new Date(sheet.savedAt).toLocaleString()}
                </div>
                <div className="w-1/3 flex justify-end space-x-2">
                  <button
                    onClick={() => handleViewTable(sheet.tableData)}
                    className="text-blue-500 hover:underline"
                  >
                    View
                  </button>
                  <CSVLink data={sheet.tableData} filename={`${sheet.tableData[0]["Program Name"] || "unknown"}_cue-sheet.csv`}>
                    <button className="bg-[#28603D] hover:bg-[#417155] text-white py-1 px-3 rounded-md text-sm font-normal">
                      Download CSV
                    </button>
                  </CSVLink>
                </div>
              </div>
            ))}
          </ul>
        ) : (
          <p>No sheets assigned to this folder.</p>
        )}
      </div>

       
      <Modal
        isOpen={isSheetModalOpen}
        onRequestClose={closeSheetModal}
        contentLabel="Add Sheets"
        className="bg-white p-6 rounded-md max-w-lg mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
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

      
      {alertVisible && (
        <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
      )}

      
      {viewedTableData && (  
        <Modal
          isOpen={isSheetModalOpen}
          onRequestClose={closeSheetModal}
          className="bg-gray-900 p-5 rounded-md max-w-4xl mx-auto"
          overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-40"
        >
          <h2 className="text-xl font-semibold mb-4 text-white">Table Data</h2>
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
           
          <button
            onClick={closeSheetModal}
            className="mt-4 bg-red-500 hover:bg-red-400 text-white py-1 px-4 rounded-md"
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  );
};

export default SubFolder;
