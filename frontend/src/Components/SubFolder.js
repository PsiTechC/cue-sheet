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
    <div className='text-gray-800 dark:text-gray-200 min-h-screen bg-gray-50 dark:bg-[#1e1e1e] transition-colors duration-300' style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>

      <PageHeader
        title={
          <>
            <span
              className="text-gray-500 hover:text-[#10B981] cursor-pointer transition-colors"
              onClick={() => handleNavigation('/dashboard/project')}
            >
              Projects
            </span>
            <span className="text-gray-400 mx-2">›</span>
            <span
              className="text-gray-500 hover:text-[#10B981] cursor-pointer transition-colors"
              onClick={() => handleNavigation(`/dashboard/project/${workspaceName}`)}
            >
              {workspaceName}
            </span>
            <span className="text-gray-400 mx-2">›</span>
            <span className="text-gray-800">{folderName}</span>
          </>
        }
      />


      <div className="p-[22px] flex justify-between items-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-colors duration-300">
        <button
          onClick={openSheetModal}
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-2.5 px-6 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Add Sheets
        </button>
        <input
          type="text"
          placeholder="Search sheets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2.5 w-48 rounded-xl bg-white dark:bg-[#2d2d30] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
        />
      </div>


      <div className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mx-6 rounded-2xl transition-colors duration-300">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Assigned Sheets</h3>
        {filteredAssignedSheets.length > 0 ? (
          <div className="space-y-3">
            {filteredAssignedSheets.map((sheet, index) => (
              <div key={index} className="p-4 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4 flex-1">
                    <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                        {sheet.tableData[0]?.['Program Name'] || 'N/A'}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Saved on: {new Date(sheet.savedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewTable(sheet.tableData)}
                      className="bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View</span>
                    </button>
                    <CSVLink data={sheet.tableData} filename={`${sheet.tableData[0]["Program Name"] || "unknown"}_cue-sheet.csv`}>
                      <button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
                        Download CSV
                      </button>
                    </CSVLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sheets assigned to this folder.</p>
        )}
      </div>


      <Modal
        isOpen={isSheetModalOpen && !viewedTableData}
        onRequestClose={closeSheetModal}
        contentLabel="Add Sheets"
        className="bg-white dark:bg-gray-800 p-8 rounded-3xl max-w-2xl mx-auto border border-gray-200 dark:border-gray-700 shadow-2xl transition-colors duration-300"
        overlayClassName="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md flex justify-center items-center z-50"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-4">Add Sheets</h2>

        {sheets.length > 0 ? (
          <div className="mb-6 max-h-96 overflow-y-auto pr-2">
            <div className="space-y-2">
              {sheets.map((sheet, index) => (
                <label
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl cursor-pointer transition-all border border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500"
                >
                  <span className="text-gray-800 dark:text-gray-100 font-medium">
                    {sheet.tableData[0]?.['Program Name'] || 'Untitled Program'}
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedSheets.includes(sheet._id)}
                    onChange={() => handleSheetSelection(sheet._id)}
                    className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sheets available.</p>
        )}
        <div className="flex justify-end gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={closeSheetModal}
            className="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitSheets}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
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
          className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full mx-4 border border-gray-200 dark:border-gray-700 shadow-xl transition-colors duration-300"
          overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-t-lg flex items-center justify-between transition-colors duration-300">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cue Sheet Data</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View subfolder sheet details</p>
            </div>
            <button
              onClick={closeSheetModal}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            <table className="min-w-full border-collapse">
              <thead className="bg-primary-600 dark:bg-primary-700 text-white sticky top-0 z-10">
                <tr>
                  {Object.keys(viewedTableData[0]).map((key, index) => (
                    <th
                      key={index}
                      className="border-r border-primary-700 dark:border-primary-800 last:border-r-0 px-4 py-3 text-left font-semibold text-sm uppercase tracking-wide whitespace-nowrap"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {viewedTableData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`${
                      rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                    } hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors`}
                  >
                    {Object.values(row).map((value, colIndex) => (
                      <td
                        key={colIndex}
                        className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap"
                      >
                        {value && value !== '-' && value !== 'N/A' ? (
                          String(value).startsWith('http') ? (
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                            >
                              {value.length > 40 ? value.substring(0, 40) + '...' : value}
                            </a>
                          ) : (
                            <span className="text-gray-900 dark:text-gray-100">{value}</span>
                          )
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex items-center justify-between transition-colors duration-300">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {viewedTableData.length} {viewedTableData.length === 1 ? 'record' : 'records'}
            </p>
            <button
              onClick={closeSheetModal}
              className="border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-6 rounded font-medium text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SubFolder;
