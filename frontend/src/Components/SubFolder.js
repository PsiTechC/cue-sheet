import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import Alert from './Alert';
import PageHeader from './PageHeader';  

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
    <div className='text-gray-800 min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]' style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>

      <PageHeader
        title={
          <>
            <span
              className="text-gray-500 hover:text-[#4CAF50] cursor-pointer transition-colors"
              onClick={() => handleNavigation('/dashboard/project')}
            >
              Projects
            </span>
            <span className="text-gray-400 mx-2">›</span>
            <span
              className="text-gray-500 hover:text-[#4CAF50] cursor-pointer transition-colors"
              onClick={() => handleNavigation(`/dashboard/project/${workspaceName}`)}
            >
              {workspaceName}
            </span>
            <span className="text-gray-400 mx-2">›</span>
            <span className="text-gray-800">{folderName}</span>
          </>
        }
      />


      <div className="p-[22px] flex justify-between items-center">
        <button
          onClick={openSheetModal}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 px-6 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Add Sheets
        </button>
        <input
          type="text"
          placeholder="Search sheets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2.5 w-48 rounded-xl bg-white text-gray-800 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent shadow-sm"
        />
      </div>


      <div className="p-6 bg-white/50 backdrop-blur-sm mx-6 rounded-2xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Assigned Sheets</h3>
        {filteredAssignedSheets.length > 0 ? (
          <div className="space-y-3">
            {filteredAssignedSheets.map((sheet, index) => (
              <div key={index} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#4CAF50] transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4 flex-1">
                    <span className="w-8 h-8 bg-gradient-to-br from-[#4CAF50] to-[#66BB6A] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {sheet.tableData[0]?.['Program Name'] || 'N/A'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Saved on: {new Date(sheet.savedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewTable(sheet.tableData)}
                      className="text-blue-500 hover:text-blue-700 font-medium transition-colors"
                    >
                      View
                    </button>
                    <CSVLink data={sheet.tableData} filename={`${sheet.tableData[0]["Program Name"] || "unknown"}_cue-sheet.csv`}>
                      <button className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
                        Download CSV
                      </button>
                    </CSVLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No sheets assigned to this folder.</p>
        )}
      </div>


      <Modal
        isOpen={isSheetModalOpen && !viewedTableData}
        onRequestClose={closeSheetModal}
        contentLabel="Add Sheets"
        className="bg-white p-8 rounded-3xl max-w-2xl mx-auto border border-gray-200 shadow-2xl"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-4">Add Sheets</h2>

        {sheets.length > 0 ? (
          <div className="mb-6 max-h-96 overflow-y-auto pr-2">
            <div className="space-y-2">
              {sheets.map((sheet, index) => (
                <label
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all border border-gray-200 hover:border-[#4CAF50]"
                >
                  <span className="text-gray-800 font-medium">
                    {sheet.tableData[0]?.['Program Name'] || 'Untitled Program'}
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedSheets.includes(sheet._id)}
                    onChange={() => handleSheetSelection(sheet._id)}
                    className="w-5 h-5 text-[#4CAF50] rounded focus:ring-[#4CAF50] cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No sheets available.</p>
        )}
        <div className="flex justify-end gap-4 border-t border-gray-200 pt-4">
          <button
            onClick={closeSheetModal}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitSheets}
            className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
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
          isOpen={isSheetModalOpen && viewedTableData}
          onRequestClose={closeSheetModal}
          className="bg-white p-8 rounded-3xl max-w-6xl mx-auto border border-gray-200 shadow-2xl"
          overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
        >
          <div className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] -m-8 mb-6 p-6 rounded-t-3xl">
            <h2 className="text-2xl font-bold text-white">Table Data</h2>
          </div>
          <div className="overflow-auto max-h-[32rem]">
            <table className="min-w-full text-gray-800 border-collapse">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0">
                <tr>
                  {Object.keys(viewedTableData[0]).map((key, index) => (
                    <th key={index} className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewedTableData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                    {Object.values(row).map((value, colIndex) => (
                      <td key={colIndex} className="border border-gray-300 px-4 py-2 text-sm">
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
            className="mt-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  );
};

export default SubFolder;
