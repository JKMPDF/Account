
import React from 'react';

interface KpiCardProps {
  title: string;
  value: number;
  currency: string;
  period: string;
  color: 'green' | 'orange' | 'sky' | 'blue' | 'red';
  isBalance?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, currency, period, color, isBalance = false }) => {
    const colorClasses = {
        green: 'border-green-500/50 text-green-700 dark:text-green-300',
        orange: 'border-orange-500/50 text-orange-700 dark:text-orange-300',
        sky: 'border-sky-500/50 text-sky-700 dark:text-sky-300',
        blue: 'border-blue-500/50 text-blue-700 dark:text-blue-300',
        red: 'border-red-500/50 text-red-700 dark:text-red-300',
    };
    
    const balanceText = isBalance && value < 0 ? 'Cr' : isBalance ? 'Dr' : '';

    return (
        <div className={`bg-white dark:bg-slate-800/70 p-5 rounded-lg border-l-4 shadow-lg ${colorClasses[color]}`}>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold mt-2">
                {currency} {Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {isBalance && <span className="text-lg ml-2 font-medium text-slate-400 dark:text-slate-500">{balanceText}</span>}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{period}</p>
        </div>
    );
};

export default KpiCard;