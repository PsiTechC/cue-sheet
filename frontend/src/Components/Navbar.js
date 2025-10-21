import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import icon from '../Assets/cue-icon.png';
import loginBg from '../Assets/login-bg.webp';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);  
  const [error, setError] = useState(null);  

 
  const isAuthenticated = !!localStorage.getItem('token');  
  const token = localStorage.getItem('token');  

  const handleGetStartedClick = () => {
    if (!isAuthenticated) {
      navigate('/signup');  
    }
  };

  useEffect(() => {
    const preloadImage = new Image();
    preloadImage.src = loginBg; 
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');  
    localStorage.removeItem('email'); 
    navigate('/');  
  };

  const handleDashboardClick = () => {
    setDropdownVisible(false);
    navigate('/dashboard');  
  };

  return (
    <nav className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800 py-2 px-6 flex justify-between items-center sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center space-x-1">
      <img src={icon} alt="icon" className="h-10" />
        <span className="text-gray-900 dark:text-white text-lg font-semibold" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
          MEDai
        </span>
      </div>
      <div className="flex items-center space-x-4 relative">
        {!isAuthenticated ? (
          <button
            onClick={handleGetStartedClick}
            className="bg-primary-500 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-primary-600 transition-colors"
          >
            Get Started
          </button>
        ) : (
          <>
            <ThemeToggle />
            <button
              onClick={() => setDropdownVisible(!dropdownVisible)}
              className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white py-2 px-3 rounded-full focus:outline-none hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <FontAwesomeIcon icon={faUser} />
            </button>


            {dropdownVisible && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-2xl z-50 border border-gray-200 dark:border-gray-700">
                <div
                  className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition-colors"
                  onClick={handleDashboardClick}
                >
                  Dashboard
                </div>
                <div
                  className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition-colors"
                  onClick={handleLogout}
                >
                  Log Out
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
