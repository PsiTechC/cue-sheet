import React from 'react';
import PageHeader from './PageHeader';

const GenreIdentification = () => {
  return (
    <div className="text-gray-800 dark:text-gray-200 min-h-screen bg-gray-50 dark:bg-[#1e1e1e] transition-colors duration-300" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
      <PageHeader title="Genre Identification" />

      <div className="p-4">
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg mt-20">Access Restricted by Admin</p>
      </div>
    </div>
  );
};

export default GenreIdentification;
