import React, { useEffect } from 'react';
import '../Alert.css'; 

const Alert = ({ message, type, visible, setVisible }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false); 
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [visible, setVisible]);

  return (
    <div className={`alert ${type} ${visible ? 'show' : 'hide'}`}>
      {message}
    </div>
  );
};

export default Alert;
