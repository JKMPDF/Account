import React, { useState, useContext } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { PriceList } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import { SaveIcon, TrashIcon, CreateIcon } from '../components/Icon';
import { useNotifications } from '../context/NotificationContext';
import { useModal } from '../context/ModalContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

const PriceLists: React.FC = () => {
    const context = useContext(CompanyDataContext);
    const { addNotification } = useNotifications();
    const { showModal, hideModal } = useModal();
    
    if (!context || !context.companyData) return null;
    const { companyData, addPriceList, editPriceList, deletePriceList } = context;
    const { priceLists, stockItems } = companyData;
    
    const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
    const [newPriceListName, setNewPriceListName] = useState('');
    const [itemRates, setItemRates] = useState<Record<string, number | string>>({});

    const handleSelectPriceList = (priceList: PriceList) => {
        setSelectedPriceList(priceList);
        // Using `|| ''` to avoid inputs showing '0' for unset rates
        const rates = Object.fromEntries(
            stockItems.map(item => [item.id, priceList.itemRates[item.id] || ''])
        );
        setItemRates(rates);
    };

    const handleCreatePriceList = () => {
        if (!newPriceListName.trim()) {
            addNotification('Price List name cannot be empty.', 'error');
            return;
        }
        addPriceList({ name: newPriceListName, itemRates: {} });
        setNewPriceListName('');
    };
    
    const handleDeletePriceList = (priceList: PriceList) => {
        showModal(
            <ConfirmationDialog
                title="Delete Price List"
                message={`Are you sure you want to delete "${priceList.name}"? This cannot be undone.`}
                onConfirm={() => {
                    deletePriceList(priceList.id);
                    if (selectedPriceList?.id === priceList.id) {
                        setSelectedPriceList(null);
                        setItemRates({});
                    }
                    hideModal();
                }}
                onCancel={hideModal}
                confirmVariant="danger"
            />
        );
    };
    
    const handleRateChange = (stockItemId: string, rate: string) => {
        setItemRates(prev => ({ ...prev, [stockItemId]: rate }));
    };

    const handleSaveChanges = () => {
        if (!selectedPriceList) return;

        const updatedItemRates: Record<string, number> = {};
        for (const [itemId, rate] of Object.entries(itemRates)) {
            const numRate = parseFloat(String(rate));
            if (!isNaN(numRate) && numRate > 0) {
                updatedItemRates[itemId] = numRate;
            }
        }
        
        editPriceList(selectedPriceList.id, {
            ...selectedPriceList,
            itemRates: updatedItemRates,
        });
    };
    
    const clearSelection = () => {
        setSelectedPriceList(null);
        setItemRates({});
    }

    return (
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Price Lists</h2>
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex gap-2">
                        <Input label="" id="new-price-list" placeholder="New Price List Name" value={newPriceListName} onChange={e => setNewPriceListName(e.target.value)} />
                        <Button onClick={handleCreatePriceList} className="!p-2.5"><CreateIcon className="w-5 h-5" /></Button>
                    </div>
                     <ul className="divide-y divide-slate-200 dark:divide-slate-700 max-h-[60vh] overflow-y-auto">
                        {priceLists.map(pl => (
                            <li key={pl.id} className={`p-3 flex justify-between items-center rounded-md transition-colors ${selectedPriceList?.id === pl.id ? 'bg-sky-100 dark:bg-sky-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                <button className="text-left flex-grow" onClick={() => handleSelectPriceList(pl)}>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{pl.name}</p>
                                </button>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleDeletePriceList(pl)} title="Delete" className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="lg:col-span-2">
                {selectedPriceList ? (
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{selectedPriceList.name}</h1>
                                <p className="text-slate-500 dark:text-slate-400">Set custom rates for stock items.</p>
                            </div>
                            <Button variant="secondary" onClick={clearSelection}>Close</Button>
                        </div>
                         <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {stockItems.map(item => (
                                <div key={item.id} className="grid grid-cols-5 gap-4 items-center">
                                    <label htmlFor={`rate-${item.id}`} className="col-span-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {item.name} <span className="text-xs text-slate-400">({item.unit})</span>
                                    </label>
                                    <div className="col-span-2">
                                        <Input
                                            label=""
                                            id={`rate-${item.id}`}
                                            type="text"
                                            placeholder="Default Rate"
                                            value={itemRates[item.id] ?? ''}
                                            onChange={e => handleRateChange(item.id, e.target.value)}
                                            className="text-right"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                            <Button onClick={handleSaveChanges}><SaveIcon className="w-5 h-5 mr-2" /> Save Changes</Button>
                        </div>
                     </div>
                ) : (
                    <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400">Select a Price List to edit its rates.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceLists;