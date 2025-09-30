import React from 'react';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  id: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onChange, id }) => {
  return (
    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 p-3 rounded-md">
      <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-300">
        {label}
      </label>
      <button
        type="button"
        id={id}
        onClick={() => onChange(!enabled)}
        className={`${
          enabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
        } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-sky-500`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;