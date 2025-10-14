import React from 'react';
import PageHeader from './PageHeader';

const Metamorphosis = () => {
  return (
    <div className="text-gray-800 min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
      <PageHeader title="Metamorphosis" />

      <div className="p-4">
        <p className="text-center text-gray-400 text-lg mt-20">Access Restricted by Admin</p>
      </div>
    </div>
  );
};

export default Metamorphosis;
