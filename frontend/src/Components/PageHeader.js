import ThemeToggle from './ThemeToggle';

const PageHeader = ({ title, subtitle, children, rightContent }) => {
  return (
    <div className="sticky top-0 z-30 pl-16 pr-[22px] py-5 md:px-[22px] flex justify-between items-center border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-[#1e1e1e] dark:to-[#252526] shadow-md transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-[#10B981] to-[#14B8A6] rounded-full"></div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {children || rightContent}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default PageHeader;
