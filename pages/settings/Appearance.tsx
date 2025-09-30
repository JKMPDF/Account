
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon } from '../../components/Icon';

const Appearance: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Appearance</h2>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-400">Theme</label>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Choose how the application looks. Your preference is saved automatically.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-lg border-2 text-center transition-colors ${
              theme === 'light'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                : 'border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-500'
            }`}
          >
            <SunIcon className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-400" />
            <span className="mt-2 block font-semibold text-slate-700 dark:text-slate-300">Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-lg border-2 text-center transition-colors ${
              theme === 'dark'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                : 'border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-500'
            }`}
          >
            <MoonIcon className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-400" />
            <span className="mt-2 block font-semibold text-slate-700 dark:text-slate-300">Dark</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Appearance;
