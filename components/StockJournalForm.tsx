
import React, { useState, useEffect, useMemo, useContext } from 'react';
import type { VoucherEntry, Ledger, StockItem, Godown } from '../types';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useModal } from '../context/ModalContext';
import Select from './Select';
import Input from './Input';
import Button from './Button';
import { TrashIcon, CreateIcon } from './Icon';
import StockItemQuickCreateForm from './StockItemQuickCreateForm';
import { useNotifications } from '../context/NotificationContext';

interface StockJournalFormProps {
  setVoucherEntries: (entries: VoucherEntry[]) => void;
}

interface JournalItem {
  id: string;
  stockItemId: string;
  sourceGodownId: string;
  destGodownId: string;
  quantity: number;
  rate: number;
  amount: number;
}

const StockJournalForm: React.FC<StockJournalFormProps> = ({ setVoucherEntries }) => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { stockItems, godowns } = companyData!;
    const { showModal } = useModal();
    const { addNotification } = useNotifications();

    const [items, setItems] = useState<JournalItem[]>([
        { id: `item_${Date.now()}`, stockItemId: '', sourceGodownId: '', destGodownId: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    const stockItemOptions = useMemo(() => [
      { value: '', label: 'Select Item' },
      ...stockItems.map(s => ({ value: s.id, label: s.name }))
    ], [stockItems]);

    const godownOptions = useMemo(() => [
      { value: '', label: 'Select Godown' },
      ...godowns.map(g => ({ value: g.id, label: g.name }))
    ], [godowns]);

    const handleItemChange = (index: number, field: keyof JournalItem, value: string | number) => {
        const newItems = [...items];
        const item = { ...newItems[index] };
        (item as any)[field] = value;
        if (field === 'quantity' || field === 'rate') {
            item.amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
        }
        newItems[index] = item;
        setItems(newItems);
    };

    const addItemRow = () => setItems([...items, { id: `item_${Date.now()}`, stockItemId: '', sourceGodownId: '', destGodownId: '', quantity: 1, rate: 0, amount: 0 }]);
    const removeItemRow = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleQuickCreateItem = (callback: (newItem: StockItem) => void) => {
        showModal(<StockItemQuickCreateForm onItemCreated={callback} />);
    };
    
    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);

    useEffect(() => {
        const validItems = items.filter(i => i.stockItemId && i.quantity > 0 && i.sourceGodownId && i.destGodownId && i.sourceGodownId !== i.destGodownId);

        if (validItems.length === 0) {
            setVoucherEntries([]);
            return;
        }

        const timestamp = Date.now();
        
        // Consumption: Items moving OUT of source godown (Credit)
        const consumptionAllocations = validItems.map(i => ({
            stockItemId: i.stockItemId,
            quantity: i.quantity,
            rate: i.rate,
            godownId: i.sourceGodownId
        }));
        
        // Production: Items moving IN to destination godown (Debit)
        const productionAllocations = validItems.map(i => ({
            stockItemId: i.stockItemId,
            quantity: i.quantity,
            rate: i.rate,
            godownId: i.destGodownId
        }));

        const totalValue = validItems.reduce((sum, i) => sum + i.amount, 0);

        const entries: VoucherEntry[] = [
            { id: `sj_entry_${timestamp}_consume`, type: 'Cr', ledgerId: 'STOCK_JOURNAL_ADJUSTMENT', amount: totalValue, inventoryAllocations: consumptionAllocations },
            { id: `sj_entry_${timestamp}_produce`, type: 'Dr', ledgerId: 'STOCK_JOURNAL_ADJUSTMENT', amount: totalValue, inventoryAllocations: productionAllocations }
        ];
        
        setVoucherEntries(entries);

    }, [items, setVoucherEntries]);

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <div className="grid grid-cols-12 gap-x-2 gap-y-1 font-semibold text-slate-500 dark:text-slate-400 px-2 pb-2 text-sm border-b border-slate-300 dark:border-slate-600 min-w-[900px]">
                    <div className="col-span-3">Item</div>
                    <div className="col-span-2">Source Godown</div>
                    <div className="col-span-2">Destination Godown</div>
                    <div className="col-span-1">Quantity</div>
                    <div className="col-span-1">Rate</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-1"></div>
                </div>
                <div className="space-y-2 mt-2 min-w-[900px]">
                    {items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-x-2 gap-y-1 items-start">
                             <div className="col-span-3 flex items-start gap-2">
                                <Select label="" id={`item-${index}`} value={item.stockItemId} onChange={val => handleItemChange(index, 'stockItemId', val)} options={stockItemOptions} className="w-full" />
                                <Button type="button" variant="secondary" className="!p-2 mt-1" onClick={() => handleQuickCreateItem(newItem => handleItemChange(index, 'stockItemId', newItem.id))}><CreateIcon className="w-5 h-5"/></Button>
                            </div>
                            <div className="col-span-2"><Select label="" id={`source-${index}`} value={item.sourceGodownId} onChange={val => handleItemChange(index, 'sourceGodownId', val)} options={godownOptions} /></div>
                            <div className="col-span-2"><Select label="" id={`dest-${index}`} value={item.destGodownId} onChange={val => handleItemChange(index, 'destGodownId', val)} options={godownOptions} /></div>
                            <div className="col-span-1"><Input label="" id={`qty-${index}`} type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} /></div>
                            <div className="col-span-1"><Input label="" id={`rate-${index}`} type="number" value={item.rate} onChange={e => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)} /></div>
                            <div className="col-span-2"><Input label="" id={`amount-${index}`} type="number" value={item.amount.toFixed(2)} readOnly className="bg-slate-200 dark:bg-slate-800" /></div>
                            <div className="col-span-1 mt-1"><Button type="button" variant="danger" onClick={() => removeItemRow(index)} className="!p-2"><TrashIcon className="w-5 h-5"/></Button></div>
                        </div>
                    ))}
                </div>
            </div>
            <Button type="button" variant="secondary" onClick={addItemRow}><CreateIcon className="w-5 h-5 mr-2" />Add Item</Button>
            <div className="text-right font-semibold text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-300 dark:border-slate-700">Total Value: <span className="font-mono">{totalAmount.toFixed(2)}</span></div>
        </div>
    );
};

export default StockJournalForm;
