import React from 'react';

const PageHeader = ({ title, children, rightContent }) => {
  return (
    <div className="sticky top-0 z-30 pl-16 pr-[22px] py-[22px] md:px-[22px] flex justify-between items-center border-b border-gray-200 bg-white shadow-sm" style={{ height: '73px' }}>
      <h2 className="text-xl font-semibold text-gray-800 truncate">{title}</h2>
      {(children || rightContent) && <div className="flex items-center gap-3 flex-shrink-0">{children || rightContent}</div>}
    </div>
  );
};

export default PageHeader;
