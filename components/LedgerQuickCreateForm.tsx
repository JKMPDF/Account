
import React, { useState, useContext, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import type { Ledger } from '../types';
import { ACCOUNTING_GROUPS } from '../constants/accountingGroups';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import { useNotifications } from '../context/NotificationContext';
import { useModal } from '../context/ModalContext';

interface LedgerQuickCreateFormProps {
    onLedgerCreated: (ledger: Ledger) => void;
}

const LedgerQuickCreateForm: React.FC<LedgerQuickCreateFormProps> = ({ onLedgerCreated }) => {
    const { companyData, addLedger } = useContext(CompanyDataContext)!;
    const { addNotification } = useNotifications();
    const { hideModal } = useModal();

    const [name, setName] = useState('');
    const [group, setGroup] = useState('');
    
    const groupOptions = useMemo(() => [
        { value: '', label: 'Select Group' },
        ...ACCOUNTING_GROUPS.sort().map(g => ({ value: g, label: g }))
    ], []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !group) {
            addNotification('Ledger Name and Group are required.', 'error');
            return;
        }
        if (companyData?.ledgers.some(l => l.name.toLowerCase() === name.toLowerCase())) {
            addNotification('A ledger with this name already exists.', 'error');
            return;
        }
        const newLedger = addLedger({ name, group });
        if (newLedger) {
            onLedgerCreated(newLedger);
            hideModal();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Quick Create Ledger</h3>
            <Input label="Ledger Name" id="quick-ledger-name" value={name} onChange={e => setName(e.target.value)} required />
            <Select label="Group" id="quick-ledger-group" value={group} onChange={setGroup} options={groupOptions} required />
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={hideModal}>Cancel</Button>
                <Button type="submit">Create Ledger</Button>
            </div>
        </form>
    );
};

export default LedgerQuickCreateForm;