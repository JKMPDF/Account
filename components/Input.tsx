import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
  const baseClasses = "block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-900 dark:text-slate-100";

  const inputEl = (
    <input
      id={id}
      className={`${baseClasses} ${className || ''}`}
      {...props}
    />
  );

  if (!label) {
    return inputEl;
  }
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">
        {label}
      </label>
      {inputEl}
    </div>
  );
};

export default Input;