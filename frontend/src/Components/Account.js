import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Alert from './Alert';
import LoadingPlaceholder from './LoadingPlaceholder';
import RateCard from './RateCard';
import PageHeader from './PageHeader';

const Account = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [userMinutes, setUserMinutes] = useState(null);
  const [isRateCardVisible, setIsRateCardVisible] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/user-email`, {
          withCredentials: true
        });
        setEmail(response.data.email); 
      } catch (err) {
        console.error('Error fetching email:', err);
        setError('Failed to fetch email.');
      }
    };

    fetchEmail();
  }, []);

  const handleForgotPassword = async () => {
    setIsForgotPassword(true); 
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setAlertMessage('OTP sent to your email.');
      setAlertType('success');
      setAlertVisible(true);
    } catch (error) {
      setAlertMessage('Error sending OTP. Please try again.');
      setAlertType('error');
      setAlertVisible(true);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { email, otp, newPassword });
      if (response.data.success) {
        setAlertMessage('Password changed successfully! You can now log in with your new password.');
        setAlertType('success');
        setAlertVisible(true);
        setIsForgotPassword(false); 
      } else {
        setResetError('Failed to reset password. Try again.');
      }
    } catch (error) {
      setResetError('Error resetting password. Please try again.');
    }
  };

  const getUserMinutes = async () => {

    try {
      const response = await axios.get(`${API_BASE_URL}/api/c/userMinutes`, {
        withCredentials: true
      });

      const { minutesUsed } = response.data;

      setUserMinutes(minutesUsed);
    } catch (error) {
      console.error('Error fetching user minutes:', error);
      setAlertMessage('Error fetching user minutes');
      setAlertType('success');
      setAlertVisible(true);

    }
  };

  useEffect(() => {
    getUserMinutes();
  }, []);


  const toggleRateCard = () => {
    setIsRateCardVisible(!isRateCardVisible); 
  };

  return (
<div className='min-h-screen bg-gray-50 dark:bg-[#1e1e1e] transition-colors duration-300'>
  <PageHeader title="Account" />
  {!isRateCardVisible ? (
    <div className='max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8'>
      {/* Account Info Card */}
      <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-4 sm:mb-6'>
        <div className='border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900'>
          <h2 className='text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100'>Account Information</h2>
        </div>
        <div className='p-4 sm:p-6'>
          <div className='grid gap-4 sm:gap-6 md:grid-cols-2'>
            <div>
              <label className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block'>Email Address</label>
              <p className='text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium break-all'>
                {error
                  ? error
                  : email
                    ? email
                    : <LoadingPlaceholder width={250} height={20} />}
              </p>
            </div>
            <div>
              <label className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block'>Account Status</label>
              <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700 border border-success-200'>
                <span className='w-1.5 h-1.5 bg-success-500 rounded-full mr-2'></span>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-4 sm:mb-6'>
        <div className='border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900'>
          <h2 className='text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100'>Usage Balance</h2>
        </div>
        <div className='p-4 sm:p-6'>
          <div className='flex flex-col gap-4'>
            <div>
              <p className='text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2'>Available Minutes</p>
              <div className='flex items-baseline flex-wrap gap-2'>
                <p className='text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 break-all'>
                  {userMinutes < 1
                    ? (userMinutes * 60).toFixed(2)
                    : Number(userMinutes).toFixed(2)}
                </p>
                <span className='text-base sm:text-lg md:text-xl font-normal text-gray-500 dark:text-gray-400'>
                  {userMinutes < 1 ? 'sec' : 'min'}
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={toggleRateCard}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded font-medium text-sm transition-colors uppercase tracking-wide"
              >
                Add Balance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors duration-300'>
        <div className='border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300'>
          <h2 className='text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100'>Security Settings</h2>
        </div>
        <div className='p-4 sm:p-6'>
          <div className='flex flex-col gap-4'>
            <div>
              <p className='font-medium text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base'>Password</p>
              <p className='text-xs sm:text-sm text-gray-500 dark:text-gray-400'>Manage your account password</p>
            </div>
            <button
              onClick={() => {
                handleForgotPassword();
                setIsModalOpen(true);
              }}
              className="w-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded font-medium text-sm transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className='max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8'>
      <div className='mb-4'>
        <button
          onClick={toggleRateCard}
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Account
        </button>
      </div>
      <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden transition-colors duration-300'>
        <RateCard />
      </div>
    </div>
  )}

  {isModalOpen && (
    <div className='fixed inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 z-50 p-4'>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-xl transition-colors duration-300">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>Reset Password</h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="p-6">
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">OTP Code</label>
            <input
              type="text"
              placeholder="Enter OTP sent to your email"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2.5 border text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition bg-white dark:bg-[#2d2d30]"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition bg-white dark:bg-[#2d2d30]"
              required
            />
          </div>

          {resetError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded text-sm text-red-700 dark:text-red-400">
              {resetError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResetPassword}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded font-medium text-sm transition-colors uppercase tracking-wide"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
  <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
</div>
  );
};

export default Account;

