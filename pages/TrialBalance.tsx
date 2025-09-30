import React, { useContext, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useDateRange } from '../context/DateRangeContext';
import { calculateLedgerBalancesForPeriod } from '../utils/accounting';
import Button from '../components/Button';
import { PdfIcon } from '../components/Icon';
import { generateTrialBalancePDF } from '../utils/pdfGenerator';
import { formatDate } from '../utils/exportUtils';

const TrialBalance: React.FC = () => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { startDate, endDate } = useDateRange();
    
    const { ledgers = [], vouchers = [] } = companyData!;

    const { debitTotal, creditTotal, rows } = useMemo(() => {
        const { closingBalances } = calculateLedgerBalancesForPeriod(ledgers, vouchers, startDate, endDate);
        
        let debitTotal = 0;
        let creditTotal = 0;
        const rows: { name: string; debit: number; credit: number }[] = [];

        ledgers.forEach(ledger => {
            const balance = closingBalances.get(ledger.id) || 0;
            if (Math.abs(balance) > 0.001) { // Only show ledgers with non-zero balance
                if (balance > 0) {
                    rows.push({ name: ledger.name, debit: balance, credit: 0 });
                    debitTotal += balance;
                } else {
                    rows.push({ name: ledger.name, debit: 0, credit: -balance });
                    creditTotal += -balance;
                }
            }
        });

        return { debitTotal, creditTotal, rows };

    }, [ledgers, vouchers, startDate, endDate]);
    
    const handlePdfDownload = () => {
        if (companyData) {
            generateTrialBalancePDF(rows, debitTotal, creditTotal, endDate, companyData);
        }
    };

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Trial Balance</h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400">For the period ending <span className="font-semibold text-sky-500 dark:text-sky-400">{formatDate(endDate)}</span></p>
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
                                <th className="p-3 font-medium">Particulars</th>
                                <th className="p-3 font-medium text-right">Debit</th>
                                <th className="p-3 font-medium text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <td className="p-3 text-slate-800 dark:text-slate-200">{row.name}</td>
                                    <td className="p-3 text-right font-mono text-green-600 dark:text-green-400">{row.debit > 0 ? row.debit.toFixed(2) : ''}</td>
                                    <td className="p-3 text-right font-mono text-orange-600 dark:text-orange-400">{row.credit > 0 ? row.credit.toFixed(2) : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-100 dark:bg-slate-900/50 font-bold text-lg">
                            <tr>
                                <td className="p-3 text-slate-800 dark:text-slate-200">Total</td>
                                <td className="p-3 text-right font-mono text-green-700 dark:text-green-300">{debitTotal.toFixed(2)}</td>
                                <td className="p-3 text-right font-mono text-orange-700 dark:text-orange-300">{creditTotal.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 {Math.abs(debitTotal - creditTotal) > 0.01 && (
                    <div className="text-center p-3 bg-red-100 dark:bg-red-900/50 border-t border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-300 font-semibold">
                        Difference: {(debitTotal - creditTotal).toFixed(2)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrialBalance;
