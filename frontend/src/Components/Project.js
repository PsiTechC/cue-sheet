import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faFolder, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import LoadingPlaceholder from './LoadingPlaceholder'
import Alert from './Alert';
import PageHeader from './PageHeader';

Modal.setAppElement('#root');
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Project = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false); // For detecting mobile devices
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    // Detect if the user is on a mobile device
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Check if screen width is less than or equal to 768px
    };

    // Call the check function initially and add event listener for resize
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    // Fetch workspaces
    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/project/get-workspaces`, {
          withCredentials: true,
        });
        if (Array.isArray(response.data)) {
          setWorkspaces(response.data);
        } else {
          setWorkspaces([]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setAlertMessage('Failed to fetch projects.');
        setAlertType('error');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();

    // Cleanup the event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown !== null) {
        // Check if click is outside dropdown
        const dropdowns = document.querySelectorAll('.dropdown-menu');
        let clickedInside = false;

        dropdowns.forEach((dropdown) => {
          if (dropdown.contains(event.target)) {
            clickedInside = true;
          }
        });

        // Also check if clicked on the three-dot button
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

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/project/add-workspace`,
        { workspaceName },
        {
          withCredentials: true,
        }
      );

      setWorkspaces((prevWorkspaces) => [...prevWorkspaces, response.data]);
      setAlertMessage('Project saved successfully!');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      closeModal();
    } catch (error) {
      console.error('Error saving project:', error);
      setAlertMessage('Failed to save project.');
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };

  const handleRename = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/project/rename-workspace/${selectedWorkspaceId}`,
        { newName: newWorkspaceName },
        {
          withCredentials: true,
        }
      );

      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) =>
          ws._id === selectedWorkspaceId ? { ...ws, workspaceName: newWorkspaceName } : ws
        )
      );
      setAlertMessage('Project renamed successfully!');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      setRenameModalOpen(false);
      setShowDropdown(null);
    } catch (error) {
      console.error('Error renaming project:', error);
      setAlertMessage('Failed to rename project.');
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };

  const handleDelete = async (workspaceId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/project/delete-workspace/${workspaceId}`, {
        withCredentials: true,
      });
      setWorkspaces((prevWorkspaces) => prevWorkspaces.filter((ws) => ws._id !== workspaceId));
      setAlertMessage('Project deleted successfully!');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      setShowDropdown(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      setAlertMessage('Failed to delete project.');
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };

  const handleWorkspaceOpen = (workspaceName) => {
    navigate(`/dashboard/project/${workspaceName}`);
  };

  const toggleDropdown = (index) => {
    setShowDropdown(showDropdown === index ? null : index);
  };

  // Filter workspaces based on search query
  const filteredWorkspaces = Array.isArray(workspaces)
    ? workspaces.filter((workspace) =>
      workspace.workspaceName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  return (
    <div className='text-gray-800 min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]' style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>

      <PageHeader title="Projects">
        <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 md:px-3 py-1 md:py-1.5 rounded-full whitespace-nowrap">
          {workspaces.length} {workspaces.length === 1 ? 'Project' : 'Projects'}
        </div>
      </PageHeader>

      {/* Action Bar */}
      <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white/50 backdrop-blur-sm">
        <button
          className="bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:from-[#059669] hover:to-[#0d9488] text-white py-3 md:py-2.5 px-6 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 w-full sm:w-auto"
          onClick={openModal}
        >
          <FontAwesomeIcon icon={faPlus} className="text-sm" />
          Create Project
        </button>

        <div className="relative w-full sm:w-auto">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 md:py-2 w-full sm:w-64 rounded-xl bg-white text-gray-800 border border-gray-200 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          // Show loading placeholders
          Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 animate-pulse"
            >
              <LoadingPlaceholder width="100%" height="60px" />
            </div>
          ))
        ) : filteredWorkspaces.length > 0 ? (
          // Show actual data once loaded
          filteredWorkspaces.map((workspace, index) => (
            <div
              key={index}
              className="group bg-white p-4 md:p-6 rounded-2xl shadow-md border border-gray-100 hover:border-[#10B981] transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl relative overflow-hidden min-h-[140px] md:min-h-[160px]"
              onClick={() => handleWorkspaceOpen(workspace.workspaceName)}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/0 to-[#14B8A6]/0 group-hover:from-[#10B981]/5 group-hover:to-[#14B8A6]/5 transition-all duration-300 rounded-2xl"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#10B981] to-[#14B8A6] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                      <FontAwesomeIcon icon={faFolder} className="text-white text-xl md:text-2xl" />
                    </div>
                  </div>
                  <div
                    className="dropdown-button p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown(index);
                    }}
                  >
                    <FontAwesomeIcon icon={faEllipsisV} className="text-gray-400 hover:text-gray-700 cursor-pointer text-base md:text-lg" />
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2 truncate group-hover:text-[#10B981] transition-colors">
                    {workspace.workspaceName}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 font-medium">
                    Click to open
                  </p>
                </div>

                {/* Bottom accent line */}
                <div className="mt-3 md:mt-4 h-1 md:h-1.5 w-0 bg-gradient-to-r from-[#10B981] to-[#14B8A6] group-hover:w-full transition-all duration-500 rounded-full"></div>
              </div>

              {showDropdown === index && (
                <div className="dropdown-menu absolute right-2 top-16 bg-white border border-gray-200 shadow-xl rounded-xl z-20 overflow-hidden min-w-[160px]">
                  <button
                    className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left flex items-center gap-2 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWorkspaceId(workspace._id);
                      setNewWorkspaceName(workspace.workspaceName);
                      setRenameModalOpen(true);
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
                      handleDelete(workspace._id);
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
          // No data message - centered and styled
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <FontAwesomeIcon icon={faFolder} className="text-5xl text-gray-400" />
            </div>
            <p className="text-gray-700 text-xl font-semibold">No projects found</p>
            <p className="text-gray-500 text-sm mt-2">Create your first project to get started</p>
          </div>
        )}
      </div>



      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="bg-white p-6 md:p-8 rounded-3xl max-w-md mx-4 md:mx-auto border border-gray-200 shadow-2xl"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50 px-4"
      >
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#10B981] to-[#14B8A6] rounded-2xl flex items-center justify-center shadow-lg">
            <FontAwesomeIcon icon={faPlus} className="text-white text-base md:text-lg" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Create New Project</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="text-gray-700 block mb-2 text-sm font-semibold">Project Name</label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full p-3 mb-4 md:mb-6 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-all text-base"
            placeholder="Enter project name..."
            required
          />

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all order-2 sm:order-1"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:from-[#059669] hover:to-[#0d9488] text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg order-1 sm:order-2"
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>


      {/* Rename Project Modal */}
      <Modal
        isOpen={renameModalOpen}
        onRequestClose={() => setRenameModalOpen(false)}
        className="bg-white p-6 md:p-8 rounded-3xl max-w-md mx-4 md:mx-auto border border-gray-200 shadow-2xl"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50 px-4"
      >
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Rename Project</h2>

        <form onSubmit={(e) => { e.preventDefault(); handleRename(); }}>
          <label className="text-gray-700 block mb-2 text-sm font-semibold">New Project Name</label>
          <input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            className="w-full p-3 mb-4 md:mb-6 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-all text-base"
            placeholder="Enter new project name..."
            required
          />

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all order-2 sm:order-1"
              onClick={() => setRenameModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:from-[#059669] hover:to-[#0d9488] text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg order-1 sm:order-2"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>


      {alertVisible && (
        <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
      )}
    </div>
  );
};

export default Project;





