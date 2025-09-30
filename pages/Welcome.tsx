
import React, { useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { UploadIcon, CreateIcon } from '../components/Icon';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const context = useContext(CompanyDataContext);

  if (!context) return null;

  const { loadDataFromFile } = context;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadDataFromFile(file);
    }
  };

  const handleCreateClick = () => {
    navigate('/create-company');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="text-center p-8 max-w-lg w-full">
        <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-5xl md:text-6xl">
                JKM <span className="text-sky-500 dark:text-sky-400">Edit</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Your Modern Accounting Solution on the Web</p>
        </div>
        
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Get Started</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={handleUploadClick}
                    className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300"
                >
                    <UploadIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors" />
                    <span className="mt-4 font-semibold text-lg text-slate-800 dark:text-slate-200">Upload Backup</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Restore from a .json file</p>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json,application/json"
                />

                <button
                    onClick={handleCreateClick}
                    className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300"
                >
                    <CreateIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors" />
                    <span className="mt-4 font-semibold text-lg text-slate-800 dark:text-slate-200">Create Company</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start fresh with a new entity</p>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;