import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon, SearchIcon } from './Icon';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  id: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

const Select: React.FC<SelectProps> = ({ label, id, options, value, onChange, className, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(() => options.find(opt => opt.value === value), [options, value]);

  const filteredOptions = useMemo(() =>
    options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    ), [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (isOpen) {
        setSearchTerm(''); // Reset search on open
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {label && 
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      }
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-sky-500 sm:text-sm text-left flex justify-between items-center"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-400'}>
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm text-slate-800 dark:text-slate-200"
                    autoFocus
                />
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <ul
            ref={optionsRef}
            className="overflow-y-auto flex-1"
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`px-4 py-2 text-sm cursor-pointer ${value === option.value ? 'bg-sky-600 text-white' : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  role="option"
                  aria-selected={value === option.value}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-slate-500">No options found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select;