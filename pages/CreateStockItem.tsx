

import React, { useState, useContext, useEffect, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import type { StockItem } from '../types';
import { STOCK_UNITS } from '../constants/stockUnits';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import ToggleSwitch from '../components/ToggleSwitch';
import { SaveIcon, TrashIcon, EditIcon, SearchIcon } from '../components/Icon';
import { useNotifications } from '../context/NotificationContext';
import { useModal } from '../context/ModalContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

const CreateStockItem: React.FC = () => {
  const context = useContext(CompanyDataContext);
  const { addNotification } = useNotifications();
  const { showModal, hideModal } = useModal();

  const initialItemState: Omit<StockItem, 'id'> = {
    name: '',
    unit: '',
    hsnCode: '',
    gstRate: 0,
    reorderLevel: 0,
    isBatchTracked: false,
    isSerialTracked: false,
  };

  const [itemDetails, setItemDetails] = useState<Omit<StockItem, 'id'>>(initialItemState);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (editingItem) {
        setItemDetails({
            ...initialItemState,
            ...editingItem,
        });
    } else {
        setItemDetails(initialItemState);
    }
  }, [editingItem]);

  if (!context) return null;
  const { companyData, addStockItem, editStockItem, deleteStockItem } = context;

  const filteredItems = useMemo(() => {
    if (!companyData?.stockItems) return [];
    if (!searchTerm) return companyData.stockItems;
    return companyData.stockItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companyData?.stockItems, searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setItemDetails(prev => ({ 
        ...prev, 
        [name]: isNumber ? parseFloat(value) || 0 : value 
    }));
  };
  
   const handleToggleChange = (name: 'isBatchTracked' | 'isSerialTracked', value: boolean) => {
      setItemDetails(prev => ({...prev, [name]: value}));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDetails.name || !itemDetails.unit) {
      addNotification('Item Name and Unit are required.', 'error');
      return;
    }

    let success = false;
    if (editingItem) {
        success = editStockItem(editingItem.id, itemDetails);
    } else {
        if (companyData?.stockItems.some(item => item.name.toLowerCase() === itemDetails.name.toLowerCase())) {
            addNotification('A stock item with this name already exists.', 'error');
            return;
        }
        success = !!addStockItem(itemDetails);
    }
    
    if (success) {
        setEditingItem(null);
    }
  };

  const handleEdit = (item: StockItem) => {
      setEditingItem(item);
      window.scrollTo(0, 0);
  };
  
  const cancelEdit = () => {
    setEditingItem(null);
  };

  const handleDelete = (item: StockItem) => {
      showModal(
          <ConfirmationDialog
            title="Delete Stock Item"
            message={`Are you sure you want to delete the item "${item.name}"? This action cannot be undone.`}
            onConfirm={() => {
                if (editingItem?.id === item.id) cancelEdit();
                deleteStockItem(item.id);
                hideModal();
            }}
            onCancel={hideModal}
            confirmText="Delete"
            confirmVariant="danger"
          />
      )
  }
  
  const unitOptions = useMemo(() => [
    { value: '', label: 'Select Unit' },
    ...STOCK_UNITS.map(unit => ({ value: unit.split(' ')[0], label: unit }))
  ], []);

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">{editingItem ? 'Edit Stock Item' : 'Create Stock Item'}</h1>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Item Name" id="name" name="name" value={itemDetails.name} onChange={handleChange} required />
            <Select 
                label="Unit" 
                id="unit" 
                value={itemDetails.unit} 
                onChange={(val) => setItemDetails(p => ({...p, unit: val}))} 
                options={unitOptions}
                required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="HSN Code" id="hsnCode" name="hsnCode" value={itemDetails.hsnCode || ''} onChange={handleChange} />
            <Input label="GST Rate (%)" id="gstRate" name="gstRate" type="number" value={itemDetails.gstRate} onChange={handleChange} min="0" step="0.01" />
            <Input label="Re-order Level" id="reorderLevel" name="reorderLevel" type="number" value={itemDetails.reorderLevel} onChange={handleChange} min="0" />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-sky-500 dark:text-sky-400">Inventory Tracking</h3>
            <div className="flex flex-col sm:flex-row gap-6">
                <ToggleSwitch label="Track by Batch Number" id="isBatchTracked" enabled={!!itemDetails.isBatchTracked} onChange={(val) => handleToggleChange('isBatchTracked', val)} />
                <ToggleSwitch label="Track by Serial Number" id="isSerialTracked" enabled={!!itemDetails.isSerialTracked} onChange={(val) => handleToggleChange('isSerialTracked', val)} />
            </div>
          </div>

          <div className="flex justify-end items-center pt-4 gap-4">
            {editingItem && <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>}
            <Button type="submit">
              <SaveIcon className="w-5 h-5 mr-2" />
              {editingItem ? 'Update Item' : 'Save Item'}
            </Button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Existing Items</h2>
         <div className="relative mb-4">
            <Input label="" id="search-item" type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-10 w-full" />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-[55vh] overflow-y-auto">
          {filteredItems && filteredItems.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredItems.map(item => {
                const isUsed = companyData.vouchers.some(v => v.entries.some(e => e.inventoryAllocations?.some(inv => inv.stockItemId === item.id)));
                return (
                    <li key={item.id} className="py-3 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Unit: {item.unit} | GST: {item.gstRate || 0}%</p>
                        </div>
                        <div className="flex items-center gap-1">
                           <button onClick={() => handleEdit(item)} title="Edit Item" className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => handleDelete(item)}
                                disabled={isUsed}
                                title={isUsed ? "Cannot delete: Item is used in vouchers." : "Delete Item"}
                                className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No stock items found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateStockItem;
