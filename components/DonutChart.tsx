

import React, { useState } from 'react';

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  currency: string;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, currency }) => {
  const [tooltip, setTooltip] = useState<{ visible: boolean; content: string; x: number; y: number }>({ visible: false, content: '', x: 0, y: 0 });

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col min-h-[350px]">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Income vs Expense</h3>
           <div className="flex-grow flex items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400">No data for this period.</p>
        </div>
        </div>
    );
  }

  const size = 180;
  const strokeWidth = 25;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  const handleMouseOver = (e: React.MouseEvent, item: { label: string; value: number }) => {
    const rect = (e.currentTarget as SVGCircleElement).getBoundingClientRect();
    const percentage = ((item.value / total) * 100).toFixed(1);
    setTooltip({
      visible: true,
      content: `${item.label}: ${percentage}% (${currency} ${item.value.toLocaleString('en-IN')})`,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseOut = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col min-h-[350px]">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Income vs Expense</h3>
      <div className="flex-grow flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="relative" onMouseOut={handleMouseOut}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              className="stroke-slate-200 dark:stroke-slate-700"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {data.map((item, index) => {
              const dashoffset = circumference - (accumulatedAngle / 360) * circumference;
              const angle = (item.value / total) * 360;
              const dasharray = `${(angle / 360) * circumference} ${circumference}`;
              accumulatedAngle += angle;

              return (
                <circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  stroke={item.color}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2}) rotate(${accumulatedAngle - angle} ${size / 2} ${size / 2})`}
                  className="transition-all duration-300"
                   onMouseOver={e => handleMouseOver(e, item)}
                />
              );
            })}
             <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 text-lg font-bold">
                {((data.find(d => d.label === 'Income')?.value || 0) / total * 100).toFixed(0)}%
            </text>
            <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-xs">
                Income
            </text>
          </svg>
        </div>
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {currency} {item.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
       {tooltip.visible && (
        <div
            className="fixed z-10 p-2 text-xs font-semibold text-white bg-slate-900/80 border border-slate-600 rounded-md shadow-lg pointer-events-none"
            style={{ transform: `translate(-50%, -100%)`, left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
