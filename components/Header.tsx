import React, { useContext } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { ExportIcon, LogoutIcon, MoonIcon, SunIcon } from './Icon';
import { useModal } from '../context/ModalContext';
import ConfirmationDialog from './ConfirmationDialog';
import { useDateRange } from '../context/DateRangeContext';
import Select from './Select';
import { useTheme } from '../context/ThemeContext';

const Header: React.FC = () => {
  const companyContext = useContext(CompanyDataContext);
  const { showModal, hideModal } = useModal();
  const { selectedFY, setSelectedFY, availableFYs } = useDateRange();
  const { theme, setTheme } = useTheme();

  if (!companyContext) return null;

  const { companyData, exportDataAsJson, logout } = companyContext;

  const handleLogout = () => {
    showModal(
      <ConfirmationDialog
        title="Close Company"
        message="Are you sure you want to close this company? This will return you to the welcome screen."
        onConfirm={() => {
          logout();
          hideModal();
        }}
        onCancel={hideModal}
        confirmText="Close Company"
        confirmVariant="danger"
      />
    );
  };
  
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md p-3 flex justify-between items-center sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-4">
        <div className="text-lg font-bold text-sky-500 dark:text-sky-400 hidden lg:block">
          {companyData?.details.name || 'JKM Edit'}
        </div>
        <div className="flex items-center gap-2">
           {availableFYs.length > 0 && (
             <Select
                label=""
                id="fy-selector"
                value={selectedFY}
                onChange={setSelectedFY}
                options={availableFYs}
                className="w-36"
             />
           )}
        </div>
      </div>
      <div className="flex items-center space-x-1 md:space-x-2">
        <button onClick={exportDataAsJson} title="Export Company Data" className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <ExportIcon className="w-5 h-5" />
        </button>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme" className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
        <button onClick={handleLogout} title="Close Company" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300">
           <LogoutIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;