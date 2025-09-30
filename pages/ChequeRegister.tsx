
import React, { useContext, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useDateRange } from '../context/DateRangeContext';
import { formatDate } from '../utils/exportUtils';
import { Ledger } from '../types';

const ChequeRegister: React.FC = () => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { startDate, endDate } = useDateRange();
    const { ledgers, vouchers } = companyData!;

    const reportData = useMemo(() => {
        const bankLedgers = ledgers.filter(l => l.group === 'Bank Accounts' || l.group === 'Bank OD A/c');
        const bankLedgerIds = new Set(bankLedgers.map(l => l.id));
        const ledgerMap = new Map(ledgers.map(l => [l.id, l]));

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const chequeTxns: any[] = [];
        
        vouchers.forEach(v => {
            const vDate = new Date(v.date);
            if(vDate < start || vDate > end) return;
            
            const bankEntry = v.entries.find(e => bankLedgerIds.has(e.ledgerId));
            if(bankEntry) {
                const chequeRegex = /(?:cheque|chq|cheq)\.?,?\s?no\.?:?\s?(\d+)/i;
                const match = v.narration.match(chequeRegex);
                if (match) {
                    const otherEntry = v.entries.find(e => !bankLedgerIds.has(e.ledgerId));
                    chequeTxns.push({
                        id: v.id,
                        date: v.date,
                        bankName: (ledgerMap.get(bankEntry.ledgerId) as Ledger)?.bankName || ledgerMap.get(bankEntry.ledgerId)?.name,
                        partyName: ledgerMap.get(otherEntry?.ledgerId || '')?.name,
                        chequeNo: match[1],
                        amount: bankEntry.amount,
                        type: bankEntry.type === 'Dr' ? 'Payment' : 'Receipt', // Cr in bank is payment, Dr is receipt
                        status: bankEntry.reconciliationDate ? `Cleared on ${formatDate(bankEntry.reconciliationDate)}` : 'Pending'
                    });
                }
            }
        });
        return chequeTxns.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [ledgers, vouchers, startDate, endDate]);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Cheque Register</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-6">For the period from {formatDate(startDate)} to {formatDate(endDate)}</p>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50">
                            <tr>
                                <th className="p-3 font-medium">Date</th>
                                <th className="p-3 font-medium">Bank Name</th>
                                <th className="p-3 font-medium">Party Name</th>
                                <th className="p-3 font-medium">Cheque No.</th>
                                <th className="p-3 font-medium text-right">Amount</th>
                                <th className="p-3 font-medium">Type</th>
                                <th className="p-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                reportData.map(row => (
                                    <tr key={row.id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-3">{formatDate(row.date)}</td>
                                        <td className="p-3 text-slate-800 dark:text-slate-200">{row.bankName}</td>
                                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{row.partyName}</td>
                                        <td className="p-3 font-mono">{row.chequeNo}</td>
                                        <td className="p-3 text-right font-mono">{row.amount.toFixed(2)}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${row.type === 'Payment' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="p-3">{row.status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center p-10 text-slate-500 dark:text-slate-400">
                                        No cheque transactions found in narration for this period.
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

export default ChequeRegister;
