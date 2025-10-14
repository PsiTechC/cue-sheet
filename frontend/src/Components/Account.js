import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Alert from './Alert'; 
import LoadingPlaceholder from './LoadingPlaceholder'
import RateCard from './RateCard'

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
<div className='text-white'>
  <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E] bg-[#1E1E1E]">
    <h2 className="text-xl font-normal text-center flex-grow ml-30">Account</h2>
  </div>
  {!isRateCardVisible ? (
    <div className='font-thin pt-4 pl-5'>
      <h2 className='text-xl font-normal mb-1'>Hi there, </h2>
      <p>
        {error
          ? error
          : email
            ? email
            : <LoadingPlaceholder width={300} height={23} />}
      </p>
      <br />
      <h3 className='font-normal'>
        Your Current Balance is {userMinutes < 1 ? userMinutes * 60 : userMinutes} {userMinutes < 1 ? 'seconds' : 'minutes'}
      </h3>

      <div className="flex justify-start mt-4 space-x-2">
      <button
          onClick={() => {
            handleForgotPassword();
            setIsModalOpen(true);
          }} 
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Change Password
        </button>

        <button
          onClick={toggleRateCard}  
          className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
        >
          Top Up
        </button>
      </div>
    </div>
  ) : (
    <div className='p-4'>
      <RateCard />
      <button
        onClick={toggleRateCard}
        className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
      >
        Close
      </button>
    </div>
  )}

  {isModalOpen && (
    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
<div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
  <div className="bg-white p-6 rounded-lg max-w-md w-full relative">
    {/* Close Button */}
    <button
      onClick={() => setIsModalOpen(false)}
      className="absolute top-2 right-4 text-black hover:text-red-600 text-2xl"
    >
      &times;
    </button>

    <h2 className='text-xl font-normal mb-4 text-black'>Reset Your Password</h2>
    
    <form>
      <div>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition mb-4"
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Enter New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition mb-4"
          required
        />
      </div>
      <button
        onClick={handleResetPassword}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700"
      >
        Reset Password
      </button>
      {resetError && <p className="text-red-500 mt-4">{resetError}</p>}
    </form>
  </div>
</div>

    </div>
  )}
  <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
</div>
  );
};

export default Account;

