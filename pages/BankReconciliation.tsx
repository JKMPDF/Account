

import React, { useState, useContext, useMemo, useRef } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { calculateLedgerBalancesForPeriod } from '../utils/accounting';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import { SaveIcon, UploadIcon } from '../components/Icon';
import type { VoucherEntry, Ledger } from '../types';
import { formatDate } from '../utils/exportUtils';
import { useNotifications } from '../context/NotificationContext';

interface BankTransaction {
    voucherId: string;
    date: string;
    particulars: string;
    voucherType: string;
    voucherNo: number;
    entry: VoucherEntry;
}

const BankReconciliation: React.FC = () => {
    const context = useContext(CompanyDataContext);
    const { companyData, reconcileBankEntries } = context!;
    const { ledgers = [], vouchers = [] } = companyData!;
    const { addNotification } = useNotifications();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [reconciliationDate, setReconciliationDate] = useState(new Date().toISOString().split('T')[0]);
    const [balanceAsPerBankStmt, setBalanceAsPerBankStmt] = useState<number | ''>('');
    const [clearedEntryIds, setClearedEntryIds] = useState<Set<string>>(new Set());

    const bankLedgerOptions = useMemo(() => [
        { value: '', label: '-- Select Bank --' },
        ...ledgers.filter(l => l.group === 'Bank Accounts' || l.group === 'Bank OD A/c').map(l => ({ value: l.id, label: l.name }))
    ], [ledgers]);

    const transactions = useMemo<BankTransaction[]>(() => {
        if (!selectedBankId) return [];

        const ledgerMap = new Map(ledgers.map(l => [l.id, l.name]));
        const endReconDate = new Date(reconciliationDate);
        endReconDate.setHours(23, 59, 59, 999); // Include the entire day

        return vouchers
            .flatMap(v => v.entries
                .filter(e => e.ledgerId === selectedBankId)
                .map(e => {
                    const otherEntry = v.entries.find(other => other.ledgerId !== selectedBankId);
                    return {
                        voucherId: v.id,
                        date: v.date,
                        particulars: ledgerMap.get(otherEntry?.ledgerId || '') || v.narration || v.type,
                        voucherType: v.type,
                        voucherNo: v.voucherNo,
                        entry: e,
                    }
                })
            )
            .filter(t => new Date(t.date) <= endReconDate)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [selectedBankId, vouchers, ledgers, reconciliationDate]);
    
    const unreconciledTransactions = useMemo(() => {
        return transactions.filter(t => !t.entry.reconciliationDate);
    }, [transactions]);
    
    const { balanceAsPerBooks, unclearedPayments, unclearedReceipts, balanceAsPerBankCalc, difference } = useMemo(() => {
        if (!selectedBankId) return { balanceAsPerBooks: 0, unclearedPayments: 0, unclearedReceipts: 0, balanceAsPerBankCalc: 0, difference: 0 };

        const { closingBalances } = calculateLedgerBalancesForPeriod(ledgers, vouchers, "1970-01-01", reconciliationDate);
        const balanceAsPerBooks = closingBalances.get(selectedBankId) || 0;

        let unclearedPayments = 0; // Debits in books (payments from bank)
        let unclearedReceipts = 0; // Credits in books (receipts to bank)

        unreconciledTransactions.forEach(t => {
            if (!clearedEntryIds.has(t.entry.id)) {
                if (t.entry.type === 'Dr') { // Payment from bank (Debit in our books)
                    unclearedPayments += t.entry.amount;
                } else { // Receipt into bank (Credit in our books)
                    unclearedReceipts += t.entry.amount;
                }
            }
        });
        
        // This logic seems reversed from standard BRS.
        // Balance as per bank = Balance as per books - uncleared receipts + uncleared payments
        const balanceAsPerBankCalc = balanceAsPerBooks - unclearedReceipts + unclearedPayments;
        const difference = (balanceAsPerBankStmt === '' ? balanceAsPerBankCalc : balanceAsPerBankStmt) - balanceAsPerBankCalc;

        return { balanceAsPerBooks, unclearedPayments, unclearedReceipts, balanceAsPerBankCalc, difference };

    }, [selectedBankId, ledgers, vouchers, reconciliationDate, unreconciledTransactions, clearedEntryIds, balanceAsPerBankStmt]);


    const handleToggleCleared = (entryId: string) => {
        setClearedEntryIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entryId)) {
                newSet.delete(entryId);
            } else {
                newSet.add(entryId);
            }
            return newSet;
        });
    };
    
    const handleSaveReconciliation = () => {
        if (clearedEntryIds.size === 0) {
            addNotification("No entries selected to reconcile.", 'info');
            return;
        }
        reconcileBankEntries(Array.from(clearedEntryIds), reconciliationDate);
        setClearedEntryIds(new Set());
    };
    
     const handleStatementImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            // More robust CSV parsing
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length < 2) { addNotification('CSV file is empty or has no data.', 'error'); return; }

            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
            const amountDebitIndex = header.findIndex(h => h.includes('debit') || h.includes('withdrawal'));
            const amountCreditIndex = header.findIndex(h => h.includes('credit') || h.includes('deposit'));
            
            if(amountDebitIndex === -1 && amountCreditIndex === -1){ addNotification('Could not find Debit/Credit or Withdrawal/Deposit columns in CSV.', 'error'); return;}

            const statementAmounts = new Map<number, number>(); // amount -> count
            lines.slice(1).forEach(line => {
                const columns = line.split(',');
                const debit = amountDebitIndex > -1 ? parseFloat(columns[amountDebitIndex]?.replace(/["']/g, '')) : 0;
                const credit = amountCreditIndex > -1 ? parseFloat(columns[amountCreditIndex]?.replace(/["']/g, '')) : 0;
                const amount = Math.abs(debit || credit);
                if (!isNaN(amount) && amount > 0) {
                    const roundedAmount = parseFloat(amount.toFixed(2));
                    statementAmounts.set(roundedAmount, (statementAmounts.get(roundedAmount) || 0) + 1);
                }
            });

            const matchedIds = new Set<string>();
            unreconciledTransactions.forEach(txn => {
                const txnAmount = parseFloat(txn.entry.amount.toFixed(2));
                if(statementAmounts.has(txnAmount) && (statementAmounts.get(txnAmount) || 0) > 0) {
                    matchedIds.add(txn.entry.id);
                    statementAmounts.set(txnAmount, (statementAmounts.get(txnAmount) || 1) - 1);
                }
            });
            
            setClearedEntryIds(prev => new Set([...prev, ...matchedIds]));
            addNotification(`Auto-matched ${matchedIds.size} transactions based on amount.`, 'success');
        };
        reader.readAsText(file);
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">Bank Reconciliation</h1>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                     <Select label="Bank Account" id="bank-ledger" value={selectedBankId} onChange={setSelectedBankId} options={bankLedgerOptions} required />
                    <Input label="Reconciliation Date" id="recon-date" type="date" value={reconciliationDate} onChange={e => setReconciliationDate(e.target.value)} />
                    <Input label="Balance as per Bank Statement" id="bank-balance" type="number" value={balanceAsPerBankStmt} onChange={e => setBalanceAsPerBankStmt(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Enter amount..." />
                </div>
                 <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Import Statement (CSV)
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleStatementImport} className="hidden" accept=".csv" />
                </div>
            </div>

            {selectedBankId && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="p-4"><h2 className="text-xl font-bold text-sky-600 dark:text-sky-300">Unreconciled Transactions up to {formatDate(reconciliationDate)}</h2></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50">
                                <tr>
                                    <th className="p-3 font-medium">Date</th>
                                    <th className="p-3 font-medium">Particulars</th>
                                    <th className="p-3 font-medium text-right">Debit (Payment)</th>
                                    <th className="p-3 font-medium text-right">Credit (Receipt)</th>
                                    <th className="p-3 font-medium text-center">Cleared</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unreconciledTransactions.length > 0 ? (
                                    unreconciledTransactions.map(t => (
                                        <tr key={t.entry.id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="p-3">{formatDate(t.date)}</td>
                                            <td className="p-3">{t.particulars}</td>
                                            <td className="p-3 text-right font-mono text-orange-600 dark:text-orange-400">{t.entry.type === 'Dr' ? t.entry.amount.toFixed(2) : ''}</td>
                                            <td className="p-3 text-right font-mono text-green-600 dark:text-green-400">{t.entry.type === 'Cr' ? t.entry.amount.toFixed(2) : ''}</td>
                                            <td className="p-3 text-center">
                                                <input type="checkbox" checked={clearedEntryIds.has(t.entry.id)} onChange={() => handleToggleCleared(t.entry.id)} 
                                                    className="w-5 h-5 bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="p-6 text-center text-slate-500 dark:text-slate-400">All transactions are reconciled up to this date.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-slate-100 dark:bg-slate-900/50 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-slate-700 dark:text-slate-300">
                            <div className="flex justify-between"><span className="font-semibold">Balance as per Company Books:</span> <span className="font-mono">{balanceAsPerBooks.toFixed(2)}</span></div>
                            <div className="flex justify-between text-green-600 dark:text-green-400"><span className="font-semibold">Add: Payments not reflecting in Bank:</span> <span className="font-mono">{unclearedPayments.toFixed(2)}</span></div>
                            <div className="flex justify-between text-orange-600 dark:text-orange-400"><span className="font-semibold">Less: Receipts not reflecting in Bank:</span> <span className="font-mono">{unclearedReceipts.toFixed(2)}</span></div>
                        </div>
                         <div className="space-y-2 text-slate-700 dark:text-slate-300 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-4 md:pt-0 md:pl-6">
                            <div className="flex justify-between text-lg"><span className="font-bold">Balance as per Bank (Calculated):</span> <span className="font-mono font-bold">{balanceAsPerBankCalc.toFixed(2)}</span></div>
                             <div className="flex justify-between"><span className="font-semibold">Balance as per Bank Statement:</span> <span className="font-mono">{balanceAsPerBankStmt !== '' ? (balanceAsPerBankStmt as number).toFixed(2) : 'N/A'}</span></div>
                            <div className={`flex justify-between text-lg font-bold pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 ${Math.abs(difference) > 0.01 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                <span>Difference:</span> <span className="font-mono">{difference.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex justify-end">
                        <Button onClick={handleSaveReconciliation} disabled={clearedEntryIds.size === 0}>
                            <SaveIcon className="w-5 h-5 mr-2" /> Save Reconciliation
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankReconciliation;
