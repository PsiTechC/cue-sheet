import React from 'react';

const Loader = ({ loadingText, progress, allLinksShortened }) => {
  return (
    <div id="loadingContainer" className={`loading-container mt-5 ${progress > 0 && !allLinksShortened ? 'opacity-100' : 'opacity-0'}`}>
      <div className="loading-text text-lg text-center mb-2">{loadingText}</div>
      <div className="progress-bar bg-gray-700 rounded-lg w-full">
        <div className="progress-bar-fill bg-[#417155] h-6 rounded-lg" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default Loader;
