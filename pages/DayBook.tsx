
import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useDateRange } from '../context/DateRangeContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Checkbox from '../components/Checkbox';
import { generateMultiVoucherPDF } from '../utils/pdfGenerator';
import { TrashIcon, PdfIcon, EditIcon, SearchIcon } from '../components/Icon';
import { useModal } from '../context/ModalContext';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { formatDate } from '../utils/exportUtils';

const DayBook: React.FC = () => {
    const navigate = useNavigate();
    const context = useContext(CompanyDataContext);
    const { startDate, endDate, setSelectedFY } = useDateRange();
    const { showModal, hideModal } = useModal();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVoucherIds, setSelectedVoucherIds] = useState<Set<string>>(new Set());
    const [jumpToDate, setJumpToDate] = useState('');

    if (!context) return <div className="text-center p-10">Loading...</div>;

    const { companyData, deleteVoucher } = context;
    if (!companyData) return <div className="text-center p-10">Loading company data...</div>;

    const { vouchers = [], ledgers = [] } = companyData;
    const ledgerNameMap = useMemo(() => new Map(ledgers.map(l => [l.id, l.name])), [ledgers]);

    const filteredVouchers = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let dateFiltered = vouchers
            .filter(v => {
                const vDate = new Date(v.date);
                return vDate >= start && vDate <= end;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.voucherNo - a.voucherNo);
        
        if (jumpToDate) {
            dateFiltered = dateFiltered.filter(v => v.date === jumpToDate);
        }
        
        if (!searchTerm) return dateFiltered;

        const lowercasedFilter = searchTerm.toLowerCase();
        return dateFiltered.filter(v => {
            const hasMatchingLedger = v.entries.some(e => (ledgerNameMap.get(e.ledgerId) || '').toLowerCase().includes(lowercasedFilter));
            const totalAmount = v.entries.find(e => e.type === 'Dr')?.amount.toString() || '0';
            return v.narration?.toLowerCase().includes(lowercasedFilter) || v.voucherNo.toString().includes(lowercasedFilter) || totalAmount.includes(lowercasedFilter) || hasMatchingLedger;
        });
    }, [vouchers, startDate, endDate, searchTerm, jumpToDate, ledgerNameMap]);
    
    const handleJumpToDate = () => {
        if(!jumpToDate) return;
        const date = new Date(jumpToDate);
        const year = date.getFullYear();
        const month = date.getMonth();
        const fyStartYear = month >= 3 ? year : year -1;
        const fyString = `${fyStartYear}-${(fyStartYear+1).toString().slice(2)}`;
        setSelectedFY(fyString);
    };

    const handleToggleSelection = (voucherId: string) => {
        setSelectedVoucherIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(voucherId)) newSet.delete(voucherId);
            else newSet.add(voucherId);
            return newSet;
        });
    };

    const handleToggleSelectAll = () => {
        if (selectedVoucherIds.size === filteredVouchers.length) {
            setSelectedVoucherIds(new Set());
        } else {
            setSelectedVoucherIds(new Set(filteredVouchers.map(v => v.id)));
        }
    };
    
    const handleMultiDownloadPdf = () => {
        const selectedVouchers = vouchers.filter(v => selectedVoucherIds.has(v.id));
        if (selectedVouchers.length > 0 && companyData) {
            generateMultiVoucherPDF(selectedVouchers, companyData);
        }
    };

    const handleEdit = (voucherId: string) => navigate('/post-entry', { state: { voucherId } });

    const handleDelete = (ids: string[]) => {
        const message = ids.length === 1 
            ? `Are you sure you want to delete this voucher?` 
            : `Are you sure you want to delete ${ids.length} selected vouchers?`;
        showModal(
            <ConfirmationDialog title="Delete Voucher(s)" message={message}
                onConfirm={() => { deleteVoucher(ids); setSelectedVoucherIds(new Set()); hideModal(); }}
                onCancel={hideModal} confirmText="Delete" confirmVariant="danger"
            />
        );
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">Day Book</h1>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-72">
                    <Input label="" id="search-daybook" type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="!pl-10"/>
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <div className="flex items-end gap-2">
                    <Input label="Go to Date" id="jump-date" type="date" value={jumpToDate} onChange={e => setJumpToDate(e.target.value)} />
                    <Button onClick={handleJumpToDate} variant="secondary">Go</Button>
                </div>
            </div>

            {selectedVoucherIds.size > 0 && (
                <div className="bg-sky-100 dark:bg-sky-900/50 p-3 rounded-lg mb-6 flex justify-between items-center">
                    <span className="font-semibold text-sky-800 dark:text-sky-200">{selectedVoucherIds.size} voucher(s) selected</span>
                    <div className="flex gap-2">
                        <Button onClick={handleMultiDownloadPdf} variant="secondary"><PdfIcon className="w-5 h-5 mr-2" /> Download Selected</Button>
                        <Button onClick={() => handleDelete(Array.from(selectedVoucherIds))} variant="danger"><TrashIcon className="w-5 h-5 mr-2" /> Delete Selected</Button>
                    </div>
                </div>
            )}
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <Checkbox id="select-all" label="Select All Visible" checked={selectedVoucherIds.size === filteredVouchers.length && filteredVouchers.length > 0} onChange={handleToggleSelectAll} />
                </div>
                {filteredVouchers.length > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredVouchers.map(voucher => (
                            <div key={voucher.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 group flex gap-4">
                                <Checkbox id={`select-${voucher.id}`} label="" checked={selectedVoucherIds.has(voucher.id)} onChange={() => handleToggleSelection(voucher.id)} className="mt-2" />
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start gap-4 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-grow">
                                            <div><span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">Date:</span><p className="text-slate-800 dark:text-slate-200">{formatDate(voucher.date)}</p></div>
                                            <div><span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">Voucher Type:</span><p className="text-sky-600 dark:text-sky-400 font-medium">{voucher.type}</p></div>
                                            <div className="col-span-2 md:col-span-1 md:text-right"><span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">Voucher No:</span><p className="text-slate-700 dark:text-slate-300 font-mono text-lg">{voucher.voucherNo}</p></div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button onClick={() => handleEdit(voucher.id)} variant="secondary" className="!p-2" title="Edit"><EditIcon className="w-5 h-5" /></Button>
                                            <Button onClick={() => handleDelete([voucher.id])} variant="danger" className="!p-2" title="Delete"><TrashIcon className="w-5 h-5" /></Button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto"><table className="w-full text-sm">
                                        <tbody>
                                            {Array.isArray(voucher.entries) && voucher.entries.map((entry, index) => (
                                                <tr key={index}>
                                                    <td className={`py-1 px-2 w-[10%] font-medium ${entry.type === 'Dr' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{entry.type}</td>
                                                    <td className="py-1 px-2 text-slate-800 dark:text-slate-200">{ledgerNameMap.get(entry.ledgerId) || 'Unknown'}</td>
                                                    <td className="py-1 px-2 w-[30%] text-right font-mono text-slate-800 dark:text-slate-200">{(Number(entry.amount) || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table></div>
                                    {voucher.narration && (<div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/80"><p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Narration:</span> {voucher.narration}</p></div>)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10"><h2 className="text-2xl font-bold text-sky-500 dark:text-sky-400 mb-4">No Vouchers Found</h2><p className="text-slate-500 dark:text-slate-400">{searchTerm ? 'Your search returned no results.' : 'No entries were found for the selected period.'}</p></div>
                )}
            </div>
        </div>
    );
};

export default DayBook;
