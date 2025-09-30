import React, { useState, useContext, useMemo, useEffect } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useModal } from '../context/ModalContext';
import type { Voucher, BillAllocation } from '../types';
import Button from './Button';
import Input from './Input';
import { formatDate } from '../utils/exportUtils';
import { SaveIcon } from './Icon';

interface OutstandingBill {
    id: string;
    date: string;
    voucherNo: number;
    amount: number;
    balance: number;
}

interface BillAllocationModalProps {
    partyId: string;
    voucherType: 'Payment' | 'Receipt';
    amountToAllocate: number;
    existingAllocations?: BillAllocation[];
    onSave: (allocations: BillAllocation[]) => void;
}

const BillAllocationModal: React.FC<BillAllocationModalProps> = ({ partyId, voucherType, amountToAllocate, existingAllocations, onSave }) => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { vouchers } = companyData!;
    const { hideModal } = useModal();

    const [allocations, setAllocations] = useState<Record<string, number | string>>({});

    const outstandingBills = useMemo<OutstandingBill[]>(() => {
        const billVoucherType = voucherType === 'Payment' ? 'Purchase' : 'Sale';

        const bills = vouchers.filter(v =>
            v.type === billVoucherType && v.entries.some(e => e.ledgerId === partyId)
        );

        const settlements = vouchers.filter(v =>
            ['Payment', 'Receipt', 'Credit Note', 'Debit Note'].includes(v.type) && v.entries.some(e => e.ledgerId === partyId)
        );

        const billPayments = new Map<string, number>();
        settlements.forEach(s => {
            s.entries.forEach(e => {
                e.billAllocations?.forEach(alloc => {
                    billPayments.set(alloc.invoiceId, (billPayments.get(alloc.invoiceId) || 0) + alloc.amount);
                });
            });
        });

        return bills.map(bill => {
            const billAmount = bill.entries.find(e => e.ledgerId === partyId)?.amount || 0;
            const paidAmount = billPayments.get(bill.id) || 0;
            const balance = billAmount - paidAmount;
            return {
                id: bill.id,
                date: bill.date,
                voucherNo: bill.voucherNo,
                amount: billAmount,
                balance,
            };
        }).filter(b => b.balance > 0.01);
    }, [partyId, voucherType, vouchers]);

    useEffect(() => {
        if (existingAllocations) {
            const initialAllocs = Object.fromEntries(existingAllocations.map(a => [a.invoiceId, a.amount]));
            setAllocations(initialAllocs);
        }
    }, [existingAllocations]);
    
    const handleAllocationChange = (billId: string, value: string) => {
        setAllocations(prev => ({...prev, [billId]: value}));
    };
    
    const totalAllocated = useMemo(() => {
        // FIX: Cast amount to a number before adding. The value can be a string from the input state.
        return Object.values(allocations).reduce((sum, amount) => sum + Number(amount || 0), 0);
    }, [allocations]);

    const remainingToAllocate = amountToAllocate - totalAllocated;

    const handleSave = () => {
        if (totalAllocated > amountToAllocate) {
            alert('Total allocated amount cannot exceed the voucher amount.');
            return;
        }

        const finalAllocations: BillAllocation[] = Object.entries(allocations)
            .map(([invoiceId, amount]) => ({ invoiceId, amount: parseFloat(String(amount)) || 0}))
            .filter(a => a.amount > 0);
            
        onSave(finalAllocations);
        hideModal();
    };

    return (
        <div className="p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Bill-wise Settlement</h3>
            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg mb-4 text-sm">
                <div className="flex justify-between font-semibold">
                    <span>Amount to Allocate:</span>
                    <span className="font-mono">{amountToAllocate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Total Allocated:</span>
                    <span className="font-mono">{totalAllocated.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between font-semibold ${remainingToAllocate < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    <span>Remaining:</span>
                    <span className="font-mono">{remainingToAllocate.toFixed(2)}</span>
                </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                <div className="grid grid-cols-4 gap-2 font-semibold text-xs text-slate-500 dark:text-slate-400 border-b pb-1">
                    <span>Bill Date</span>
                    <span>Bill No.</span>
                    <span className="text-right">Balance</span>
                    <span className="text-right">Allocation</span>
                </div>
                {outstandingBills.length > 0 ? outstandingBills.map(bill => (
                    <div key={bill.id} className="grid grid-cols-4 gap-2 items-center text-sm">
                        <span>{formatDate(bill.date)}</span>
                        <span>{bill.voucherNo}</span>
                        <span className="text-right font-mono">{bill.balance.toFixed(2)}</span>
                        <Input 
                            label=""
                            id={`alloc-${bill.id}`}
                            type="text"
                            value={allocations[bill.id] || ''}
                            onChange={e => handleAllocationChange(bill.id, e.target.value)}
                            className="text-right"
                        />
                    </div>
                )) : (
                    <p className="text-center text-slate-500 py-4">No outstanding bills found for this party.</p>
                )}
            </div>
            
            <div className="mt-6 flex justify-end gap-4">
                <Button variant="secondary" onClick={hideModal}>Cancel</Button>
                <Button onClick={handleSave}><SaveIcon className="w-5 h-5 mr-2" /> Save Allocation</Button>
            </div>
        </div>
    );
};

export default BillAllocationModal;