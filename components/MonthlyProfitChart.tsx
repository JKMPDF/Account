import React, { useState } from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface MonthlyProfitChartProps {
  data: ChartData[];
  currency: string;
}

const MonthlyProfitChart: React.FC<MonthlyProfitChartProps> = ({ data, currency }) => {
  const [tooltip, setTooltip] = useState<{ visible: boolean; content: string; x: number; y: number }>({ visible: false, content: '', x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex items-center justify-center text-slate-500">No profit data for this period.</div>;
  }
  
  const width = 500;
  const height = 200;
  const padding = 20;

  const minValue = Math.min(...data.map(d => d.value), 0);
  const maxValue = Math.max(...data.map(d => d.value), 0);
  const range = (maxValue - minValue) === 0 ? 1 : maxValue - minValue;
  
  const getX = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);
  const getY = (value: number) => height - padding - ((value - minValue) / range) * (height - 2 * padding);
  
  const linePath = data.map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(point.value)}`).join(' ');
  const zeroLineY = getY(0);

  const handleMouseOver = (e: React.MouseEvent, item: ChartData) => {
    const circle = e.currentTarget as SVGCircleElement;
    const rect = circle.getBoundingClientRect();
    setTooltip({
      visible: true,
      content: `${item.label}: ${currency} ${item.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseOut = () => {
    setTooltip({ ...tooltip, visible: false });
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col min-h-[350px]">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Monthly Profit / Loss</h3>
      <div className="flex-grow flex flex-col">
        <div className="relative flex-grow">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" onMouseOut={handleMouseOut}>
            <line x1={padding} y1={zeroLineY} x2={width - padding} y2={zeroLineY} strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="1"/>
            <path d={linePath} fill="none" className="stroke-sky-500 dark:stroke-sky-400" strokeWidth="2" />
            {data.map((point, i) => (
              <circle
                key={i}
                cx={getX(i)}
                cy={getY(point.value)}
                r="4"
                className={`${point.value >= 0 ? 'fill-sky-500 dark:fill-sky-400' : 'fill-red-500 dark:fill-red-500'} stroke-white dark:stroke-slate-800`}
                strokeWidth="2"
                onMouseOver={e => handleMouseOver(e, point)}
                aria-label={`Profit for ${point.label}: ${point.value}`}
                role="figure"
              />
            ))}
          </svg>
        </div>
        <div className="flex justify-around text-xs text-slate-500 dark:text-slate-400 mt-2">
          {data.map(item => <span key={item.label} className="flex-1 text-center">{item.label}</span>)}
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

export default MonthlyProfitChart;