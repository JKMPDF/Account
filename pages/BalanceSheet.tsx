import React, { useContext, useMemo, useState, useEffect } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useDateRange } from '../context/DateRangeContext';
import { calculateLedgerBalancesForPeriod, calculateProfitAndLoss, generateSchedule3BalanceSheetData, ReportRowData } from '../utils/accounting';
import Button from '../components/Button';
import { PdfIcon, ChevronRightIcon } from '../components/Icon';
import { generateBalanceSheetPDF } from '../utils/pdfGenerator';
import { formatDate } from '../utils/exportUtils';

interface ReportRowProps {
  item: ReportRowData;
  level: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  currencySymbol: string;
}

const ReportRow: React.FC<ReportRowProps> = ({ item, level, isExpanded, onToggle, currencySymbol }) => {
  const hasChildren = (item.children && item.children.length > 0) || (item.ledgers && item.ledgers.length > 0);
  const isMainHead = level === 0;
  const isGroupHead = level === 1;

  const rowStyle = {
    paddingLeft: `${level * 1.5}rem`,
  };

  return (
    <>
      <tr className={`border-b border-slate-200 dark:border-slate-700/50 ${isMainHead ? 'bg-slate-100 dark:bg-slate-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
        <td className={`p-3 ${isMainHead ? 'font-extrabold text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'} ${isGroupHead ? 'font-bold' : ''}`} style={rowStyle}>
          <button onClick={() => hasChildren && onToggle(item.id)} className="flex items-center gap-2 text-left" disabled={!hasChildren}>
            {hasChildren && <ChevronRightIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
            {!hasChildren && <div className="w-4 h-4" />}
            {item.title}
          </button>
        </td>
        <td className={`p-3 text-right font-mono ${isMainHead ? 'font-extrabold text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'} ${isGroupHead ? 'font-bold' : ''}`}>
          {currencySymbol} {Math.abs(item.total).toFixed(2)}
        </td>
      </tr>
      {isExpanded && hasChildren && (
        <>
          {item.children?.map(child => <ReportRow key={child.id} item={child} level={level + 1} isExpanded={isExpanded} onToggle={onToggle} currencySymbol={currencySymbol} />)}
          {item.ledgers?.map(ledger => (
            <tr key={ledger.id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <td className="p-3 text-slate-600 dark:text-slate-400" style={{ paddingLeft: `${(level + 2) * 1.5}rem` }}>{ledger.name}</td>
              <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">{currencySymbol} {Math.abs(ledger.balance).toFixed(2)}</td>
            </tr>
          ))}
        </>
      )}
    </>
  );
};

const BalanceSheet: React.FC = () => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { startDate, endDate } = useDateRange();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const { ledgers = [], vouchers = [], details } = companyData!;

    const reportData = useMemo(() => {
        if (!ledgers?.length) return [];
        const { transactions, closingBalances } = calculateLedgerBalancesForPeriod(ledgers, vouchers, startDate, endDate);
        const { netProfit } = calculateProfitAndLoss(ledgers, transactions);
        return generateSchedule3BalanceSheetData(ledgers, closingBalances, netProfit);
    }, [ledgers, vouchers, startDate, endDate]);
    
    // Expand top-level and second-level groups by default
    // FIX: Add useEffect import
    useEffect(() => {
      const defaultExpanded = new Set<string>();
      reportData.forEach(topLevel => {
        defaultExpanded.add(topLevel.id);
        topLevel.children?.forEach(secondLevel => {
          defaultExpanded.add(secondLevel.id);
        });
      });
      setExpandedRows(defaultExpanded);
    }, [reportData]);


    const toggleExpand = (id: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handlePdfDownload = () => {
        // FIX: Extract correct arguments for generateBalanceSheetPDF
        if (companyData && reportData.length === 2) {
            const liabilityData = reportData[0].children?.map(c => ({ head: c.title, total: c.total })) || [];
            const assetData = reportData[1].children?.map(c => ({ head: c.title, total: c.total })) || [];
            const totalLiabilities = reportData[0].total;
            const totalAssets = reportData[1].total;
            generateBalanceSheetPDF(liabilityData, assetData, totalLiabilities, totalAssets, endDate, companyData);
        }
    };

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                     <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Balance Sheet (Schedule III)</h1>
                     <p className="text-lg text-slate-500 dark:text-slate-400 font-normal">as on {formatDate(endDate)}</p>
                </div>
                <Button onClick={handlePdfDownload} variant="secondary">
                    <PdfIcon className="w-5 h-5 mr-2" />
                    Download PDF
                </Button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50">
                            <tr>
                                <th className="p-3 font-medium">PARTICULARS</th>
                                <th className="p-3 font-medium text-right">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map(item => (
                                <ReportRow
                                    key={item.id}
                                    item={item}
                                    level={0}
                                    isExpanded={expandedRows.has(item.id)}
                                    onToggle={toggleExpand}
                                    currencySymbol={details.currencySymbol}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;