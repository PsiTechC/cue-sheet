import React from 'react';

const PageHeader = ({ title, children, rightContent }) => {
  return (
    <div className="pl-16 pr-[22px] py-[22px] md:px-[22px] flex justify-between items-center border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm" style={{ height: '73px' }}>
      <h2 className="text-xl font-semibold text-gray-800 truncate">{title}</h2>
      {(children || rightContent) && <div className="flex items-center gap-3 flex-shrink-0">{children || rightContent}</div>}
    </div>
  );
};

export default PageHeader;
