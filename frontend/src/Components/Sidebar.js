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
        className={`h-screen bg-white text-gray-800 w-64 flex flex-col fixed top-0 left-0 z-40 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 md:relative md:translate-x-0 shadow-lg`}
        style={{ borderRight: '1px solid #e5e7eb', fontFamily: 'Helvetica Neue, Arial, sans-serif' }}
      >
        <div className="p-[22px] flex justify-between items-center border-b border-gray-200 bg-gradient-to-r from-[#f0f4f8] to-[#e8f0f7]">
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          <button onClick={toggleSidebar} className="md:hidden text-gray-600 hover:text-gray-800 transition-colors">
            <FontAwesomeIcon icon={faXmark} size="1x" />
          </button>
        </div>

        <nav className="px-4 mt-2 flex-grow font-normal">
          <ul className="space-y-2 text-sm">
            <li>
              <NavLink
                to="/dashboard/project"
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `p-3 rounded-xl flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#10B981]'
                  }`
                }
              >
                <FontAwesomeIcon icon={faFolder} className="mr-3" />
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/mysheet"
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `p-3 rounded-xl flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#10B981]'
                  }`
                }
              >
                <FontAwesomeIcon icon={faSheetPlastic} className="mr-3" />
                Saved Sheets
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/CueSheetGenerator"
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `p-3 rounded-xl flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#10B981]'
                  }`
                }
              >
                <FontAwesomeIcon icon={faTable} className="mr-3" />
                Create Cue-Sheet
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/metadatacreation"
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `p-3 rounded-xl flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#10B981]'
                  }`
                }
              >
                <FontAwesomeIcon icon={faObjectUngroup} className="mr-3" />
                Metadata Creation
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/autosubtitling"
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `p-3 rounded-xl flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#10B981]'
                  }`
                }
              >
                <FontAwesomeIcon icon={faClosedCaptioning} className="mr-3" />
                Auto Subtitling
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/aivoiceover"
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `p-3 rounded-xl flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#10B981]'
                  }`
                }
              >
                <FontAwesomeIcon icon={faFileAudio} className="mr-3" />
                AI Voiceover
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/metamorphosis"
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `p-3 rounded-xl flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#10B981]'
                  }`
                }
              >
                <FontAwesomeIcon icon={faFolderTree} className="mr-3" />
                Metamorphosis
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/genreidentification"
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `p-3 rounded-xl flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#10B981]'
                  }`
                }
              >
                <FontAwesomeIcon icon={faIcons} className="mr-3" />
                Genre Identification
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/autodubbing"
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `p-3 rounded-xl flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#10B981]'
                  }`
                }
              >
                <FontAwesomeIcon icon={faBlog} className="mr-3" />
                Auto Dubbing
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard/account"
                onClick={handleMenuClick}
                className={({ isActive }) =>
                  `p-3 rounded-xl flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white font-semibold shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#10B981]'
                  }`
                }
              >
                <FontAwesomeIcon icon={faUserTie} className="mr-3" />
                Account
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="p-5 border-t border-gray-200 bg-gradient-to-r from-[#f0f4f8] to-[#e8f0f7]">
          <ul>
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center w-full p-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
              >
                <FontAwesomeIcon icon={faArrowRightFromBracket} className="mr-3" />
                Log Out
              </button>
            </li>
          </ul>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
