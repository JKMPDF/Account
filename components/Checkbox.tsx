import React from 'react';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ id, label, checked, onChange, className }) => {
  return (
    <label htmlFor={id} className={`flex items-center space-x-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-700 text-sky-600 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-sky-500"
      />
      <span>{label}</span>
    </label>
  );
};

export default Checkbox;