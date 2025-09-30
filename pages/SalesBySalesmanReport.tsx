
import React, { useContext, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useDateRange } from '../context/DateRangeContext';
import { calculateSalesBySalesman } from '../utils/accounting';
import { formatDate } from '../utils/exportUtils';

const SalesBySalesmanReport: React.FC = () => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { startDate, endDate } = useDateRange();
    const { salesmen, vouchers, stockItems } = companyData!;

    const reportData = useMemo(() => {
        return calculateSalesBySalesman(salesmen, vouchers, stockItems, startDate, endDate);
    }, [salesmen, vouchers, stockItems, startDate, endDate]);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Sales by Salesman</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-6">For the period from {formatDate(startDate)} to {formatDate(endDate)}</p>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50">
                            <tr>
                                <th className="p-3 font-medium">Salesman Name</th>
                                <th className="p-3 font-medium text-right">Total Sales Value</th>
                                <th className="p-3 font-medium text-right">Number of Invoices</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                reportData.map(row => (
                                    <tr key={row.salesmanId} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{row.salesmanName}</td>
                                        <td className="p-3 text-right font-mono">{row.totalValue.toFixed(2)}</td>
                                        <td className="p-3 text-right font-mono">{row.invoiceCount}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center p-10 text-slate-500 dark:text-slate-400">
                                        No sales data with assigned salesmen found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesBySalesmanReport;
