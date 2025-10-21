import React, { useState } from "react";
import axios from "axios";
import Alert from './Alert';

const PaymentPage = ({ plan, totalAmt, totalMinutes }) => {
  const [fullName, setFullName] = useState(""); 
  const [email, setEmail] = useState(""); 
  const [contact, setContact] = useState(""); 
  const [amount, setAmount] = useState(""); 
  const [description, setDescription] = useState(""); 
  const [gstNumber, setGstNumber] = useState(""); 
  const [billingAddress, setBillingAddress] = useState(""); 
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);


  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


  const handlePayment = async () => {
    // Validate input fields
    if (!fullName) {
      setAlertMessage('Please enter your full name.');
      setAlertType('warning');
      setAlertVisible(true);
      return;
    }
    if (!email || !email.includes("@")) {
      setAlertMessage('Please enter a valid email address.');
      setAlertType('warning');
      setAlertVisible(true);
      return;
    }
    if (!contact || contact.length !== 10 || isNaN(contact)) {
      setAlertMessage('Please enter a valid 10-digit contact number.');
      setAlertType('warning');
      setAlertVisible(true);
      
      return;
    }
    if (!totalAmt || isNaN(totalAmt) || totalAmt <= 0) {
      alert("Invalid amount. Please contact support.");
      return;
    }
  
    // Retrieve token from localStorage
    const token = localStorage.getItem("token");
  
    if (!token) {
      setAlertMessage('Please log in to make a payment.');
      setAlertType('warning');
      setAlertVisible(true);
      
      return;
    }
  
    try {
      // Send a POST request to create the Razorpay order
      const { data } = await axios.post(
        `${API_BASE_URL}/api/payment/createOrder`,
        {
          amount: parseInt(totalAmt), 
          customer_email: email,
          customer_contact: contact,
          fullName,
          description,
          gstNumber,
          billingAddress,
          plan,
          totalMinutes
        },
        {
          withCredentials: true, 
        }
      );
  
      // Check if the order creation was successful
      if (data.success) {
        const options = {
          key: process.env.PUBLIC_RAZORPAY_KEY_ID, // Public Razorpay Key
          amount: data.order.amount, // Amount in paise
          currency: data.order.currency,
          name: "Psi Tech",
          description: "CueSheet ",
          order_id: data.order.id, // Razorpay Order ID from backend
          handler: async function (response) {
            try {
              // Call /updatePayment on successful payment
              const updateResponse = await axios.put(
                `${API_BASE_URL}/api/payment/updatePayment`,
                {
                  orderId: data.order.id,
                  paymentId: response.razorpay_payment_id,
                  paymentMethod: "Razorpay",
                  status: "successful",
                },
                {
                  withCredentials: true, 
                }
              );
  
              if (updateResponse.data.success) {
                setAlertMessage('Payment successful! Minutes have been added to your account.');
                setAlertType('success');
                setAlertVisible(true);
                setTimeout(() => {
                  window.location.reload(); 
                }, 2000);
              } else {
                setAlertMessage('Payment successful, but there was an issue updating your minutes.');
                setAlertType('warning');
                setAlertVisible(true);
              }
            } catch (error) {
              console.error("Error updating payment status:", error);
              setAlertMessage('Payment successful, but we encountered an error while updating the status.');
              setAlertType('error');
              setAlertVisible(true);
            }
          },
          prefill: {
            name: fullName,
            email: email,
            contact: contact,
          },
          theme: {
            color: "#3399cc",
          },
        };
  
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        setAlertMessage('Failed to create order. Please try again..');
        setAlertType('error');
        setAlertVisible(true);
        
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      setAlertMessage('Something went wrong. Please try again.');
      setAlertType('error');
      setAlertVisible(true);
    }
  };
  
  


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] py-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6">
        {/* Order Summary Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-6 transition-colors duration-300">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Order Summary</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Selected Plan</label>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{plan}</p>
              </div>
              {totalMinutes && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Minutes</label>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{totalMinutes} min</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Total Amount</label>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">₹{totalAmt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details Form */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors duration-300">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Details</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Please provide your information to proceed with payment</p>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition bg-white dark:bg-[#2d2d30]"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition bg-white dark:bg-[#2d2d30]"
                  required
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="10-digit mobile number"
                  maxLength="10"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition bg-white dark:bg-[#2d2d30]"
                  required
                />
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  GST Number <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="Enter GST number if applicable"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition bg-white dark:bg-[#2d2d30]"
                />
              </div>

              {/* Billing Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Billing Address <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Enter billing address"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition bg-white dark:bg-[#2d2d30]"
                />
              </div>

              {/* Payment Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Notes <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any additional notes"
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition bg-white dark:bg-[#2d2d30] resize-none"
                ></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex-1 md:flex-none border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 px-6 rounded font-medium text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-8 rounded font-medium text-sm transition-colors uppercase tracking-wide"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">Secure Payment</p>
            <p className="text-xs mt-1">Your payment information is encrypted and secure. We use Razorpay for secure payment processing.</p>
          </div>
        </div>
      </div>
      <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
    </div>
  );
};

export default PaymentPage;