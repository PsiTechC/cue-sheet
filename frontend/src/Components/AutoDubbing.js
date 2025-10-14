import React from 'react';
import PageHeader from './PageHeader';

const AutoDubbing = () => {
  return (
    <div className="text-gray-800 min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e8f0f7] to-[#dce8f5]" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
      <PageHeader title="Auto Dubbing" />

      <div className="p-4">
        <p className="text-center text-gray-400 text-lg mt-20">Access Restricted by Admin</p>
      </div>
    </div>
  );
};

export default AutoDubbing;
