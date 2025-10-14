import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import eLogo from '../Assets/e-logo.svg';
import LoadingPlaceholder from './LoadingPlaceholder';
import PageHeader from './PageHeader';

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
      // Check if the click is outside both the search input and the search icon
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target) &&
        !event.target.closest('.search-icon')
      ) {
        setIsSearchActive(false);  // Close search input when clicking outside
      }
    };

    if (isSearchActive) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchActive]);

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
    <div className="text-gray-800 min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
      <PageHeader
        title="Saved Sheets"
        rightContent={
          !isMobile && (
            <input
              type="text"
              placeholder="Search sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2.5 w-64 rounded-xl bg-white text-gray-800 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent shadow-sm"
            />
          )
        }
      >
        {isMobile && (
          <FontAwesomeIcon
            icon={faSearch}
            className="search-icon text-gray-600 hover:text-[#4CAF50] text-xl cursor-pointer transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsSearchActive(!isSearchActive);
            }}
          />
        )}
      </PageHeader>

      {isSearchActive && isMobile && (
        <div className="p-4 bg-white/50 backdrop-blur-sm">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search sheets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2.5 rounded-xl bg-white text-gray-800 border border-gray-200 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent shadow-sm"
          />
        </div>
      )}

      <div className="p-4 md:p-6 bg-white/50 backdrop-blur-sm mx-4 md:mx-6 rounded-2xl mt-4 md:mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 16 }).map((_, index) => (
              <div
                key={index}
                className="p-3 md:p-4 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <LoadingPlaceholder width={32} height={32} />
                    <LoadingPlaceholder width="100%" height={22} />
                  </div>
                  <div className="flex justify-end">
                    <LoadingPlaceholder width={120} height={38} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTables.length > 0 ? (
          <div className="space-y-3">
            {filteredTables.map((table, index) => (
              <div key={index} className="p-3 md:p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#4CAF50] transition-all">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  {/* Left section - Number and Title */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="w-8 h-8 bg-gradient-to-br from-[#4CAF50] to-[#66BB6A] rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-semibold text-gray-800 text-sm md:text-base truncate"
                        title={table.tableData[0]?.["Program Name"] || "N/A"}
                      >
                        {table.tableData[0]?.["Program Name"] || "N/A"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(table.savedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Right section - Buttons */}
                  <div className="flex space-x-2 md:space-x-3 flex-shrink-0 self-end md:self-center">
                    {!isMobile && (
                      <button
                        onClick={() => handleViewTable(table.tableData)}
                        className="text-blue-500 hover:text-blue-700 font-medium transition-colors text-sm whitespace-nowrap"
                      >
                        View
                      </button>
                    )}
                    <CSVLink
                      data={table.tableData}
                      filename={`${table.tableData[0]["Program Name"] || "unknown"}_cue-sheet.csv`}
                    >
                      <button className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white py-2 px-3 md:px-4 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2 whitespace-nowrap">
                        <img src={eLogo} alt="Download Icon" className="h-3 w-3 md:h-4 md:w-4" />
                        <span>Download</span>
                      </button>
                    </CSVLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 text-base md:text-lg">No sheets saved yet.</p>
          </div>
        )}
      </div>



      {viewedTableData && (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          className="bg-white p-6 rounded-3xl max-w-6xl mx-auto border border-gray-200 shadow-2xl"
          overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Table Data</h2>
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

          <button
            onClick={closeModal}
            className="mt-6 px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all"
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  );
};

export default MySheets;
