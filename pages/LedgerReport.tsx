import React, { useState, useContext, useMemo, useEffect } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useDateRange } from '../context/DateRangeContext';
import { calculateLedgerBalancesForPeriod } from '../utils/accounting';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import { SearchIcon, PdfIcon, ExcelIcon } from '../components/Icon';
import Checkbox from '../components/Checkbox';
import type { Ledger } from '../types';
import { generateAdvancedLedgerReportPDF } from '../utils/pdfGenerator';
import { generateCSV, formatDate } from '../utils/exportUtils';

interface ReportRow {
    date: string;
    particulars: string;
    voucherType: string;
    voucherNo: number;
    debit: number;
    credit: number;
    balance: number;
    // Advanced columns
    partyName?: string;
    partyGstin?: string;
    taxableAmount?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    totalValue?: number;
}

const BASE_COLUMNS = [
    { id: 'date', label: 'Date' }, { id: 'particulars', label: 'Particulars' }, { id: 'voucherType', label: 'Vch Type' },
    { id: 'voucherNo', label: 'Vch No' }, { id: 'debit', label: 'Debit' }, { id: 'credit', label: 'Credit' }, { id: 'balance', label: 'Balance' }
];

const ADVANCED_COLUMNS: Record<string, { id: keyof ReportRow, label: string }[]> = {
    'Sales Accounts': [
        { id: 'partyName', label: 'Party Name' }, { id: 'partyGstin', label: 'Party GSTIN' },
        { id: 'taxableAmount', label: 'Taxable Amt' }, { id: 'cgst', label: 'CGST' }, { id: 'sgst', label: 'SGST' },
        { id: 'igst', label: 'IGST' }, { id: 'totalValue', label: 'Total Value' }
    ],
    'Purchase Accounts': [
        { id: 'partyName', label: 'Party Name' }, { id: 'partyGstin', label: 'Party GSTIN' },
        { id: 'taxableAmount', label: 'Taxable Amt' }, { id: 'cgst', label: 'CGST' }, { id: 'sgst', label: 'SGST' },
        { id: 'igst', label: 'IGST' }, { id: 'totalValue', label: 'Total Value' }
    ],
};

