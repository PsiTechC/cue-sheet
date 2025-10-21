import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import signupBg from '../Assets/login-bg.webp';
import Alert from './Alert';
import { Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [isOtpScreen, setIsOtpScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (password !== confirmPassword) {
      setAlertMessage('Passwords do not match');
      setAlertType('warning');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, { email, password });

      if (response.data.success) {
        setAlertMessage('Signup successful. OTP sent to your email.');
        setLoading(false);
        setAlertType('success');
        setAlertVisible(true);
        setIsOtpScreen(true);
      } else {
        setAlertMessage('Signup failed');
        setLoading(false);
        setAlertType('error');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);
      }
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.message === 'User already exists') {
        setAlertMessage('User already has an account. Redirecting to login...');
        setAlertType('error');
        setAlertVisible(true);
        setTimeout(() => {
          setAlertVisible(false);
          navigate('/login');
        }, 4000);
      } else {
        setAlertMessage('Signup failed. Please try again later.');
        setAlertType('error');
        setLoading(false);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);
      }
    }
  };


  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, { email, otp });

      if (response.data.success) {
        setAlertMessage('OTP verified successfully, Please login');
        setLoading(true);
        setAlertType('success');
        setAlertVisible(true);


        setTimeout(() => {
          setAlertVisible(false);
          navigate('/dashboard');
        }, 4000);
      } else {
        setAlertMessage('Invalid OTP. Please try again.');
        setLoading(false);
        setAlertType('error');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);
      }
    } catch (error) {
      setAlertMessage('OTP verification failed. Please try again.');
      setLoading(false);
      setAlertType('error');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };


  return (
    <div
      className="min-h-screen flex flex-col md:flex-row items-center justify-between"
      style={{
        backgroundImage: `url(${signupBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-gray-900/60  to-black/70 z-0"></div>


      <div className="flex flex-col justify-center items-center w-full md:w-1/2 text-white p-6 md:pl-20 pb-10 z-10 text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Join Our Platform</h1>
        <p className="text-lg md:text-xl font-light text-center">Enjoy a seamless experience as you sign up and take advantage of our features to boost your productivity.</p>
      </div>

      <div className="flex w-full md:w-1/2 h-full justify-center items-center p-6 z-10">
        <div
          className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full"
          style={{ height: 'auto', fontFamily: 'Helvetica Neue, Arial, sans-serif' }}
        >
          {isOtpScreen ? (
            <>
              <h1 className="text-4xl font-light mb-4 text-left">Verify OTP</h1>
              <h2 className="text-2xl font-normal mb-4 text-left tracking-wide pb-6">Enter the OTP sent to your email</h2>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-400 transition"
                >
                  {loading ? <span className="loginloader"></span> : 'Verify OTP'}

                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-light mb-4 text-left">Welcome</h1>
              <h2 className="text-5xl font-normal mb-4 text-left tracking-wide pb-10">Get started with your email</h2>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Choose a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-400 transition"
                >
                  {loading ? <span className="loginloader"></span> : 'Sign Up'}
                </button>
                <p className="text-center mb-6 text-lg">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 hover:underline">
                    Log In
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
      <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
    </div>
  );
};

export default Signup;
