
import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useDateRange } from '../context/DateRangeContext';
import { calculateStockSummary } from '../utils/accounting';
import Button from '../components/Button';
import Select from '../components/Select';
import { PdfIcon } from '../components/Icon';
import { generateStockSummaryPDF } from '../utils/pdfGenerator';
import { formatDate } from '../utils/exportUtils';

const StockSummary: React.FC = () => {
    const navigate = useNavigate();
    const { companyData } = useContext(CompanyDataContext)!;
    const { startDate, endDate } = useDateRange();
    
    const { stockItems = [], vouchers = [], godowns = [] } = companyData!;
    const [selectedGodownId, setSelectedGodownId] = useState<string>('all');

    const godownOptions = useMemo(() => [
        { value: 'all', label: 'All Godowns' },
        ...godowns.map(g => ({ value: g.id, label: g.name }))
    ], [godowns]);
    
    const summaryData = useMemo(() => {
        return calculateStockSummary(stockItems, vouchers, godowns, startDate, endDate);
    }, [stockItems, vouchers, godowns, startDate, endDate]);

    const handlePdfDownload = () => {
        // TODO: Update PDF generator for godown-wise summary
        // if (companyData) {
        //     generateStockSummaryPDF(stockItems, summaryData, startDate, endDate, companyData);
        // }
    };

    return (
        <div className="container mx-auto">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Stock Summary</h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400">For the period from <span className="font-semibold text-sky-500 dark:text-sky-400">{formatDate(startDate)}</span> to <span className="font-semibold text-sky-500 dark:text-sky-400">{formatDate(endDate)}</span></p>
                </div>
                <div className="flex gap-4">
                    <Select label="" id="godown-filter" value={selectedGodownId} onChange={setSelectedGodownId} options={godownOptions} className="w-48" />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50">
                            <tr>
                                <th rowSpan={2} className="p-3 font-medium border-b border-r border-slate-200 dark:border-slate-700">Particulars</th>
                                <th colSpan={2} className="p-3 font-medium text-center border-b border-r border-slate-200 dark:border-slate-700">Opening Balance</th>
                                <th colSpan={2} className="p-3 font-medium text-center border-b border-r border-slate-200 dark:border-slate-700">Inwards</th>
                                <th colSpan={2} className="p-3 font-medium text-center border-b border-r border-slate-200 dark:border-slate-700">Outwards</th>
                                <th colSpan={2} className="p-3 font-medium text-center border-b border-slate-200 dark:border-slate-700">Closing Balance</th>
                            </tr>
                            <tr>
                                <th className="p-3 font-medium text-right border-r border-slate-200 dark:border-slate-700">Quantity</th><th className="p-3 font-medium text-right border-r border-slate-200 dark:border-slate-700">Value</th>
                                <th className="p-3 font-medium text-right border-r border-slate-200 dark:border-slate-700">Quantity</th><th className="p-3 font-medium text-right border-r border-slate-200 dark:border-slate-700">Value</th>
                                <th className="p-3 font-medium text-right border-r border-slate-200 dark:border-slate-700">Quantity</th><th className="p-3 font-medium text-right border-r border-slate-200 dark:border-slate-700">Value</th>
                                <th className="p-3 font-medium text-right border-r border-slate-200 dark:border-slate-700">Quantity</th><th className="p-3 font-medium text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stockItems.map(item => {
                                const data = summaryData.get(item.id);
                                if (!data) return null;
                                const godownData = data.godowns.get(selectedGodownId) || (selectedGodownId === 'all' ? data.total : null);
                                if (!godownData || godownData.closingQty === 0 && godownData.openingQty === 0 && godownData.inwardQty === 0 && godownData.outwardQty === 0) return null;
                                
                                const isLowStock = item.reorderLevel && godownData.closingQty < item.reorderLevel;

                                return (
                                    <tr key={item.id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                            {item.name} <span className="text-xs text-slate-500 dark:text-slate-400">({item.unit})</span>
                                            {isLowStock && <span className="ml-2 text-xs font-bold text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full">LOW</span>}
                                        </td>
                                        <td className="p-3 text-right font-mono">{godownData.openingQty}</td><td className="p-3 text-right font-mono border-r border-slate-200 dark:border-slate-700">{godownData.openingValue.toFixed(2)}</td>
                                        <td className="p-3 text-right font-mono">{godownData.inwardQty}</td><td className="p-3 text-right font-mono border-r border-slate-200 dark:border-slate-700">{godownData.inwardValue.toFixed(2)}</td>
                                        <td className="p-3 text-right font-mono">{godownData.outwardQty}</td><td className="p-3 text-right font-mono border-r border-slate-200 dark:border-slate-700">{godownData.outwardValue.toFixed(2)}</td>
                                        <td className="p-3 text-right font-mono font-bold">{godownData.closingQty}</td><td className="p-3 text-right font-mono font-bold">{godownData.closingValue.toFixed(2)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockSummary;
