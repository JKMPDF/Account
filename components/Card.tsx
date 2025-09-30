
import React, { ReactNode } from 'react';

interface CardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}

const Card: React.FC<CardProps> = ({ title, description, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-lg p-6 text-left hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-400/10 dark:shadow-slate-900/50"
    >
      <div className="flex items-center space-x-4">
        <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full text-sky-500 dark:text-sky-400">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default Card;