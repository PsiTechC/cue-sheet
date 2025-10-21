import React from 'react';
import ThemeToggle from './ThemeToggle';

const PageHeader = ({ title, children, rightContent }) => {
  return (
    <div className="sticky top-0 z-30 pl-16 pr-[22px] py-[22px] md:px-[22px] flex justify-between items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252526] shadow-sm transition-colors duration-300" style={{ height: '73px' }}>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 truncate">{title}</h2>
      <div className="flex items-center gap-3 flex-shrink-0">
        {children || rightContent}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default PageHeader;
