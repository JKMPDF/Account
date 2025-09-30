

import React, { useContext, useMemo } from 'react';
import type { VoucherEntry, Ledger, VoucherType, BillAllocation } from '../types';
import { CompanyDataContext } from '../context/CompanyDataContext';
import Select from './Select';
import Input from './Input';
import Button from './Button';
import { TrashIcon, CreateIcon, BillWiseIcon } from './Icon';
import { useModal } from '../context/ModalContext';
import BillAllocationModal from './BillAllocationModal';

interface JournalFormProps {
  entries: VoucherEntry[];
  setEntries: (entries: VoucherEntry[]) => void;
  onQuickCreateLedger: (onCreatedCallback: (newLedger: Ledger) => void) => void;
  voucherType: 'Payment' | 'Receipt' | 'Journal';
}

const JournalForm: React.FC<JournalFormProps> = ({ entries, setEntries, onQuickCreateLedger, voucherType }) => {
  const { companyData } = useContext(CompanyDataContext)!;
  const { ledgers } = companyData!;
  const { showModal } = useModal();

  const ledgerOptions = useMemo(() => [
    { value: '', label: 'Select Ledger' },
    ...ledgers.map(l => ({ value: l.id, label: l.name }))
  ], [ledgers]);

  const handleEntryChange = (index: number, field: keyof VoucherEntry, value: any) => {
    const newEntries = [...entries];
    const entry = { ...newEntries[index] };
    (entry as any)[field] = value;
    newEntries[index] = entry;
    setEntries(newEntries);
  };

  const addRow = () => {
    const newEntry: VoucherEntry = {
      id: `new_${Date.now()}`,
      type: 'Dr',
      ledgerId: '',
      amount: 0,
    };
    setEntries([...entries, newEntry]);
  };

  const removeRow = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };
  
  const renderBillAllocationButton = (entry: VoucherEntry, index: number) => {
      if (voucherType !== 'Payment' && voucherType !== 'Receipt') return null;

      const partyLedger = ledgers.find(l => l.id === entry.ledgerId);
      if (!partyLedger || !partyLedger.isBillWise || !['Sundry Debtors', 'Sundry Creditors'].includes(partyLedger.group)) return null;

      // Find the corresponding cash/bank entry to get the amount
      const amountEntry = entries.find(e => {
          const ledger = ledgers.find(l => l.id === e.ledgerId);
          return ledger && ['Bank Accounts', 'Cash-in-hand'].includes(ledger.group);
      });

      if (!amountEntry || amountEntry.amount <= 0) return null;

      const handleSaveAllocations = (allocations: BillAllocation[]) => {
          handleEntryChange(index, 'billAllocations', allocations);
      };

      return (
          <Button
              type="button"
              variant="secondary"
              className="!p-2 mt-1"
              title="Allocate Bills"
              onClick={() => showModal(
                  <BillAllocationModal
                      partyId={entry.ledgerId}
                      voucherType={voucherType}
                      amountToAllocate={amountEntry.amount}
                      existingAllocations={entry.billAllocations}
                      onSave={handleSaveAllocations}
                  />
              )}
          >
              <BillWiseIcon className="w-5 h-5" />
          </Button>
      );
  };

  const drCrOptions = [{ value: 'Dr', label: 'Dr' }, { value: 'Cr', label: 'Cr' }];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-x-4 font-semibold text-slate-500 dark:text-slate-400 px-2 pb-2 border-b border-slate-300 dark:border-slate-600">
        <div className="col-span-1">By/To</div>
        <div className="col-span-6">Particulars</div>
        <div className="col-span-4">Amount</div>
        <div className="col-span-1"></div>
      </div>
      
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={entry.id} className="grid grid-cols-12 gap-x-4 items-start">
            <div className="col-span-1">
              <Select 
                label="" 
                id={`type-${index}`} 
                value={entry.type} 
                onChange={val => handleEntryChange(index, 'type', val as 'Dr' | 'Cr')} 
                options={drCrOptions} 
              />
            </div>
            <div className="col-span-6 flex items-start gap-2">
              <Select 
                label="" 
                id={`ledger-${index}`} 
                value={entry.ledgerId} 
                onChange={val => handleEntryChange(index, 'ledgerId', val)} 
                options={ledgerOptions} 
                className="w-full"
              />
              <Button 
                type="button" 
                variant="secondary" 
                className="!p-2 mt-1" 
                onClick={() => onQuickCreateLedger(newLedger => handleEntryChange(index, 'ledgerId', newLedger.id))}
              >
                <CreateIcon className="w-5 h-5"/>
              </Button>
              {renderBillAllocationButton(entry, index)}
            </div>
            <div className="col-span-4">
              <Input 
                label="" 
                id={`amount-${index}`} 
                type="number" 
                value={entry.amount} 
                onChange={e => handleEntryChange(index, 'amount', parseFloat(e.target.value) || 0)} 
                min="0"
                step="0.01"
              />
            </div>
            <div className="col-span-1 mt-1">
              <Button 
                type="button" 
                variant="danger" 
                onClick={() => removeRow(index)} 
                className="!p-2"
                disabled={entries.length <= 2}
                title={entries.length <= 2 ? "A voucher must have at least two entries" : "Remove entry"}
              >
                <TrashIcon className="w-5 h-5"/>
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <Button type="button" variant="secondary" onClick={addRow} className="mt-2">
        <CreateIcon className="w-5 h-5 mr-2" />Add Row
      </Button>
    </div>
  );
};

export default JournalForm;