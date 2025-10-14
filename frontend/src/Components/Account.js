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
<div className='text-gray-800 min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]'>
  <PageHeader title="Account" />
  {!isRateCardVisible ? (
    <div className='p-8 m-6 bg-white/50 backdrop-blur-sm rounded-2xl'>
      <div className='bg-white p-8 rounded-2xl shadow-md border border-gray-100'>
        <h2 className='text-2xl font-bold mb-2 text-gray-800'>Hi there, </h2>
        <p className='text-lg text-gray-600 mb-6'>
          {error
            ? error
            : email
              ? email
              : <LoadingPlaceholder width={300} height={23} />}
        </p>

        <div className='bg-gradient-to-r from-[#f0f4f8] to-[#e8f0f7] p-6 rounded-xl mb-6'>
          <h3 className='text-lg font-semibold text-gray-800'>
            Your Current Balance:
            <span className='text-[#4CAF50] text-2xl font-bold ml-2'>
              {userMinutes < 1 ? userMinutes * 60 : userMinutes} {userMinutes < 1 ? 'seconds' : 'minutes'}
            </span>
          </h3>
        </div>

        <div className="flex justify-start space-x-4">
          <button
            onClick={() => {
              handleForgotPassword();
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Change Password
          </button>

          <button
            onClick={toggleRateCard}
            className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Top Up
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className='p-8 m-6 bg-white/50 backdrop-blur-sm rounded-2xl'>
      <RateCard />
      <button
        onClick={toggleRateCard}
        className="mt-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
      >
        Close
      </button>
    </div>
  )}

  {isModalOpen && (
    <div className='fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50'>
      <div className="bg-white p-8 rounded-3xl max-w-md w-full relative border border-gray-200 shadow-2xl">
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 text-gray-600 hover:text-red-600 text-3xl font-light transition-colors"
        >
          &times;
        </button>

        <div className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] -m-8 mb-6 p-6 rounded-t-3xl">
          <h2 className='text-2xl font-bold text-white'>Reset Your Password</h2>
        </div>

        <form>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">OTP Code</label>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 border text-gray-800 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition shadow-sm"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              placeholder="Enter New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border text-gray-800 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition shadow-sm"
              required
            />
          </div>
          <button
            onClick={handleResetPassword}
            className="w-full bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Reset Password
          </button>
          {resetError && <p className="text-red-600 mt-4 text-sm font-medium">{resetError}</p>}
        </form>
      </div>
    </div>
  )}
  <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
</div>
  );
};

export default Account;

