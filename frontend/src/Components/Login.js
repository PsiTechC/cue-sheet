import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import loginBg from '../Assets/login-bg.webp';
import Alert from './Alert';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [loading, setLoading] = useState(false);


  const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password }, { withCredentials: true });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('isAdmin', JSON.stringify(response.data.isAdmin));
        setAlertMessage('Login successful!');
        setAlertType('success');
        setAlertVisible(true);

        setTimeout(() => {
          setAlertVisible(false);
          setLoading(false);
          navigate(response.data.isAdmin ? '/admin' : '/dashboard');
        }, 4000);
      } else {
        setAlertMessage('Login failed');
        setAlertType('error');
        setAlertVisible(true);
        setLoading(false);
        setTimeout(() => setAlertVisible(false), 5000);
      }
    }catch (error) {
      const status = error.response ? error.response.status : 0;
      if (status === 403) {
        setAlertMessage('Access denied. You do not have permission to access the application.');
        setAlertType('error');
      } else {
        setAlertMessage('Error logging in. Please try again.');
        setAlertType('warning');
      }
      setAlertVisible(true);
      setLoading(false);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setIsForgotPassword(true);
      setAlertMessage('OTP sent to your email.');
      setAlertType('success');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    } catch (error) {
      setAlertMessage('Error sending OTP. Please enter correct email and try again.');
      setAlertType('warning');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };


  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { email, otp, newPassword });

      if (response.data.success) {
        setAlertMessage('Password reset successfully!');
        setAlertType('success');
        setAlertVisible(true);

        setTimeout(() => {
          setAlertVisible(false);
          setIsForgotPassword(false);
          navigate('/login');
        }, 5000);
      } else {
        setAlertMessage('Failed to reset password. Please try again.');
        setAlertType('error');
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 5000);
      }
    } catch (error) {
      setAlertMessage('Error resetting password. Please enter correct email and try again.');
      setAlertType('warning');
      setAlertVisible(true);
      setTimeout(() => setAlertVisible(false), 5000);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row items-center justify-between"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-gray-900/60 to-black/70 z-0"></div>

      <div className="flex flex-col justify-center items-center w-full md:w-1/2 text-white p-6 md:pl-20 pb-10 z-10 text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Empower Your Journey</h1>
        <p className="text-lg md:text-xl font-light text-center">
          Enter your credentials to access your projects, tasks, and all the tools you need to succeed. Let’s get back to work and keep your projects running smoothly!
        </p>
      </div>

      <div className="flex w-full md:w-1/2 h-full justify-center items-center p-6 z-10">
        <div className="bg-white shadow-material-3 rounded-2xl p-8 max-w-md w-full" style={{ height: 'auto' }}>
          {!isForgotPassword ? (
            <>
              <h1 className="text-3xl md:text-4xl font-light mb-4 text-center md:text-left text-surface-900">Welcome back</h1>
              <h1 className="text-3xl md:text-4xl font-normal mb-12 text-center md:text-left text-surface-800">Log In to your account</h1>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-surface-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition bg-surface-50 text-surface-900"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-surface-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition bg-surface-50 text-surface-900"
                    required
                  />
                </div>
                <p className="text-right text-sm">
                  <Link
                    to="#"
                    className="text-secondary-600 hover:text-secondary-700 hover:underline font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      handleForgotPassword();
                    }}
                  >
                    Forgot Password?
                  </Link>
                </p>
                <button
                  type="submit"
                  className="w-full py-3 bg-secondary-600 text-white text-lg font-semibold rounded-lg hover:bg-secondary-700 focus:outline-none focus:ring-4 focus:ring-secondary-300 shadow-material-2 hover:shadow-material-3 transition-all flex justify-center items-center"
                >
                  {loading ? <span className="loginloader"></span> : 'Log In'}
                </button>

                <p className="text-center mb-6 text-lg text-surface-700">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-secondary-600 hover:text-secondary-700 hover:underline font-medium">
                    Sign Up
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-normal mb-12 text-center md:text-left text-surface-900">Reset your password</h1>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-surface-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition bg-surface-50 text-surface-900"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Enter the OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 border border-surface-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition bg-surface-50 text-surface-900"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-surface-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition bg-surface-50 text-surface-900"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-secondary-600 text-white text-lg font-semibold rounded-lg hover:bg-secondary-700 focus:outline-none focus:ring-4 focus:ring-secondary-300 shadow-material-2 hover:shadow-material-3 transition-all"
                >
                  Reset Password
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
    </div>
  );
};

export default Login;


