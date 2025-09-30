
import React, { useState, useContext, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import type { StockItem } from '../types';
import { STOCK_UNITS } from '../constants/stockUnits';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import { useNotifications } from '../context/NotificationContext';
import { useModal } from '../context/ModalContext';

interface StockItemQuickCreateFormProps {
    onItemCreated: (item: StockItem) => void;
}

const StockItemQuickCreateForm: React.FC<StockItemQuickCreateFormProps> = ({ onItemCreated }) => {
    const { companyData, addStockItem } = useContext(CompanyDataContext)!;
    const { addNotification } = useNotifications();
    const { hideModal } = useModal();

    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [gstRate, setGstRate] = useState(0);

    const unitOptions = useMemo(() => [
        { value: '', label: 'Select Unit' },
        ...STOCK_UNITS.map(u => ({ value: u.split(' ')[0], label: u }))
    ], []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !unit) {
            addNotification('Item Name and Unit are required.', 'error');
            return;
        }
        if (companyData?.stockItems.some(item => item.name.toLowerCase() === name.toLowerCase())) {
            addNotification('A stock item with this name already exists.', 'error');
            return;
        }
        const newItem = addStockItem({ name, unit, gstRate });
        if (newItem) {
            onItemCreated(newItem);
            hideModal();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Quick Create Stock Item</h3>
            <Input label="Item Name" id="quick-item-name" value={name} onChange={e => setName(e.target.value)} required />
            <Select label="Unit" id="quick-item-unit" value={unit} onChange={setUnit} options={unitOptions} required />
            <Input label="GST Rate (%)" id="quick-gst-rate" type="number" value={gstRate} onChange={e => setGstRate(parseFloat(e.target.value) || 0)} />
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={hideModal}>Cancel</Button>
                <Button type="submit">Create Item</Button>
            </div>
        </form>
    );
};

export default StockItemQuickCreateForm;