

import React, { useState, useContext, useEffect, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import type { Ledger } from '../types';
import { ACCOUNTING_GROUPS } from '../constants/accountingGroups';
import { fetchGstinDetails } from '../utils/gstinApi';
import { COUNTRIES } from '../constants/countries';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import ToggleSwitch from '../components/ToggleSwitch';
import { SaveIcon, TrashIcon, EditIcon, SearchIcon, CheckCircleIcon } from '../components/Icon';
import { useNotifications } from '../context/NotificationContext';
import { useModal } from '../context/ModalContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

const CreateLedger: React.FC = () => {
  const context = useContext(CompanyDataContext);
  const { addNotification } = useNotifications();
  const { showModal, hideModal } = useModal();
  
  const initialLedgerState: Omit<Ledger, 'id'> = {
    name: '', group: '', openingBalance: 0, openingBalanceType: 'Dr',
    registrationType: 'Unregistered', address: '', country: 'India', state: '', pincode: '', gstNo: '', panNo: '', phone: '', email: '',
    creditLimit: 0, contactPersonName: '', contactPersonMobile: '',
    bankAccountNo: '', bankIfscCode: '', bankName: '',
    isBillWise: false, creditPeriod: 0, interestRate: 0, isTcsApplicable: false, currencyId: '', priceListId: ''
  };

  const [ledgerDetails, setLedgerDetails] = useState<Omit<Ledger, 'id'>>(initialLedgerState);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVerifyingGst, setIsVerifyingGst] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  
  if (!context || !context.companyData) return null;
  const { companyData, addLedger, editLedger, deleteLedger } = context;
  const { currencies, priceLists } = companyData;
  
  const countryOptions = useMemo(() => COUNTRIES.map(c => ({ value: c.name, label: c.name })), []);
  const stateOptions = useMemo(() => {
    const selectedCountry = COUNTRIES.find(c => c.name === ledgerDetails.country);
    if (!selectedCountry) return [{ value: '', label: 'Select State' }];
    return [ { value: '', label: 'Select State' }, ...selectedCountry.states.map(s => ({ value: s.name, label: s.name })) ];
  }, [ledgerDetails.country]);
  
  useEffect(() => {
    if (editingLedger) { setLedgerDetails({ ...initialLedgerState, ...editingLedger }); } 
    else { setLedgerDetails(initialLedgerState); }
  }, [editingLedger]);


  const DEBTOR_CREDITOR_GROUPS = ['Sundry Debtors', 'Sundry Creditors'];
  const BANK_GROUPS = ['Bank Accounts', 'Bank OD A/c'];
  const showMailingFields = DEBTOR_CREDITOR_GROUPS.includes(ledgerDetails.group);
  const showBankFields = BANK_GROUPS.includes(ledgerDetails.group);
  const showAdvFields = DEBTOR_CREDITOR_GROUPS.includes(ledgerDetails.group);
  
  const filteredLedgers = useMemo(() => {
    if (!companyData?.ledgers) return [];
    if (!searchTerm) return companyData.ledgers;
    return companyData.ledgers.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.group.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [companyData?.ledgers, searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'gstNo') setGstVerified(false);
    setLedgerDetails(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : (name === 'gstNo' ? value.toUpperCase() : value) }));
  };
  
  const handleSelectChange = (name: keyof Omit<Ledger, 'id'>, value: string) => {
    setLedgerDetails(prev => {
        const newDetails = { ...prev, [name]: value };
        if (name === 'country') newDetails.state = '';
        return newDetails;
    });
  };
  
  const handleToggleChange = (name: 'isBillWise' | 'isTcsApplicable', value: boolean) => {
      setLedgerDetails(prev => ({...prev, [name]: value}));
  }

  const handleGstVerify = async () => {
    const gstin = ledgerDetails.gstNo?.trim();
    if (!gstin || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) { addNotification('Invalid GSTIN format.', 'error'); return; }
    setGstVerified(false); setIsVerifyingGst(true);
    try {
        const data = await fetchGstinDetails(gstin);
        if (data) {
            setLedgerDetails(prev => ({ ...prev, name: data.tradeName || data.legalName, address: data.address, state: data.state, country: 'India', pincode: data.pincode }));
            addNotification('GSTIN details fetched successfully!', 'success'); setGstVerified(true);
        } else { addNotification('GSTIN not found in portal.', 'error'); }
    } catch (error) { addNotification(`Error fetching details: ${(error as Error).message}`, 'error'); } 
    finally { setIsVerifyingGst(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerDetails.name || !ledgerDetails.group) { addNotification('Ledger Name and Group are required.', 'error'); return; }
    if (DEBTOR_CREDITOR_GROUPS.includes(ledgerDetails.group) && (!ledgerDetails.address || !ledgerDetails.registrationType)) { addNotification('Address and Registration Type are required for Sundry Debtors/Creditors.', 'error'); return; }
    
    let success = false;
    if (editingLedger) { success = editLedger(editingLedger.id, ledgerDetails); } 
    else {
        if (companyData?.ledgers.some(l => l.name.toLowerCase() === ledgerDetails.name.toLowerCase())) { addNotification('A ledger with this name already exists.', 'error'); return; }
        success = !!addLedger(ledgerDetails);
    }
    if (success) { setGstVerified(false); setEditingLedger(null); }
  };
  
  const handleEdit = (ledger: Ledger) => { setEditingLedger(ledger); window.scrollTo(0, 0); };
  const cancelEdit = () => { setEditingLedger(null); setGstVerified(false); };
  const handleDelete = (ledger: Ledger) => { showModal( <ConfirmationDialog title="Delete Ledger" message={`Are you sure you want to delete "${ledger.name}"? This action cannot be undone.`} onConfirm={() => { if (editingLedger?.id === ledger.id) cancelEdit(); deleteLedger(ledger.id); hideModal(); }} onCancel={hideModal} confirmText="Delete" confirmVariant="danger" /> ) };

  const groupOptions = useMemo(() => ACCOUNTING_GROUPS.sort().map(g => ({ value: g, label: g })), []);
  const drCrOptions = [{ value: 'Dr', label: 'Dr' }, { value: 'Cr', label: 'Cr' }];
  const currencyOptions = useMemo(() => [{value: '', label: 'Base Currency'}, ...currencies.map(c => ({value: c.id, label: `${c.name} (${c.code})`}))], [currencies]);
  const priceListOptions = useMemo(() => [{value: '', label: 'Not Applicable'}, ...priceLists.map(p => ({value: p.id, label: p.name}))], [priceLists]);

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">{editingLedger ? 'Edit Ledger' : 'Create Ledger'}</h1>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Ledger Name" id="name" name="name" value={ledgerDetails.name} onChange={handleChange} required />
            <Select label="Group" id="group" value={ledgerDetails.group} onChange={(val) => handleSelectChange('group', val)} options={[{value: '', label: 'Select Group'}, ...groupOptions]} required />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Opening Balance" name="openingBalance" type="number" value={ledgerDetails.openingBalance} onChange={handleChange} />
                <Select label="Dr / Cr" id="openingBalanceType" value={ledgerDetails.openingBalanceType} onChange={(val) => handleSelectChange('openingBalanceType', val as 'Dr' | 'Cr')} options={drCrOptions} />
            </div>
          </div>
          {showMailingFields && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6 space-y-6">
                 <h3 className="text-lg font-semibold text-sky-500 dark:text-sky-400">Mailing & Contact Details</h3>
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-400">Registration Type <span className="text-red-500">*</span></label>
                    <div className="flex gap-4">
                        {(['Unregistered', 'Registered'] as const).map(type => (
                            <label key={type} className="flex items-center gap-2 text-slate-800 dark:text-slate-200 cursor-pointer">
                                <input type="radio" name="registrationType" value={type} checked={ledgerDetails.registrationType === type} onChange={() => handleSelectChange('registrationType', type)} className="h-4 w-4 bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-sky-600 focus:ring-sky-500" />
                                {type}
                            </label>
                        ))}
                    </div>
                 </div>
                 {ledgerDetails.registrationType === 'Registered' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-sky-500 dark:text-sky-400">Tax Registration Details</h3>
                        <div>
                            <label htmlFor="gstNo" className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">GSTIN/UIN</label>
                            <div className="flex gap-2 items-start">
                               <div className="relative flex-grow">
                                  <Input label="" id="gstNo" name="gstNo" value={ledgerDetails.gstNo || ''} onChange={handleChange} className="uppercase pr-8" />
                                  {gstVerified && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none" title="GSTIN Verified"><CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400" /></div>}
                               </div>
                                <Button type="button" variant="secondary" onClick={handleGstVerify} disabled={isVerifyingGst} className="mt-1">{isVerifyingGst ? 'Verifying...' : 'Verify'}</Button>
                            </div>
                        </div>
                    </div>
                 )}
                 <Textarea label="Address" name="address" value={ledgerDetails.address || ''} onChange={handleChange} required />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select label="Country" id="ledger-country" value={ledgerDetails.country || ''} onChange={val => handleSelectChange('country', val)} options={countryOptions} />
                    <Select label="State" id="ledger-state" value={ledgerDetails.state || ''} onChange={val => handleSelectChange('state', val)} options={stateOptions} />
                    <Input label="Pincode" name="pincode" value={ledgerDetails.pincode || ''} onChange={handleChange} />
                    <Input label="PAN/IT No." name="panNo" value={ledgerDetails.panNo || ''} onChange={handleChange} />
                    <Input label="Contact Person" name="contactPersonName" value={ledgerDetails.contactPersonName || ''} onChange={handleChange} />
                    <Input label="Contact Mobile" name="contactPersonMobile" value={ledgerDetails.contactPersonMobile || ''} onChange={handleChange} />
                    <Input label="Phone No." name="phone" value={ledgerDetails.phone || ''} onChange={handleChange} />
                    <Input label="Email ID" name="email" type="email" value={ledgerDetails.email || ''} onChange={handleChange} />
                 </div>
            </div>
          )}
          {showBankFields && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6 space-y-6">
                <h3 className="text-lg font-semibold text-sky-500 dark:text-sky-400">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Bank Name" name="bankName" value={ledgerDetails.bankName} onChange={handleChange} />
                    <Input label="Account No." name="bankAccountNo" value={ledgerDetails.bankAccountNo} onChange={handleChange} />
                    <Input label="IFSC Code" name="bankIfscCode" value={ledgerDetails.bankIfscCode} onChange={handleChange} />
                    <Select label="Currency" id="currencyId" value={ledgerDetails.currencyId || ''} onChange={(val) => handleSelectChange('currencyId', val)} options={currencyOptions} />
                </div>
            </div>
          )}
           {showAdvFields && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6 space-y-6">
                    <h3 className="text-lg font-semibold text-sky-500 dark:text-sky-400">Advanced Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Credit Limit" name="creditLimit" type="number" value={ledgerDetails.creditLimit || 0} onChange={handleChange} />
                        <Select label="Price List" id="priceListId" value={ledgerDetails.priceListId || ''} onChange={(val) => handleSelectChange('priceListId', val)} options={priceListOptions} />
                        <Input label="Credit Period (Days)" name="creditPeriod" type="number" value={ledgerDetails.creditPeriod || 0} onChange={handleChange} />
                        <Input label="Interest Rate (% p.a.)" name="interestRate" type="number" value={ledgerDetails.interestRate || 0} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <ToggleSwitch label="Maintain Balances Bill-by-Bill" id="isBillWise" enabled={!!ledgerDetails.isBillWise} onChange={(val) => handleToggleChange('isBillWise', val)} />
                        <ToggleSwitch label="Is TCS Applicable" id="isTcsApplicable" enabled={!!ledgerDetails.isTcsApplicable} onChange={(val) => handleToggleChange('isTcsApplicable', val)} />
                    </div>
                </div>
            )}
          <div className="flex justify-end items-center pt-4 gap-4">
            {editingLedger && <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>}
            <Button type="submit"><SaveIcon className="w-5 h-5 mr-2" />{editingLedger ? 'Update Ledger' : 'Save Ledger'}</Button>
          </div>
        </form>
      </div>
      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Existing Ledgers</h2>
        <div className="relative mb-4">
            <Input label="" id="search-ledger" type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-10 w-full" />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-[55vh] overflow-y-auto">
          {filteredLedgers && filteredLedgers.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredLedgers.map(ledger => {
                 const isUsed = companyData.vouchers.some(v => v.entries.some(e => e.ledgerId === ledger.id));
                 return (
                    <li key={ledger.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{ledger.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{ledger.group}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(ledger)} title="Edit Ledger" className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><EditIcon className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(ledger)} disabled={isUsed} title={isUsed ? "Used in vouchers." : "Delete Ledger"} className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"><TrashIcon className="w-5 h-5" /></button>
                      </div>
                    </li>
                 )
                })}
            </ul>
          ) : ( <p className="text-slate-500 dark:text-slate-400 text-center py-4">No ledgers found.</p> )}
        </div>
      </div>
    </div>
  );
};

export default CreateLedger;
