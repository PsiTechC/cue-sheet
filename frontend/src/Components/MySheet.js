import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import eLogo from '../Assets/e-logo.svg';
import LoadingPlaceholder from './LoadingPlaceholder'

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MySheets = () => {
  const [savedTables, setSavedTables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewedTableData, setViewedTableData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);  // Track if the device is mobile
  const [isSearchActive, setIsSearchActive] = useState(false); // Track if search is active
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef(null);  // Ref for search input


  useEffect(() => {
    const fetchSavedTables = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/get-tables`, {
          withCredentials: true,
        });
        setSavedTables(response.data.savedTables || []); // Set the data
      } catch (error) {
        console.error('Error fetching saved tables:', error);
        setSavedTables([]); // Fallback to empty array in case of an error
      } finally {
        setLoading(false); // Ensure loading state is updated to false
      }
    };

    fetchSavedTables();

    // Check for mobile screen size (using window width)
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Adjust the width threshold as needed
    };

    handleResize(); // Check initial screen size
    window.addEventListener('resize', handleResize); // Update on window resize
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  useEffect(() => {
    // Close the search input when clicked outside of it
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setIsSearchActive(false);  // Close search input when clicking outside
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleViewTable = (tableData) => {
    setViewedTableData(tableData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const filteredTables = Array.isArray(savedTables)
    ? savedTables.filter((table) =>
      table?.tableData?.[0]?.["Program Name"]?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  // Function to truncate table name to 3 words
  const truncateTableName = (name) => {
    const words = name.split(' ');
    return words.length > 3 ? `${words.slice(0, 3).join(' ')}...` : name;
  };

  return (
    <div className="text-white" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
      <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E] bg-[#1E1E1E]">
        <div className="flex justify-between w-full items-center">
          {isMobile ? (
            // On mobile, show search icon and hamburger menu
            <>
              <h2 className="text-xl font-normal text-center flex-grow">Saved Sheets</h2>
              <FontAwesomeIcon
                icon={faSearch}
                className="text-white text-xl"
                onClick={() => setIsSearchActive(!isSearchActive)}  // Toggle search active state
              />
            </>
          ) : (
            <>
              <h2 className="text-xl font-normal text-center flex-grow ml-40">Saved Sheets</h2>
              <input
                type="text"
                placeholder="Search sheets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ml-2 p-0.5 rounded-md bg-gray-800 text-white border border-gray-600 text-sm"
              />
            </>
          )}
        </div>
      </div>

      {/* Show search input only on mobile when active */}
      {isSearchActive && isMobile && (
        <div className="p-4">
          <input
            ref={searchInputRef} // Attach the ref to the search input
            type="text"
            placeholder="Search sheets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ml-2 p-0.5 rounded-md bg-gray-800 text-white border border-gray-600 text-sm w-full"
          />
        </div>
      )}

      <div className="p-4">
        {loading ? (
          // Render loading placeholders
          Array.from({ length: 16 }).map((_, index) => (
            <div
              key={index}
              className="mb-1.5 flex justify-between animate-pulse -mt-2 p-0.5 "
            >
              <div className="flex items-center space-x-1 w-1/4">
                <LoadingPlaceholder width={20} height={22} />
                <LoadingPlaceholder width={200} height={22} />
              </div>
              {/* Placeholder for date */}
              <div className="text-gray-400 flex justify-end mt-1 -mr-20">
                <LoadingPlaceholder width={150} height={22} />
              </div>
              {/* Placeholder for buttons */}
              <div className="w-1/3 flex justify-end -mr-4">
                <LoadingPlaceholder width={40} height={22} />
                <LoadingPlaceholder width={60} height={30} />
              </div>
            </div>

          ))
        ) : filteredTables.length > 0 ? (
          // Render actual data
          filteredTables.map((table, index) => (
            <div key={index} className="mb-2 flex justify-between items-center text-sm">
              {/* Index and file name */}
              <div className="flex items-center space-x-2 w-1/3">
                <span>{index + 1}</span>
                <h3
                  className="font-normal break-words"
                  title={table.tableData[0]?.["Program Name"] || "N/A"}
                  style={{
                    maxWidth: "200px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {truncateTableName(table.tableData[0]?.["Program Name"] || "N/A")}
                </h3>
              </div>
              {/* Saved date */}
              <div className="w-1/3 text-gray-400 text-center">
                {new Date(table.savedAt).toLocaleString()}
              </div>
              {/* Action buttons */}
              <div className="w-1/3 flex justify-end space-x-2">
                {!isMobile && (
                  <button
                    onClick={() => handleViewTable(table.tableData)}
                    className="text-blue-500 hover:underline"
                  >
                    View
                  </button>
                )}
                <CSVLink
                  data={table.tableData}
                  filename={`${table.tableData[0]["Program Name"] || "unknown"
                    }_cue-sheet.csv`}
                >
                  <button className="bg-[#152e1e] hover:bg-[#1d402a] text-white py-1 px-4 rounded-md text-sm font-normal flex items-center">
                    <img src={eLogo} alt="Download Icon" className="h-4 w-4" />
                  </button>
                </CSVLink>
              </div>
            </div>
          ))
        ) : (
          // Render message if no data
          <div className="flex items-center justify-center min-h-screen -mt-10">
            <p className="text-gray-400">No sheets saved yet.</p>
          </div>
        )}
      </div>



      {viewedTableData && (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          className="bg-gray-800 p-5 rounded-md max-w-3xl sm:max-w-2xl lg:max-w-4xl mx-auto"
          overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-40"
        >
          <h2 className="text-xl font-semibold mb-4 text-white font-normal">Table Data</h2>
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
            onClick={closeModal}
            className="mt-4 bg-red-500 hover:bg-red-400 text-white py-1 px-4 rounded-md text-sm"
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  );
};

export default MySheets;
