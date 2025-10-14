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
    <div
      style={{
        backgroundColor: "#1E1E1E",
        minHeight: "40vh",
        color: "white",
        padding: "2rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: "800px",
          backgroundColor: "#2A2A2A",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h1 className="text-3xl font-bold text-center mb-6">Payment Details</h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ flex: "1 1 45%" }}>
            <label>Full Name:</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "5px",
                border: "1px solid gray",
                backgroundColor: "#1E1E1E",
                color: "white",
              }}
            />
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <label>Email Address:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "5px",
                border: "1px solid gray",
                backgroundColor: "#1E1E1E",
                color: "white",
              }}
            />
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <label>Contact Number:</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "5px",
                border: "1px solid gray",
                backgroundColor: "#1E1E1E",
                color: "white",
              }}
            />
          </div>
          <div style={{ flex: "1 1 45%" }} className="mt-8">
            <label>Amount (INR):</label>
            <span className="w-1/3 px-4 py-2 text-white">
              ₹{totalAmt}
            </span>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <label>GST Number (Optional):</label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "5px",
                border: "1px solid gray",
                backgroundColor: "#1E1E1E",
                color: "white",
              }}
            />
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <label>Billing Address (Optional):</label>
            <input
              type="text"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "5px",
                border: "1px solid gray",
                backgroundColor: "#1E1E1E",
                color: "white",
              }}
            />
          </div>
          <div style={{ flex: "1 1 100%" }}>
            <label>Payment Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "5px",
                border: "1px solid gray",
                backgroundColor: "#1E1E1E",
                color: "white",
              }}
            ></textarea>
          </div>
        </div>
        <button
          onClick={handlePayment}
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem",
            width: "100%",
            borderRadius: "5px",
            backgroundColor: "#3399cc",
            color: "white",
            fontSize: "1rem",
            fontWeight: "bold",
            border: "none",
          }}
        >
          Proceed to Pay
        </button>
      </div>
      <Alert message={alertMessage} type={alertType} visible={alertVisible} setVisible={setAlertVisible} />
    </div>
  );
};

export default PaymentPage;