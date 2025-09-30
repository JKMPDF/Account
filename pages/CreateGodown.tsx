
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import type { Godown } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import { SaveIcon, TrashIcon, EditIcon, SearchIcon } from '../components/Icon';
import { useNotifications } from '../context/NotificationContext';
import { useModal } from '../context/ModalContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

const CreateGodown: React.FC = () => {
  const context = useContext(CompanyDataContext);
  const { addNotification } = useNotifications();
  const { showModal, hideModal } = useModal();

  const initialGodownState: Omit<Godown, 'id'> = {
    name: '',
    location: '',
  };

  const [godownDetails, setGodownDetails] = useState<Omit<Godown, 'id'>>(initialGodownState);
  const [editingGodown, setEditingGodown] = useState<Godown | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (editingGodown) {
      setGodownDetails(editingGodown);
    } else {
      setGodownDetails(initialGodownState);
    }
  }, [editingGodown]);

  if (!context) return null;
  const { companyData, addGodown, editGodown, deleteGodown } = context;

  const filteredGodowns = useMemo(() => {
    if (!companyData?.godowns) return [];
    if (!searchTerm) return companyData.godowns;
    return companyData.godowns.filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companyData?.godowns, searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGodownDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!godownDetails.name) {
      addNotification('Godown Name is required.', 'error');
      return;
    }

    let success = false;
    if (editingGodown) {
      success = editGodown(editingGodown.id, godownDetails);
    } else {
      success = !!addGodown(godownDetails);
    }
    
    if (success) {
      setEditingGodown(null);
    }
  };
  
  const handleEdit = (godown: Godown) => {
    setEditingGodown(godown);
    window.scrollTo(0, 0);
  };
  
  const cancelEdit = () => {
    setEditingGodown(null);
  };

  const handleDelete = (godown: Godown) => {
    showModal(
      <ConfirmationDialog
        title="Delete Godown"
        message={`Are you sure you want to delete "${godown.name}"?`}
        onConfirm={() => {
          if (editingGodown?.id === godown.id) cancelEdit();
          deleteGodown(godown.id);
          hideModal();
        }}
        onCancel={hideModal}
        confirmText="Delete"
        confirmVariant="danger"
      />
    );
  };

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">{editingGodown ? 'Edit Godown' : 'Create Godown'}</h1>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Godown Name" id="name" name="name" value={godownDetails.name} onChange={handleChange} required />
            <Input label="Location (Optional)" id="location" name="location" value={godownDetails.location || ''} onChange={handleChange} />
          </div>

          <div className="flex justify-end items-center pt-4 gap-4">
            {editingGodown && <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>}
            <Button type="submit">
              <SaveIcon className="w-5 h-5 mr-2" />
              {editingGodown ? 'Update Godown' : 'Save Godown'}
            </Button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Existing Godowns</h2>
        <div className="relative mb-4">
          <Input label="" id="search-godown" type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-10 w-full" />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-[55vh] overflow-y-auto">
          {filteredGodowns && filteredGodowns.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredGodowns.map(godown => (
                <li key={godown.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{godown.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{godown.location}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(godown)} title="Edit Godown" className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(godown)} title="Delete Godown" className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No godowns found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGodown;
