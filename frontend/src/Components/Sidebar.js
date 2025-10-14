import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightFromBracket,
  faXmark,
  faFolder,
  faSheetPlastic,
  faTable,
  faUserTie,
  faClosedCaptioning,
  faFileAudio,
  faFolderTree,
  faIcons,
  faBlog,
  faObjectUngroup
} from '@fortawesome/free-solid-svg-icons';  


const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');  
    navigate('/');  
  };

  // Close sidebar after menu item click (except logout)
  const handleMenuClick = () => {
    if (window.innerWidth <= 768) {  // Only close on mobile
      toggleSidebar();  // Close the sidebar
    }
  };

  return (
    <>
      <div
        className={`h-screen bg-[#1E1E1E] text-white w-64 flex flex-col fixed top-0 left-0 z-40 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 md:relative md:translate-x-0`}
        style={{ borderRight: '0.01px solid grey', fontFamily: 'Helvetica Neue, Arial, sans-serif' }}  
      >
        <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E]">
          <h1 className="text-xl font-normal ">Dashboard</h1>
          <button onClick={toggleSidebar} className="md:hidden">
            <FontAwesomeIcon icon={faXmark} size="1x" />
          </button>
        </div>

        <nav className="px-4 mt-2 flex-grow font-normal">
          <ul className="space-y-4 text-sm">
            <li>
              <NavLink
                to="/dashboard/project"
                onClick={handleMenuClick}  // Close sidebar on click
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center transition-colors duration-200 ${
                    isActive ? 'text-white text-base' : 'text-[#B4B4B4] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={faFolder} className="mr-2" />  
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/mysheet"
                onClick={handleMenuClick}  // Close sidebar on click
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center transition-colors duration-200 ${
                    isActive ? 'text-white text-base' : 'text-[#B4B4B4] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={faSheetPlastic} className="mr-2" />  
                Saved Sheets
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/CueSheetGenerator"
                onClick={handleMenuClick}  // Close sidebar on click
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center transition-colors duration-200 ${
                    isActive ? 'text-white text-base' : 'text-[#B4B4B4] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={faTable} className="mr-2" />  
                Create Cue-Sheet
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/metadatacreation"
                onClick={handleMenuClick}  // Close sidebar on click
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center transition-colors duration-200 ${
                    isActive ? 'text-white text-base' : 'text-[#B4B4B4] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={faObjectUngroup} className="mr-2" />  
                Metadata Creation
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/autosubtitling"
                onClick={handleMenuClick}  // Close sidebar on click
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center transition-colors duration-200 ${
                    isActive ? 'text-white text-base' : 'text-[#B4B4B4] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={faClosedCaptioning} className="mr-2" />  
                Auto Subtitling
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/aivoiceover"
                onClick={handleMenuClick}  // Close sidebar on click
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center transition-colors duration-200 ${
                    isActive ? 'text-white text-base' : 'text-[#B4B4B4] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={faFileAudio} className="mr-2" />  
                AI Voiceover
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/metamorphosis"
                onClick={handleMenuClick}  // Close sidebar on click
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center transition-colors duration-200 ${
                    isActive ? 'text-white text-base' : 'text-[#B4B4B4] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={faFolderTree} className="mr-2" />  
                Metamorphosis
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/genreidentification"
                onClick={handleMenuClick}  // Close sidebar on click
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center transition-colors duration-200 ${
                    isActive ? 'text-white text-base' : 'text-[#B4B4B4] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={faIcons} className="mr-2" />  
                Genre Identification
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/autodubbing"
                onClick={handleMenuClick}  // Close sidebar on click
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center transition-colors duration-200 ${
                    isActive ? 'text-white text-base' : 'text-[#B4B4B4] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={faBlog} className="mr-2" />  
                Auto Dubbing
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/account"
                onClick={handleMenuClick}  // Close sidebar on click
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center transition-colors duration-200 ${
                    isActive ? 'text-white text-base' : 'text-[#B4B4B4] hover:text-white'
                  }`
                }
              >
                <FontAwesomeIcon icon={faUserTie} className="mr-2" />  
                Account
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="p-5 border-t border-[#2E2E2E]">
          <ul className="space-y-4">
            <li className="transition-all duration-300 hover:text-base">
              <button
                onClick={handleLogout}
                className="flex items-center text-[#B4B4B4] hover:text-white transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faArrowRightFromBracket} className="mr-2" />
                Log Out
              </button>
            </li>
          </ul>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
