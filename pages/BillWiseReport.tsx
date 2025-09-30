import React, { useState, useContext, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import Select from '../components/Select';
import Input from '../components/Input';
import Button from '../components/Button';
import { formatDate } from '../utils/exportUtils';
import { SearchIcon } from '../components/Icon';

interface OutstandingBill {
    id: string;
    date: string;
    voucherNo: number;
    amount: number;
    paid: number;
    balance: number;
    dueDate: string;
    overdueDays: number;
}

const BillWiseReport: React.FC = () => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { ledgers, vouchers } = companyData!;
    
    const [partyId, setPartyId] = useState('');
    const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState<OutstandingBill[]>([]);
    const [showReport, setShowReport] = useState(false);
    
    const partyOptions = useMemo(() => {
        return [
            { value: '', label: 'Select Party' },
            ...ledgers
                .filter(l => (l.group === 'Sundry Debtors' || l.group === 'Sundry Creditors') && l.isBillWise)
                .map(l => ({ value: l.id, label: l.name }))
        ];
    }, [ledgers]);
    
    const handleGenerateReport = () => {
        if (!partyId) return;
        
        const partyLedger = ledgers.find(l => l.id === partyId);
        if (!partyLedger) return;

        const reportDate = new Date(asOnDate);
        
        const bills = vouchers.filter(v => 
            (v.type === 'Sale' || v.type === 'Purchase') &&
            new Date(v.date) <= reportDate &&
            v.entries.some(e => e.ledgerId === partyId)
        );

        const settlements = vouchers.filter(v =>
            ['Payment', 'Receipt', 'Credit Note', 'Debit Note'].includes(v.type) &&
            new Date(v.date) <= reportDate &&
            v.entries.some(e => e.ledgerId === partyId)
        );

        const billPayments = new Map<string, number>();
        settlements.forEach(s => {
            s.entries.forEach(e => {
                e.billAllocations?.forEach(alloc => {
                    billPayments.set(alloc.invoiceId, (billPayments.get(alloc.invoiceId) || 0) + alloc.amount);
                });
            });
        });
        
        const outstandingBills: OutstandingBill[] = bills.map(bill => {
            const billAmount = bill.entries.find(e => e.ledgerId === partyId)?.amount || 0;
            const paidAmount = billPayments.get(bill.id) || 0;
            const balance = billAmount - paidAmount;
            
            const creditPeriod = partyLedger.creditPeriod || 0;
            const dueDate = new Date(bill.date);
            dueDate.setDate(dueDate.getDate() + creditPeriod);
            
            const overdueDays = balance > 0.01 ? Math.floor((reportDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)) : 0;

            return {
                id: bill.id,
                date: bill.date,
                voucherNo: bill.voucherNo,
                amount: billAmount,
                paid: paidAmount,
                balance,
                dueDate: dueDate.toISOString().split('T')[0],
                overdueDays: overdueDays > 0 ? overdueDays : 0,
            };
        }).filter(b => b.balance > 0.01);

        setReportData(outstandingBills);
        setShowReport(true);
    };

    const totalOutstanding = useMemo(() => reportData.reduce((sum, bill) => sum + bill.balance, 0), [reportData]);
    
    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">Bill-wise Outstanding Report</h1>

             <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        <Select label="Select Party" id="party" value={partyId} onChange={setPartyId} options={partyOptions} required />
                    </div>
                    <Input label="As on Date" id="asOnDate" type="date" value={asOnDate} onChange={e => setAsOnDate(e.target.value)} />
                    <div className="md:col-start-3">
                       <Button onClick={handleGenerateReport} disabled={!partyId} className="w-full">
                           <SearchIcon className="w-5 h-5 mr-2"/> View Report
                       </Button>
                    </div>
                </div>
            </div>

            {showReport && (
                 <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="p-4">
                        <h2 className="text-xl font-bold text-sky-500 dark:text-sky-400">
                            Outstanding for: {ledgers.find(l => l.id === partyId)?.name}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50">
                                <tr>
                                    <th className="p-3 font-medium">Bill Date</th>
                                    <th className="p-3 font-medium">Bill No.</th>
                                    <th className="p-3 font-medium">Due Date</th>
                                    <th className="p-3 font-medium text-right">Bill Amount</th>
                                    <th className="p-3 font-medium text-right">Received/Paid</th>
                                    <th className="p-3 font-medium text-right">Balance</th>
                                    <th className="p-3 font-medium text-right">Overdue Days</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.length > 0 ? reportData.map(bill => (
                                    <tr key={bill.id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-3">{formatDate(bill.date)}</td>
                                        <td className="p-3">{bill.voucherNo}</td>
                                        <td className="p-3">{formatDate(bill.dueDate)}</td>
                                        <td className="p-3 text-right font-mono">{bill.amount.toFixed(2)}</td>
                                        <td className="p-3 text-right font-mono">{bill.paid.toFixed(2)}</td>
                                        <td className="p-3 text-right font-mono font-bold">{bill.balance.toFixed(2)}</td>
                                        <td className={`p-3 text-right font-mono ${bill.overdueDays > 0 ? 'text-red-500 font-semibold' : ''}`}>{bill.overdueDays}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={7} className="text-center p-8 text-slate-500">No outstanding bills found for this party.</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-100 dark:bg-slate-900/50 font-bold">
                                <tr>
                                    <td colSpan={5} className="p-3 text-slate-800 dark:text-slate-200">Total Outstanding</td>
                                    <td className="p-3 text-right font-mono text-lg">{totalOutstanding.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default BillWiseReport;