import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import LoadingPlaceholder from './LoadingPlaceholder'
import Alert from './Alert';

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
          headers: {
            Authorization: localStorage.getItem('token'),
          },
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
          headers: {
            Authorization: localStorage.getItem('token'),
          },
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
        headers: {
          Authorization: localStorage.getItem('token'),
        },
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
    <div className='text-white ' style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>

      <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E] bg-[#1E1E1E]">
        <h2 className="text-xl font-normal text-center flex-grow ml-30">Projects</h2>
      </div>

      <div className="p-5 flex justify-between items-center">
        <button
          className="bg-[#28603D] hover:bg-[#417155] text-white py-2 px-4 rounded-md text-sm"
          onClick={openModal}
        >
          Create Project
        </button>
        <input
          type="text"
          placeholder=" Search project..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-2 p-0.5 w-[7rem] rounded-md bg-gray-800 text-white border border-gray-600 text-sm"
        />
      </div>


      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          // Show loading placeholders
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-[#474747] text-black p-2 rounded-md flex justify-between items-center shadow-md border-none relative"
            >
              <LoadingPlaceholder width="90px" height="40px" />
            </div>


          ))
        ) : filteredWorkspaces.length > 0 ? (
          // Show actual data once loaded
          filteredWorkspaces.map((workspace, index) => (
            <div
              key={index}
              className="bg-gray-200 text-black p-4 rounded-md flex justify-between items-center shadow-md border relative cursor-pointer"
              onClick={() => isMobile && handleWorkspaceOpen(workspace.workspaceName)} // For mobile, open on single click
              onDoubleClick={() => !isMobile && handleWorkspaceOpen(workspace.workspaceName)} // For desktop, open on double click
            >
              <div className="flex items-center">
                <div className="bg-gray-500 text-white p-2 rounded-full mr-4"></div>
                <div className="font-normal">{workspace.workspaceName}</div>
              </div>
              <div onClick={() => toggleDropdown(index)}>
                <FontAwesomeIcon icon={faEllipsisV} className="cursor-pointer" />
              </div>
              {showDropdown === index && (
                <div className="absolute right-0 top-10 bg-white shadow-lg rounded-md z-10">
                  <button
                    className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                    onClick={() => {
                      setSelectedWorkspaceId(workspace._id);
                      setNewWorkspaceName(workspace.workspaceName);
                      setRenameModalOpen(true);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                    onClick={() => handleDelete(workspace._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          // No data message
          <p className="text-gray-400">No Project found.</p>
        )}
      </div>



      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="bg-gray-800 p-6 rounded-md max-w-lg mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Create Project</h2>
        <form onSubmit={handleSubmit}>

          <label className="text-white block mb-2">Project Name:</label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full p-2 mb-4 rounded-md"
            required
          />


          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#28603D] hover:bg-[#417155] text-white py-2 px-4 rounded-md text-sm"
            >
              Save Project
            </button>
            <button
              type="button"
              className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-md ml-2 text-sm"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>


      <Modal
        isOpen={renameModalOpen}
        onRequestClose={() => setRenameModalOpen(false)}
        className="bg-gray-800 p-6 rounded-md max-w-lg mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Rename Project</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleRename(); }}>

          <label className="text-white block mb-2">New Project Name:</label>
          <input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            className="w-full p-2 mb-4 rounded-md"
            required
          />


          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-md"
            >
              Rename
            </button>
            <button
              type="button"
              className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-md ml-2"
              onClick={() => setRenameModalOpen(false)}
            >
              Cancel
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





