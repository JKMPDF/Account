import React, { useState, useEffect, useMemo, useContext } from 'react';
import type { Voucher, VoucherEntry, Ledger, StockItem, BatchAllocation } from '../types';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useModal } from '../context/ModalContext';
import Select from './Select';
import Input from './Input';
import Button from './Button';
import { TrashIcon, CreateIcon } from './Icon';
import LedgerQuickCreateForm from './LedgerQuickCreateForm';
import StockItemQuickCreateForm from './StockItemQuickCreateForm';
import BatchSerialModal from './BatchSerialModal';

interface InvoiceFormProps {
  voucherType: 'Sale' | 'Purchase' | 'Credit Note' | 'Debit Note';
  setVoucherEntries: (entries: VoucherEntry[]) => void;
  setParentTransactionType: (type: 'Intra-State' | 'Inter-State') => void;
  existingVoucher?: Voucher;
}

interface InvoiceItem {
  id: string;
  stockItemId: string;
  quantity: number | string;
  rate: number | string;
  amount: number;
  gstRate: number;
  batches?: BatchAllocation[];
  serialNumbers?: string[];
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ voucherType, setVoucherEntries, setParentTransactionType, existingVoucher }) => {
  const { companyData } = useContext(CompanyDataContext)!;
  const { ledgers, stockItems, priceLists } = companyData!;
  const { showModal } = useModal();
  
  const [partyLedgerId, setPartyLedgerId] = useState('');
  const [partyDetails, setPartyDetails] = useState<Ledger | null>(null);
  const [mainLedgerId, setMainLedgerId] = useState('');
  const [transactionType, setTransactionType] = useState<'Intra-State' | 'Inter-State'>('Intra-State');
  const [items, setItems] = useState<InvoiceItem[]>([{ id: `item_${Date.now()}`, stockItemId: '', quantity: '', rate: '', amount: 0, gstRate: 0 }]);

  // Determine party and main ledger groups based on voucher type
  const isSaleSide = useMemo(() => voucherType === 'Sale' || voucherType === 'Credit Note', [voucherType]);
  const isReturn = useMemo(() => voucherType === 'Credit Note' || voucherType === 'Debit Note', [voucherType]);

  const partyLedgerOptions = useMemo(() => {
    const partyLedgers = ledgers.filter(l => ['Sundry Debtors', 'Sundry Creditors', 'Bank Accounts', 'Cash-in-hand'].includes(l.group));
    return [
        { value: '', label: 'Select Party' },
        ...partyLedgers.map(l => ({ value: l.id, label: l.name }))
    ];
  }, [ledgers]);
  
  const mainLedgerGroup = isSaleSide ? 'Sales Accounts' : 'Purchase Accounts';
  const mainLedgerLabel = isSaleSide ? (isReturn ? 'Sales Return In' : 'Sales Ledger') : (isReturn ? 'Purchase Return Out' : 'Purchase Ledger');


  const mainLedgerOptions = useMemo(() => [
      { value: '', label: 'Select Ledger' },
      ...ledgers.filter(l => l.group === mainLedgerGroup).map(l => ({ value: l.id, label: l.name }))
  ], [ledgers, mainLedgerGroup]);

  const stockItemOptions = useMemo(() => [
    { value: '', label: 'Select Item' },
    ...stockItems.map(s => ({ value: s.id, label: s.name }))
  ], [stockItems]);
  
  // Populate form if editing
  useEffect(() => {
    if (existingVoucher) {
      const partyEntry = existingVoucher.entries.find(e => ['Sundry Debtors', 'Sundry Creditors', 'Bank Accounts', 'Cash-in-hand'].includes(ledgers.find(l => l.id === e.ledgerId)?.group || ''));
      const mainEntry = existingVoucher.entries.find(e => ledgers.find(l => l.id === e.ledgerId)?.group === mainLedgerGroup);
      
      setPartyLedgerId(partyEntry?.ledgerId || '');
      setMainLedgerId(mainEntry?.ledgerId || '');
      setTransactionType(existingVoucher.transactionType || 'Intra-State');
      
      if (mainEntry?.inventoryAllocations) {
        setItems(mainEntry.inventoryAllocations.map(alloc => {
            const stock = stockItems.find(s => s.id === alloc.stockItemId);
            return {
                id: `item_${Math.random()}`,
                ...alloc,
                quantity: alloc.quantity,
                rate: alloc.rate,
                amount: alloc.quantity * alloc.rate,
                gstRate: stock?.gstRate || 0,
            }
        }));
      }
    }
  }, [existingVoucher, ledgers, mainLedgerGroup, stockItems]);
  
  // Auto-detect transaction type and fetch party details
  useEffect(() => {
      const party = ledgers.find(l => l.id === partyLedgerId);
      setPartyDetails(party || null);

      if (party && party.state && companyData?.details.state && typeof companyData.details.state === 'string' && party.state.trim()) {
          if (party.state.toLowerCase() !== companyData.details.state.toLowerCase()) {
              setTransactionType('Inter-State');
          } else {
              setTransactionType('Intra-State');
          }
      }
  }, [partyLedgerId, ledgers, companyData?.details.state]);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    (item as any)[field] = value;
    
    if (field === 'stockItemId') {
      const stock = stockItems.find(s => s.id === value);
      item.gstRate = stock?.gstRate || 0;
      item.rate = ''; // Reset rate on item change

      // Price List logic
      if (partyDetails?.priceListId) {
          const priceList = priceLists.find(p => p.id === partyDetails.priceListId);
          if (priceList && priceList.itemRates[value]) {
              item.rate = priceList.itemRates[value];
          }
      }

      if (item.quantity === '' && value) item.quantity = 1;
    }

    const quantity = parseFloat(String(item.quantity)) || 0;
    const rate = parseFloat(String(item.rate)) || 0;
    item.amount = quantity * rate;
    
    newItems[index] = item;
    setItems(newItems);
  };
  
  const addItemRow = () => setItems([...items, { id: `item_${Date.now()}`, stockItemId: '', quantity: '', rate: '', amount: 0, gstRate: 0 }]);
  const removeItemRow = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleQuickCreateLedger = (callback: (newLedger: Ledger) => void) => {
    showModal(<LedgerQuickCreateForm onLedgerCreated={callback} />);
  };
  
  const handleQuickCreateItem = (callback: (newItem: StockItem) => void) => {
    showModal(<StockItemQuickCreateForm onItemCreated={callback} />);
  };
  
  const openBatchSerialModal = (index: number) => {
      const item = items[index];
      const stockItem = stockItems.find(s => s.id === item.stockItemId);
      if (!stockItem || Number(item.quantity) <= 0) return;

      showModal(
        <BatchSerialModal
            stockItem={stockItem}
            quantity={Number(item.quantity)}
            existingAllocations={stockItem.isBatchTracked ? item.batches : item.serialNumbers}
            onSave={(allocations) => {
                if(stockItem.isBatchTracked) {
                    handleItemChange(index, 'batches', allocations);
                } else {
                    handleItemChange(index, 'serialNumbers', allocations);
                }
            }}
        />
      );
  };

  const totals = useMemo(() => {
    const subTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const taxSummaryByRate: Record<number, { taxable: number; cgst: number; sgst: number; igst: number }> = {};

    items.forEach(item => {
      const amount = Number(item.amount) || 0;
      if (item.gstRate > 0 && amount > 0) {
        if (!taxSummaryByRate[item.gstRate]) {
          taxSummaryByRate[item.gstRate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        }
        taxSummaryByRate[item.gstRate].taxable += amount;
      }
    });
    
    let totalCgst = 0, totalSgst = 0, totalIgst = 0;

    if (companyData?.details.gstApplicable) {
        Object.entries(taxSummaryByRate).forEach(([rateStr, summary]) => {
            const rate = parseFloat(rateStr);
            if (transactionType === 'Intra-State') {
                const cgst = summary.taxable * (rate / 2 / 100);
                const sgst = cgst;
                summary.cgst = cgst;
                summary.sgst = sgst;
                totalCgst += cgst;
                totalSgst += sgst;
            } else { // Inter-State
                const igst = summary.taxable * (rate / 100);
                summary.igst = igst;
                totalIgst += igst;
            }
        });
    }

    const grandTotal = subTotal + totalCgst + totalSgst + totalIgst;
    
    return { 
      subTotal, 
      cgst: totalCgst, 
      sgst: totalSgst, 
      igst: totalIgst, 
      grandTotal, 
      taxSummaryByRate 
    };
  }, [items, transactionType, companyData?.details.gstApplicable]);


  useEffect(() => {
    setParentTransactionType(transactionType);
    
    const findTaxLedger = (name: string) => ledgers.find(l => l.name.toLowerCase() === name.toLowerCase() && l.group === 'Duties & Taxes');
    const cgstLedger = findTaxLedger('cgst');
    const sgstLedger = findTaxLedger('sgst');
    const igstLedger = findTaxLedger('igst');

    if (!partyLedgerId || !mainLedgerId || totals.grandTotal <= 0) {
        setVoucherEntries([]); return;
    }

    const partyEntryType = (voucherType === 'Sale' || voucherType === 'Debit Note') ? 'Dr' : 'Cr';
    const mainEntryType = partyEntryType === 'Dr' ? 'Cr' : 'Dr';
    const timestamp = Date.now();
    
    let entries: VoucherEntry[] = [
      // Main ledger entry (Sales/Purchase)
      { id: `inv_entry_${timestamp}_main`, type: mainEntryType, ledgerId: mainLedgerId, amount: totals.subTotal,
        inventoryAllocations: items.filter(i => i.stockItemId && Number(i.quantity) > 0).map(i => ({ stockItemId: i.stockItemId, quantity: Number(i.quantity), rate: Number(i.rate), batches: i.batches, serialNumbers: i.serialNumbers }))
      }
    ];
    
    // Tax entries
    if (totals.cgst > 0 && cgstLedger) entries.push({ id: `inv_entry_${timestamp}_cgst`, type: mainEntryType, ledgerId: cgstLedger.id, amount: totals.cgst });
    if (totals.sgst > 0 && sgstLedger) entries.push({ id: `inv_entry_${timestamp}_sgst`, type: mainEntryType, ledgerId: sgstLedger.id, amount: totals.sgst });
    if (totals.igst > 0 && igstLedger) entries.push({ id: `inv_entry_${timestamp}_igst`, type: mainEntryType, ledgerId: igstLedger.id, amount: totals.igst });
    
    // Party entry - should be the last one calculated to ensure balance
    const totalCreditOrDebitForMain = entries.reduce((sum, entry) => sum + entry.amount, 0);
    entries.unshift({ id: `inv_entry_${timestamp}_party`, type: partyEntryType, ledgerId: partyLedgerId, amount: totalCreditOrDebitForMain });
    
    setVoucherEntries(entries);

  }, [partyLedgerId, mainLedgerId, items, totals, transactionType, voucherType, ledgers, setVoucherEntries, setParentTransactionType]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-end gap-2">
            <Select label="Party Account" id="partyLedger" value={partyLedgerId} onChange={setPartyLedgerId} options={partyLedgerOptions} required className="flex-grow" />
            <Button type="button" variant="secondary" className="!p-2" onClick={() => handleQuickCreateLedger((newLedger) => setPartyLedgerId(newLedger.id))}>
                <CreateIcon className="w-5 h-5"/>
            </Button>
        </div>
        <div className="flex items-end gap-4">
            <div className="flex items-end gap-2 flex-grow">
                <Select label={mainLedgerLabel} id="mainLedger" value={mainLedgerId} onChange={setMainLedgerId} options={mainLedgerOptions} required className="flex-grow"/>
                <Button type="button" variant="secondary" className="!p-2" onClick={() => handleQuickCreateLedger((newLedger) => setMainLedgerId(newLedger.id))}>
                    <CreateIcon className="w-5 h-5"/>
                </Button>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Transaction Type</label>
                <div className="px-3 py-2 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 font-medium text-center">
                    {transactionType}
                </div>
            </div>
        </div>
        {partyDetails?.address && (
            <div className="md:col-span-2 mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 p-2 rounded-md border border-slate-300 dark:border-slate-600">
                <p className="font-semibold">{partyDetails.name} ({partyDetails.state})</p>
                {partyDetails.gstNo && <p className="font-semibold mt-1">GSTIN: {partyDetails.gstNo}</p>}
            </div>
        )}
      </div>

      <div>
        <div className="overflow-x-auto">
            <div className="grid grid-cols-12 gap-2 font-semibold text-slate-500 dark:text-slate-400 px-2 pb-2 border-b border-slate-300 dark:border-slate-600 text-sm min-w-[700px]">
                <div className="col-span-4">Item</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2 text-right">GST</div>
                <div className="col-span-1"></div>
            </div>
            <div className="space-y-2 mt-2 min-w-[700px]">
                {items.map((item, index) => {
                    const stockItem = stockItems.find(s => s.id === item.stockItemId);
                    const showBatchSerialButton = stockItem && (stockItem.isBatchTracked || stockItem.isSerialTracked);
                    return (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                            <div className="col-span-4 flex items-start gap-2">
                                <Select label="" id={`item-${index}`} value={item.stockItemId} onChange={val => handleItemChange(index, 'stockItemId', val)} options={stockItemOptions} className="flex-grow" />
                                <Button type="button" variant="secondary" className="!p-2 mt-1" onClick={() => handleQuickCreateItem(newItem => handleItemChange(index, 'stockItemId', newItem.id))}>
                                    <CreateIcon className="w-5 h-5"/>
                                </Button>
                            </div>
                            <div className="col-span-1">
                                <Input label="" id={`qty-${index}`} type="text" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="text-right" placeholder="0" />
                                {showBatchSerialButton && (
                                    <Button type="button" onClick={() => openBatchSerialModal(index)} className="!p-1 !text-xs w-full mt-1">
                                        {stockItem.isBatchTracked ? 'Batches' : 'Serials'}
                                    </Button>
                                )}
                            </div>
                            <div className="col-span-2"><Input label="" id={`rate-${index}`} type="text" value={item.rate} onChange={e => handleItemChange(index, 'rate', e.target.value)} className="text-right" placeholder="0.00" /></div>
                            <div className="col-span-2"><Input label="" id={`amount-${index}`} type="number" value={item.amount.toFixed(2)} readOnly className="bg-slate-100 dark:bg-slate-800 text-right" /></div>
                            <div className="col-span-2"><Input label="" id={`gst-${index}`} type="text" value={`${item.gstRate}% | ${(item.amount * item.gstRate / 100).toFixed(2)}`} readOnly className="bg-slate-100 dark:bg-slate-800 text-right text-xs" /></div>
                            <div className="col-span-1 mt-1"><Button type="button" variant="danger" onClick={() => removeItemRow(index)} className="!p-2"><TrashIcon className="w-5 h-5"/></Button></div>
                        </div>
                    )
                })}
            </div>
        </div>
        <Button type="button" variant="secondary" onClick={addItemRow} className="mt-4"><CreateIcon className="w-5 h-5 mr-2" />Add Item</Button>
      </div>
      
      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-end">
          <div className="w-full max-w-md bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                <span>Subtotal:</span>
                <span className="font-mono">{totals.subTotal.toFixed(2)}</span>
            </div>

            {companyData?.details.gstApplicable && Object.keys(totals.taxSummaryByRate).length > 0 && (
                <div className="text-xs border-t border-b border-slate-200 dark:border-slate-700 py-2 space-y-1">
                    <div className={`grid ${transactionType === 'Intra-State' ? 'grid-cols-4' : 'grid-cols-3'} font-bold text-slate-500 dark:text-slate-400 gap-2`}>
                        <div className="text-left">Rate</div>
                        <div className="text-right">Taxable</div>
                        <div className="text-right">{transactionType === 'Intra-State' ? 'CGST' : 'IGST'}</div>
                        {transactionType === 'Intra-State' && <div className="text-right">SGST</div>}
                    </div>
                    {Object.entries(totals.taxSummaryByRate).map(([rate, summary]) => (
                        <div key={rate} className={`grid ${transactionType === 'Intra-State' ? 'grid-cols-4' : 'grid-cols-3'} font-mono text-slate-700 dark:text-slate-300 gap-2`}>
                            <div className="text-left">{rate}%</div>
                            <div className="text-right">{summary.taxable.toFixed(2)}</div>
                            <div className="text-right">{transactionType === 'Intra-State' ? summary.cgst.toFixed(2) : summary.igst.toFixed(2)}</div>
                            {transactionType === 'Intra-State' && <div className="text-right">{summary.sgst.toFixed(2)}</div>}
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {companyData?.details.gstApplicable && transactionType === 'Intra-State' && (
                    <>
                        <div className="flex justify-between"><span>Total CGST:</span> <span className="font-mono">{totals.cgst.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Total SGST:</span> <span className="font-mono">{totals.sgst.toFixed(2)}</span></div>
                    </>
                )}
                {companyData?.details.gstApplicable && transactionType === 'Inter-State' && (
                    <div className="flex justify-between"><span>Total IGST:</span> <span className="font-mono">{totals.igst.toFixed(2)}</span></div>
                )}
            </div>
            
            <div className="flex justify-between text-lg font-bold border-t border-slate-300 dark:border-slate-600 pt-2 text-sky-600 dark:text-sky-400">
                <span>Grand Total:</span>
                <span className="font-mono">{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;