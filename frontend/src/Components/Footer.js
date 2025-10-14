import React from 'react';
import logo from '../Assets/logo.png';  

const Footer = () => {
  return (
    <footer className="bg-[#121212] py-0.5">
       
      <div className="mx-8 border-t border-gray-600 mt-2"></div>

      <div className="container mx-auto text-center mb-5 mt-5">
        <div className="flex items-center justify-center space-x-2">
         
          <p
            className="text-white font-light"
            style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}
          >
            A product by
          </p>

         
          <p
            className="text-white font-extrabold flex items-center"
            style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}
          >
            <img src={logo} alt="Logo" className="h-7" />
            <strong>PsiTech Consultancy</strong> 
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
