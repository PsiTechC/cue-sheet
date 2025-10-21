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
    <div className="text-gray-800 dark:text-gray-200 min-h-screen bg-gray-50 dark:bg-[#1e1e1e] transition-colors duration-300" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
      <PageHeader
        title="Saved Sheets"
        rightContent={
          !isMobile && (
            <input
              type="text"
              placeholder="Search sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2.5 w-64 rounded-xl bg-white dark:bg-[#2d2d30] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            />
          )
        }
      >
        {isMobile && (
          <FontAwesomeIcon
            icon={faSearch}
            className="search-icon text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 text-xl cursor-pointer transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsSearchActive(!isSearchActive);
            }}
          />
        )}
      </PageHeader>

      {isSearchActive && isMobile && (
        <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-colors duration-300">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search sheets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2.5 rounded-xl bg-white dark:bg-[#2d2d30] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
          />
        </div>
      )}

      <div className="p-3 sm:p-4 md:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mx-3 sm:mx-4 md:mx-6 rounded-xl sm:rounded-2xl mt-3 sm:mt-4 md:mt-6 transition-colors duration-300">
        {loading ? (
          <div className="space-y-2 sm:space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="p-3 sm:p-3 md:p-4 bg-white dark:bg-gray-700 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 animate-pulse"
              >
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <LoadingPlaceholder width={28} height={28} />
                    <div className="flex-1 min-w-0">
                      <LoadingPlaceholder width="80%" height={18} />
                      <div className="mt-1">
                        <LoadingPlaceholder width="50%" height={14} />
                      </div>
                    </div>
                  </div>
                  <LoadingPlaceholder width={90} height={36} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTables.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {filteredTables.map((table, index) => (
              <div key={index} className="p-3 sm:p-3 md:p-4 bg-white dark:bg-gray-700 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 transition-all">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {/* Left section - Number and Title */}
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-semibold text-gray-800 dark:text-gray-100 text-xs sm:text-sm md:text-base truncate"
                        title={table.tableData[0]?.["Program Name"] || "N/A"}
                      >
                        {table.tableData[0]?.["Program Name"] || "N/A"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
                        {new Date(table.savedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Right section - Action Buttons */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {/* View Button - Icon only on mobile, full button on larger screens */}
                    <button
                      onClick={() => handleViewTable(table.tableData)}
                      className="bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white py-2 px-3 sm:px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-0 sm:space-x-2 whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="hidden sm:inline">View</span>
                    </button>

                    {/* Download Button */}
                    <CSVLink
                      data={table.tableData}
                      filename={`${table.tableData[0]["Program Name"] || "unknown"}_cue-sheet.csv`}
                    >
                      <button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap">
                        <img src={eLogo} alt="Download Icon" className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline sm:inline">Download</span>
                        <span className="inline xs:hidden sm:hidden">DL</span>
                      </button>
                    </CSVLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 sm:py-16 md:py-20">
            <div className="text-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base md:text-lg">No sheets saved yet.</p>
            </div>
          </div>
        )}
      </div>



      {viewedTableData && (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full mx-4 border border-gray-200 dark:border-gray-700 shadow-xl transition-colors duration-300"
          overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-t-lg flex items-center justify-between transition-colors duration-300">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cue Sheet Data</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View saved sheet details</p>
            </div>
            <button
              onClick={closeModal}
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
              onClick={closeModal}
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

export default MySheets;
