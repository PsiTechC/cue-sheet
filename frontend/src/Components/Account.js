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
<div className='min-h-screen bg-surface-50'>
  <PageHeader title="Account" />
  {!isRateCardVisible ? (
    <div className='max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8'>
      {/* Account Info Card */}
      <div className='bg-white border border-surface-200 rounded-lg shadow-sm mb-4 sm:mb-6'>
        <div className='border-b border-surface-200 px-4 sm:px-6 py-3 sm:py-4 bg-surface-50'>
          <h2 className='text-base sm:text-lg font-semibold text-surface-900'>Account Information</h2>
        </div>
        <div className='p-4 sm:p-6'>
          <div className='grid gap-4 sm:gap-6 md:grid-cols-2'>
            <div>
              <label className='text-xs font-medium text-surface-500 uppercase tracking-wide mb-2 block'>Email Address</label>
              <p className='text-sm sm:text-base text-surface-900 font-medium break-all'>
                {error
                  ? error
                  : email
                    ? email
                    : <LoadingPlaceholder width={250} height={20} />}
              </p>
            </div>
            <div>
              <label className='text-xs font-medium text-surface-500 uppercase tracking-wide mb-2 block'>Account Status</label>
              <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700 border border-success-200'>
                <span className='w-1.5 h-1.5 bg-success-500 rounded-full mr-2'></span>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className='bg-white border border-surface-200 rounded-lg shadow-sm mb-4 sm:mb-6'>
        <div className='border-b border-surface-200 px-4 sm:px-6 py-3 sm:py-4 bg-surface-50'>
          <h2 className='text-base sm:text-lg font-semibold text-surface-900'>Usage Balance</h2>
        </div>
        <div className='p-4 sm:p-6'>
          <div className='flex flex-col gap-4'>
            <div>
              <p className='text-xs sm:text-sm text-surface-500 mb-2'>Available Minutes</p>
              <div className='flex items-baseline flex-wrap gap-2'>
                <p className='text-2xl sm:text-3xl md:text-4xl font-bold text-surface-900 break-all'>
                  {userMinutes < 1
                    ? (userMinutes * 60).toFixed(2)
                    : Number(userMinutes).toFixed(2)}
                </p>
                <span className='text-base sm:text-lg md:text-xl font-normal text-surface-500'>
                  {userMinutes < 1 ? 'sec' : 'min'}
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={toggleRateCard}
                className="w-full bg-secondary-600 hover:bg-secondary-700 text-white py-2.5 px-5 rounded font-medium text-sm transition-colors uppercase tracking-wide"
              >
                Add Balance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className='bg-white border border-surface-200 rounded-lg shadow-sm'>
        <div className='border-b border-surface-200 px-4 sm:px-6 py-3 sm:py-4 bg-surface-50'>
          <h2 className='text-base sm:text-lg font-semibold text-surface-900'>Security Settings</h2>
        </div>
        <div className='p-4 sm:p-6'>
          <div className='flex flex-col gap-4'>
            <div>
              <p className='font-medium text-surface-900 mb-1 text-sm sm:text-base'>Password</p>
              <p className='text-xs sm:text-sm text-surface-500'>Manage your account password</p>
            </div>
            <button
              onClick={() => {
                handleForgotPassword();
                setIsModalOpen(true);
              }}
              className="w-full border border-surface-300 hover:border-surface-400 hover:bg-surface-50 text-surface-700 py-2.5 px-4 rounded font-medium text-sm transition-colors"
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
          className="inline-flex items-center text-sm text-surface-600 hover:text-surface-900 font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Account
        </button>
      </div>
      <div className='bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden'>
        <RateCard />
      </div>
    </div>
  )}

  {isModalOpen && (
    <div className='fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4'>
      <div className="bg-white rounded-lg max-w-md w-full border border-surface-200 shadow-xl">
        <div className="border-b border-surface-200 px-6 py-4 flex items-center justify-between bg-surface-50">
          <h2 className='text-lg font-semibold text-surface-900'>Reset Password</h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-surface-400 hover:text-surface-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="p-6">
          <div className="mb-5">
            <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">OTP Code</label>
            <input
              type="text"
              placeholder="Enter OTP sent to your email"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2.5 border text-surface-900 border-surface-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition bg-white"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-surface-700 mb-2 uppercase tracking-wide">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border text-surface-900 border-surface-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition bg-white"
              required
            />
          </div>

          {resetError && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded text-sm text-error-700">
              {resetError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 border border-surface-300 hover:bg-surface-50 text-surface-700 py-2.5 px-4 rounded font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResetPassword}
              className="flex-1 bg-secondary-600 hover:bg-secondary-700 text-white py-2.5 px-4 rounded font-medium text-sm transition-colors uppercase tracking-wide"
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

