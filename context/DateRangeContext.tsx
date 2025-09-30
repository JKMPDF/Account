import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CompanyDataContext } from './CompanyDataContext';

interface DateRangeContextType {
  startDate: string;
  endDate: string;
  selectedFY: string;
  setSelectedFY: (fy: string) => void;
  availableFYs: { value: string; label: string }[];
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

const parseFYstring = (fy: string): { start: string, end: string } => {
  if (!fy || typeof fy !== 'string' || !fy.includes('-')) {
    // Default fallback
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    return {
      start: `${startYear}-04-01`,
      end: `${startYear + 1}-03-31`,
    };
  }

  const parts = fy.split('-');
  const startYear = parts[0];
  const endYear = `${startYear.slice(0, 2)}${parts[1]}`;
  return {
    start: `${startYear}-04-01`,
    end: `${endYear}-03-31`,
  };
};

export const DateRangeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const context = useContext(CompanyDataContext);
  const { companyData, loading } = context || { companyData: null, loading: true };

  const [selectedFY, setSelectedFY] = useState('');
  const [availableFYs, setAvailableFYs] = useState<{ value: string; label: string }[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!loading && companyData?.details?.financialYear) {
      const firstFY = companyData.details.financialYear;
      const firstYear = parseInt(firstFY.split('-')[0], 10);

      const today = new Date();
      const currentMonth = today.getMonth(); // 0 = Jan, 3 = Apr
      const currentFullYear = today.getFullYear();
      const lastYear = currentMonth >= 3 ? currentFullYear : currentFullYear - 1;

      const years: { value: string, label: string }[] = [];
      if (!isNaN(firstYear)) {
          for (let y = firstYear; y <= lastYear; y++) {
              const fyString = `${y}-${(y + 1).toString().slice(2)}`;
              years.push({ value: fyString, label: `F.Y. ${fyString}` });
          }
      }
      
      const reversedYears = years.reverse();
      setAvailableFYs(reversedYears);

      if (reversedYears.length > 0 && (!selectedFY || !years.some(y => y.value === selectedFY))) {
        setSelectedFY(reversedYears[0].value);
      }
    }
  }, [companyData, loading]);

  useEffect(() => {
    if (selectedFY) {
      const { start, end } = parseFYstring(selectedFY);
      setStartDate(start);
      setEndDate(end);
    }
  }, [selectedFY]);

  const value = { startDate, endDate, selectedFY, setSelectedFY, availableFYs };

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRange = (): DateRangeContextType => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};
