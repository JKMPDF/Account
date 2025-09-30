
import React, { useState, useContext, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import type { Ledger, Voucher } from '../types';
import Button from '../components/Button';
import { formatDate } from '../utils/exportUtils';

const AgingReport: React.FC = () => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { ledgers, vouchers } = companyData!;

    const [reportType, setReportType] = useState<'Receivables' | 'Payables'>('Receivables');
    const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split('T')[0]);
    const [agingBuckets, setAgingBuckets] = useState([0, 30, 60, 90]);

    const reportData = useMemo(() => {
        const group = reportType === 'Receivables' ? 'Sundry Debtors' : 'Sundry Creditors';
        const relevantLedgers = ledgers.filter(l => l.group === group);
        const reportDate = new Date(asOnDate);

        return relevantLedgers.map(ledger => {
            let balance = (ledger.openingBalanceType === 'Dr' ? 1 : -1) * (ledger.openingBalance || 0);
            
            const transactions: { date: Date; amount: number }[] = [];

            vouchers.forEach(v => {
                const entry = v.entries.find(e => e.ledgerId === ledger.id);
                if (entry) {
                    const amount = (entry.type === 'Dr' ? 1 : -1) * entry.amount;
                    balance += amount;
                    transactions.push({ date: new Date(v.date), amount });
                }
            });

            const buckets = Array(agingBuckets.length + 1).fill(0);
            let outstanding = balance;

            // Simple aging logic: apply oldest payments to oldest debits
            // A more complex implementation would match invoices to payments
            transactions.sort((a, b) => b.date.getTime() - a.date.getTime()).forEach(tx => {
                if (outstanding === 0) return;
                
                const daysOld = Math.floor((reportDate.getTime() - tx.date.getTime()) / (1000 * 3600 * 24));
                
                if(daysOld < 0) return; // Skip future transactions

                let bucketIndex = agingBuckets.findIndex(bucket => daysOld <= bucket);
                if (bucketIndex === -1) bucketIndex = agingBuckets.length;
                
                const amountToAge = Math.min(Math.abs(outstanding), Math.abs(tx.amount));
                buckets[bucketIndex] += (reportType === 'Receivables' ? 1 : -1) * amountToAge;
                outstanding -= amountToAge;
            });


            return {
                ledgerName: ledger.name,
                totalBalance: balance,
                buckets,
            };
        }).filter(item => Math.abs(item.totalBalance) > 0.01);

    }, [reportType, asOnDate, agingBuckets, ledgers, vouchers]);

    const bucketHeaders = agingBuckets.map((start, i) => {
        const end = agingBuckets[i + 1];
        if (end) return `${start + 1}-${end} Days`;
        return `> ${start} Days`;
    });
    bucketHeaders.unshift(`0-${agingBuckets[0]} Days`);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">Aging Report</h1>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 mb-6 flex flex-wrap items-end gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Report For</label>
                    <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-md">
                        <Button variant={reportType === 'Receivables' ? 'primary' : 'secondary'} onClick={() => setReportType('Receivables')} className="!px-3 !py-1 text-sm">Receivables</Button>
                        <Button variant={reportType === 'Payables' ? 'primary' : 'secondary'} onClick={() => setReportType('Payables')} className="!px-3 !py-1 text-sm">Payables</Button>
                    </div>
                </div>
                <div>
                    <label htmlFor="asOnDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">As on Date</label>
                    <input type="date" id="asOnDate" value={asOnDate} onChange={e => setAsOnDate(e.target.value)} className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm" />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50">
                            <tr>
                                <th className="p-3 font-medium">Particulars</th>
                                <th className="p-3 font-medium text-right">Total Outstanding</th>
                                {bucketHeaders.map(header => (
                                    <th key={header} className="p-3 font-medium text-right">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, i) => (
                                <tr key={i} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <td className="p-3 text-slate-800 dark:text-slate-200">{row.ledgerName}</td>
                                    <td className="p-3 text-right font-mono font-bold">{Math.abs(row.totalBalance).toFixed(2)}</td>
                                    {row.buckets.map((bucket, j) => (
                                        <td key={j} className="p-3 text-right font-mono">{Math.abs(bucket) > 0.01 ? Math.abs(bucket).toFixed(2) : '-'}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-100 dark:bg-slate-900/50 font-bold">
                            <tr>
                                <td className="p-3 text-slate-800 dark:text-slate-200">Grand Total</td>
                                <td className="p-3 text-right font-mono">{Math.abs(reportData.reduce((s, r) => s + r.totalBalance, 0)).toFixed(2)}</td>
                                {bucketHeaders.map((_, i) => (
                                    <td key={i} className="p-3 text-right font-mono">{Math.abs(reportData.reduce((s, r) => s + r.buckets[i], 0)).toFixed(2)}</td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AgingReport;
