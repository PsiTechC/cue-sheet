import React from 'react';
import ContentLoader from 'react-content-loader';

const LoadingPlaceholder = ({ width = 500, height = 100 }) => {
  return (
    <ContentLoader
      speed={1}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      backgroundColor="#363636"
      foregroundColor="#c7c5c5"
    >
      <rect x="0" y="10" rx="5" ry="5" width="70%" height="12" /> 
      <rect x="0" y="35" rx="5" ry="5" width="90%" height="12" /> 
      <rect x="0" y="60" rx="5" ry="5" width="60%" height="12" /> 
    </ContentLoader>
  );
};

export default LoadingPlaceholder;
