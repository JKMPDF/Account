

import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useNotifications } from '../context/NotificationContext';
import { useModal } from '../context/ModalContext';
import { useDateRange } from '../context/DateRangeContext';
import type { Voucher, VoucherEntry, Ledger } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import InvoiceForm from '../components/InvoiceForm';
import StockJournalForm from '../components/StockJournalForm';
import JournalForm from '../components/JournalForm';
import { SaveIcon, PdfIcon } from '../components/Icon';
import LedgerQuickCreateForm from '../components/LedgerQuickCreateForm';
import { generateVoucherPDF } from '../utils/pdfGenerator';

const PostEntry: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const context = useContext(CompanyDataContext);
    const { addNotification } = useNotifications();
    const { showModal } = useModal();
    const { startDate: fyStartDate, endDate: fyEndDate } = useDateRange();

    const voucherIdToEdit = location.state?.voucherId;

    const [voucherType, setVoucherType] = useState<Voucher['type']>('Sale');
    const [voucherNo, setVoucherNo] = useState(1);
    const [date, setDate] = useState('');
    const [entries, setEntries] = useState<VoucherEntry[]>([]);
    const [transactionType, setTransactionType] = useState<'Intra-State' | 'Inter-State'>('Intra-State');
    const [narration, setNarration] = useState('');
    const [formKey, setFormKey] = useState(Date.now());

    if (!context) return null;
    const { companyData, addVoucher, editVoucher } = context;

    const isInvoiceMode = ['Sale', 'Purchase', 'Credit Note', 'Debit Note'].includes(voucherType);
    const isStockJournalMode = voucherType === 'Stock Journal';

    const getNextVoucherNo = useCallback((vchType: Voucher['type']) => {
        const relevantVouchers = companyData?.vouchers.filter(v => v.type === vchType) || [];
        const maxNo = relevantVouchers.length > 0 ? Math.max(...relevantVouchers.map(v => v.voucherNo || 0)) : 0;
        return maxNo + 1;
    }, [companyData?.vouchers]);
    
    useEffect(() => {
        if (voucherIdToEdit && companyData) {
            const voucherToEdit = companyData.vouchers.find(v => v.id === voucherIdToEdit);
            if (voucherToEdit) {
                setVoucherType(voucherToEdit.type);
                setVoucherNo(voucherToEdit.voucherNo);
                setDate(voucherToEdit.date);
                setEntries(voucherToEdit.entries);
                setNarration(voucherToEdit.narration);
                setTransactionType(voucherToEdit.transactionType || 'Intra-State');
                setFormKey(Date.now()); // Force re-render of child forms with new props
            }
        } else {
             setVoucherNo(getNextVoucherNo(voucherType));
             
             // Set initial date logic
             const today = new Date();
             const fyStart = new Date(fyStartDate);
             const fyEnd = new Date(fyEndDate);
             
             // Compare dates only, ignore time
             today.setHours(0, 0, 0, 0);
             fyStart.setHours(0, 0, 0, 0);
             fyEnd.setHours(0, 0, 0, 0);

             if (today >= fyStart && today <= fyEnd) {
                 setDate(new Date().toISOString().split('T')[0]); // Today's date
             } else {
                 setDate(fyEndDate); // Last day of FY
                 addNotification(`Voucher date set to financial year end.`, 'info');
             }
        }
    }, [voucherIdToEdit, companyData, voucherType, getNextVoucherNo, fyStartDate, fyEndDate, addNotification]);

    useEffect(() => {
        if (!voucherIdToEdit) {
            const timestamp = Date.now();
            const defaultEntries: VoucherEntry[] = [
                { id: `new_${timestamp}_1`, type: 'Dr' as 'Dr' | 'Cr', ledgerId: '', amount: 0 },
                { id: `new_${timestamp}_2`, type: 'Cr' as 'Dr' | 'Cr', ledgerId: '', amount: 0 },
            ];
            
            if (voucherType === 'Payment') {
                const cashOrBankLedgers = companyData?.ledgers.filter(l => l.group === 'Cash-in-hand' || l.group === 'Bank Accounts');
                defaultEntries[1].ledgerId = cashOrBankLedgers?.[0]?.id || '';
            } else if (voucherType === 'Receipt') {
                 const cashOrBankLedgers = companyData?.ledgers.filter(l => l.group === 'Cash-in-hand' || l.group === 'Bank Accounts');
                defaultEntries[0].ledgerId = cashOrBankLedgers?.[0]?.id || '';
            }

            if (!isInvoiceMode && !isStockJournalMode) {
                setEntries(defaultEntries);
            } else {
                setEntries([]);
                setFormKey(Date.now());
            }
        }
    }, [voucherType, companyData?.ledgers, isInvoiceMode, isStockJournalMode, voucherIdToEdit]);

    const handleQuickCreateLedger = (onCreatedCallback: (newLedger: Ledger) => void) => {
        showModal(<LedgerQuickCreateForm onLedgerCreated={onCreatedCallback} />);
    };

    const handleDownloadPdf = () => {
        if (!isInvoiceMode || !companyData) return;

        // Validation for PDF generation
        const partyLedgerId = entries.find(e => {
            const ledger = companyData.ledgers.find(l => l.id === e.ledgerId);
            return ledger && ['Sundry Debtors', 'Sundry Creditors', 'Bank Accounts', 'Cash-in-hand'].includes(ledger.group);
        })?.ledgerId;

        const mainLedgerId = entries.find(e => {
            const ledger = companyData.ledgers.find(l => l.id === e.ledgerId);
            return ledger && (['Sales Accounts', 'Purchase Accounts'].includes(ledger.group));
        })?.ledgerId;

        if (!partyLedgerId || !mainLedgerId || entries.length < 2) {
            addNotification('Please fill in Party, Ledger, and at least one item before downloading.', 'error');
            return;
        }

        const voucherForPdf: Voucher = {
            id: voucherIdToEdit || `temp_${Date.now()}`,
            date,
            type: voucherType,
            voucherNo,
            entries,
            narration,
            transactionType,
        };
        generateVoucherPDF(voucherForPdf, companyData);
    };

    const { debitTotal, creditTotal, isBalanced } = useMemo(() => {
        const validEntries = entries.filter(e => e.ledgerId && e.amount >= 0);
        const totals = validEntries.reduce((acc, entry) => {
            const amount = Number(entry.amount) || 0;
            if (entry.type === 'Dr') acc.debitTotal += amount;
            else acc.creditTotal += amount;
            return acc;
        }, { debitTotal: 0, creditTotal: 0 });
        
        return {
            ...totals,
            isBalanced: Math.abs(totals.debitTotal - totals.creditTotal) < 0.01 && totals.debitTotal > 0,
        };
    }, [entries]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isInvoiceMode && companyData?.details.gstApplicable) {
            const requiredLedgers = new Set<string>();
            if (transactionType === 'Intra-State') {
                requiredLedgers.add('cgst'); requiredLedgers.add('sgst');
            } else {
                requiredLedgers.add('igst');
            }
            const missing = Array.from(requiredLedgers).filter(tax => 
                !companyData.ledgers.some(l => l.name.toLowerCase() === tax && l.group === 'Duties & Taxes')
            );
            if (missing.length > 0) {
                addNotification(`Create ledgers under 'Duties & Taxes': ${missing.join(', ').toUpperCase()}`, 'error');
                return;
            }
        }

        const validEntries = entries.filter(e => e.ledgerId && e.amount >= 0);
        if (validEntries.length < 2) {
             addNotification('A voucher must have at least two valid entries.', 'error');
             return;
        }

        if (!isBalanced) {
            addNotification('Debit and Credit totals must match and be greater than zero.', 'error');
            return;
        }
        
        const voucherData = { date, type: voucherType, voucherNo, entries: validEntries, narration, transactionType };
        const success = voucherIdToEdit ? editVoucher(voucherIdToEdit, voucherData) : addVoucher(voucherData);

        if (success) {
            // Reset the form for a new entry instead of navigating away
            setNarration('');
            if (isInvoiceMode) {
                setTransactionType('Intra-State');
            }
            // By clearing the location state, we exit "edit mode".
            // The useEffect hooks will then handle resetting the voucher number and entries.
            navigate(location.pathname, { replace: true, state: {} });
            
            // This is key to ensuring child components like InvoiceForm fully reset their internal states.
            setFormKey(Date.now());
        }
    };
    
    const VOUCHER_TYPES: Array<Voucher['type']> = ['Sale', 'Purchase', 'Credit Note', 'Debit Note', 'Payment', 'Receipt', 'Journal', 'Stock Journal'];
    const pageTitle = voucherIdToEdit ? 'Edit Voucher' : 'Voucher Entry';

    return (
        <div className="w-full mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">{pageTitle}</h1>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
                
                <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="w-full md:w-auto">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-300 mb-2">Voucher Type</h2>
                            <div className="flex flex-wrap items-center gap-1">
                                {VOUCHER_TYPES.map(vType => (
                                    <button
                                        key={vType} type="button" onClick={() => setVoucherType(vType)}
                                        disabled={!!voucherIdToEdit}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-sky-500
                                            ${voucherType === vType 
                                                ? 'bg-sky-600 text-white shadow' 
                                                : 'text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-700'} 
                                            disabled:cursor-not-allowed disabled:bg-slate-600/50 disabled:text-slate-500 disabled:hover:bg-slate-600/50`}
                                    >{vType}</button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-shrink-0 self-start md:self-end mt-4 md:mt-0">
                            <div className='text-right'>
                                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Vch No.</label>
                                 <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 min-w-[60px] text-center font-mono">{voucherNo}</div>
                            </div>
                            <Input label="Date" id="date" name="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    {isInvoiceMode ? (
                        <InvoiceForm 
                            key={formKey}
                            voucherType={voucherType as 'Sale' | 'Purchase' | 'Credit Note' | 'Debit Note'} 
                            setVoucherEntries={setEntries}
                            setParentTransactionType={setTransactionType}
                            existingVoucher={voucherIdToEdit ? companyData?.vouchers.find(v => v.id === voucherIdToEdit) : undefined}
                        />
                    ) : isStockJournalMode ? (
                        <StockJournalForm 
                            key={formKey}
                            setVoucherEntries={setEntries}
                        />
                    ) : (
                        <JournalForm 
                            key={formKey}
                            voucherType={voucherType as 'Payment' | 'Receipt' | 'Journal'}
                            entries={entries} 
                            setEntries={setEntries} 
                            onQuickCreateLedger={handleQuickCreateLedger} 
                        />
                    )}
                </div>
                
                <div><Textarea label="Narration" id="narration" name="narration" value={narration} onChange={e => setNarration(e.target.value)} /></div>
                
                <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-md flex justify-between items-center">
                    <div className="text-sm font-semibold">
                        <div className="flex gap-4">
                            <span className="text-slate-600 dark:text-slate-300">Debit Total: <span className="font-mono text-slate-800 dark:text-white">{debitTotal.toFixed(2)}</span></span>
                            <span className="text-slate-600 dark:text-slate-300">Credit Total: <span className="font-mono text-slate-800 dark:text-white">{creditTotal.toFixed(2)}</span></span>
                        </div>
                    </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${isBalanced ? 'bg-green-500/10 text-green-500 dark:text-green-300' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                        {isBalanced ? 'BALANCED' : 'IMBALANCED'}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={handleDownloadPdf} disabled={!isInvoiceMode}>
                        <PdfIcon className="w-5 h-5 mr-2" />
                        Download PDF
                    </Button>
                    <Button type="submit" disabled={!isBalanced}>
                        <SaveIcon className="w-5 h-5 mr-2" />
                        {voucherIdToEdit ? 'Update Entry' : 'Post Entry'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default PostEntry;