const LedgerReport: React.FC = () => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { startDate, endDate } = useDateRange();
    
    const { ledgers = [], vouchers = [] } = companyData!;

    const [selectedLedgerId, setSelectedLedgerId] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>(startDate);
    const [toDate, setToDate] = useState<string>(endDate);
    const [reportData, setReportData] = useState<ReportRow[]>([]);
    const [openingBalance, setOpeningBalance] = useState<number>(0);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [availableColumns, setAvailableColumns] = useState(BASE_COLUMNS);
    const [selectedColumns, setSelectedColumns] = useState<string[]>(BASE_COLUMNS.map(c => c.id));
    
    const ledgerMap = useMemo(() => new Map(ledgers.map(l => [l.id, l])), [ledgers]);
    const taxLedgerIds = useMemo(() => ({
        cgst: ledgers.find(l => l.name.toLowerCase() === 'cgst' && l.group === 'Duties & Taxes')?.id,
        sgst: ledgers.find(l => l.name.toLowerCase() === 'sgst' && l.group === 'Duties & Taxes')?.id,
        igst: ledgers.find(l => l.name.toLowerCase() === 'igst' && l.group === 'Duties & Taxes')?.id,
    }), [ledgers]);

    useEffect(() => {
        setFromDate(startDate);
        setToDate(endDate);
        setShowReport(false);
    }, [startDate, endDate, selectedLedgerId]);

    useEffect(() => {
        const ledger = ledgers.find(l => l.id === selectedLedgerId);
        const advanced = ledger ? ADVANCED_COLUMNS[ledger.group] || [] : [];
        setAvailableColumns([...BASE_COLUMNS, ...advanced]);
        setSelectedColumns([...BASE_COLUMNS.map(c => c.id), ...advanced.map(c => c.id)]);
    }, [selectedLedgerId, ledgers]);

    const handleGenerateReport = () => {
        if (!selectedLedgerId) return;
        
        const selectedLedger = ledgerMap.get(selectedLedgerId);
        if (!selectedLedger) return;

        const { openingBalances } = calculateLedgerBalancesForPeriod(ledgers, vouchers, fromDate, new Date().toISOString());
        const ob = openingBalances.get(selectedLedgerId) || 0;
        setOpeningBalance(ob);

        const start = new Date(fromDate);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999); // Include the entire end day

        const filteredVouchers = vouchers
            .filter(v => {
                const voucherDate = new Date(v.date);
                return voucherDate >= start && voucherDate <= end && v.entries.some(e => e.ledgerId === selectedLedgerId);
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = ob;
        const rows: ReportRow[] = [];
        
        filteredVouchers.forEach(v => {
            const relevantEntry = v.entries.find(e => e.ledgerId === selectedLedgerId);
            if (!relevantEntry) return;

            const debit = relevantEntry.type === 'Dr' ? relevantEntry.amount : 0;
            const credit = relevantEntry.type === 'Cr' ? relevantEntry.amount : 0;
            runningBalance += (debit - credit);
            
            const otherLedgerEntry = v.entries.find(other => other.ledgerId !== selectedLedgerId);
            const particulars = ledgerMap.get(otherLedgerEntry?.ledgerId || '')?.name || v.narration || v.type;
            
            const newRow: ReportRow = {
                date: v.date, particulars, voucherType: v.type, voucherNo: v.voucherNo,
                debit, credit, balance: runningBalance
            };

            if (ADVANCED_COLUMNS[selectedLedger.group]) {
                const partyEntry = v.entries.find(e => ['Sundry Debtors', 'Sundry Creditors'].includes(ledgerMap.get(e.ledgerId)?.group || ''));
                if (partyEntry) {
                    const partyLedger = ledgerMap.get(partyEntry.ledgerId);
                    newRow.partyName = partyLedger?.name;
                    newRow.partyGstin = partyLedger?.gstNo;
                    newRow.totalValue = partyEntry.amount;
                }
                newRow.taxableAmount = relevantEntry.amount;
                newRow.cgst = v.entries.find(e => e.ledgerId === taxLedgerIds.cgst)?.amount || 0;
                newRow.sgst = v.entries.find(e => e.ledgerId === taxLedgerIds.sgst)?.amount || 0;
                newRow.igst = v.entries.find(e => e.ledgerId === taxLedgerIds.igst)?.amount || 0;
            }

            rows.push(newRow);
        });

        setReportData(rows);
        setShowReport(true);
    };
    
    const handleColumnToggle = (columnId: string) => {
        setSelectedColumns(prev => 
            prev.includes(columnId) ? prev.filter(id => id !== columnId) : [...prev, columnId]
        );
    };

    const handleExport = (format: 'pdf' | 'csv') => {
        const ledger = ledgers.find(l => l.id === selectedLedgerId);
        if (!ledger || !companyData) return;
        
        const headers = availableColumns.filter(c => selectedColumns.includes(c.id));
        const dataToExport = reportData.map(row => {
            const rowData: Record<string, any> = {};
            headers.forEach(h => {
                rowData[h.label] = (row as any)[h.id];
            });
            return rowData;
        });

        if (format === 'pdf') {
            generateAdvancedLedgerReportPDF(ledger, reportData, headers, openingBalance, fromDate, toDate, companyData);
        } else {
            const csvHeaders = headers.map(h => h.label);
            const csvData = reportData.map(row => headers.map(h => (row as any)[h.id] ?? ''));
            generateCSV(csvHeaders, csvData, `Ledger_${ledger.name.replace(/ /g, '_')}`);
        }
    };


    const closingBalance = reportData.length > 0 ? reportData[reportData.length - 1].balance : openingBalance;
    const ledgerOptions = useMemo(() => [
        { value: '', label: '-- Select a Ledger --'},
        ...ledgers.map(l => ({ value: l.id, label: l.name }))
    ], [ledgers]);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-100 mb-6">Ledger Report</h1>
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <Select label="Select Ledger" id="ledger" value={selectedLedgerId} onChange={setSelectedLedgerId} options={ledgerOptions} required />
                    </div>
                    <Input label="From Date" id="fromDate" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <Input label="To Date" id="toDate" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                    <div className="md:col-start-4">
                       <Button onClick={handleGenerateReport} disabled={!selectedLedgerId} className="w-full">
                           <SearchIcon className="w-5 h-5 mr-2"/> View Report
                       </Button>
                    </div>
                </div>
            </div>

            {showReport && (
                <div>
                    <div className="bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-700 mb-6">
                        <h3 className="text-lg font-semibold text-slate-200 mb-3">Report Options</h3>
                        <div className="mb-4">
                            <p className="text-sm font-medium text-slate-400 mb-2">Select Columns:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {availableColumns.map(col => (
                                    <Checkbox 
                                        key={col.id}
                                        id={`col-${col.id}`}
                                        label={col.label}
                                        checked={selectedColumns.includes(col.id)}
                                        onChange={() => handleColumnToggle(col.id)}
                                    />
                                ))}
                            </div>
                        </div>
                         <div className="flex justify-end gap-4 border-t border-slate-700 pt-4">
                            <Button onClick={() => handleExport('csv')} variant="secondary">
                                <ExcelIcon className="w-5 h-5 mr-2" /> Export to Excel
                            </Button>
                            <Button onClick={() => handleExport('pdf')} variant="secondary">
                                <PdfIcon className="w-5 h-5 mr-2" /> Export to PDF
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                        <h2 className="text-xl font-bold text-sky-300">Statement for: {ledgers.find(l => l.id === selectedLedgerId)?.name}</h2>
                    </div>
                    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-700">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-slate-400 bg-slate-900/50">
                                    <tr>
                                        {availableColumns.filter(c => selectedColumns.includes(c.id)).map(col => (
                                            <th key={col.id} className="p-3 font-medium">{col.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-700">
                                        <td colSpan={selectedColumns.includes('balance') ? selectedColumns.indexOf('balance') : selectedColumns.length} className="p-3 font-bold text-slate-300">Opening Balance</td>
                                        {selectedColumns.includes('balance') && <td className="p-3 text-right font-bold font-mono text-slate-300">{Math.abs(openingBalance).toFixed(2)} {openingBalance >= 0 ? 'Dr' : 'Cr'}</td>}
                                    </tr>
                                    {reportData.map((row, i) => (
                                        <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                            {availableColumns.filter(c => selectedColumns.includes(c.id)).map(col => {
                                                let value = (row as any)[col.id];
                                                if (typeof value === 'number') value = value.toFixed(2);
                                                if (col.id === 'balance') value = `${Math.abs(row.balance).toFixed(2)} ${row.balance >= 0 ? 'Dr' : 'Cr'}`;
                                                if (col.id === 'date') value = formatDate(value);
                                                return <td key={col.id} className="p-3 font-mono">{value}</td>
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-900/50 font-bold">
                                    <tr>
                                        <td colSpan={selectedColumns.includes('balance') ? selectedColumns.indexOf('balance') : selectedColumns.length} className="p-3 text-slate-300">Closing Balance</td>
                                        {selectedColumns.includes('balance') && <td className="p-3 text-right font-mono text-slate-200">{Math.abs(closingBalance).toFixed(2)} {closingBalance >= 0 ? 'Dr' : 'Cr'}</td>}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LedgerReport;
