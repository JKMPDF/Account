
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import type { Salesman } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import { SaveIcon, TrashIcon, EditIcon, SearchIcon } from '../components/Icon';
import { useNotifications } from '../context/NotificationContext';
import { useModal } from '../context/ModalContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

const CreateSalesman: React.FC = () => {
  const context = useContext(CompanyDataContext);
  const { addNotification } = useNotifications();
  const { showModal, hideModal } = useModal();

  const initialSalesmanState: Omit<Salesman, 'id'> = {
    name: '',
    contactNo: '',
    email: '',
  };

  const [salesmanDetails, setSalesmanDetails] = useState<Omit<Salesman, 'id'>>(initialSalesmanState);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (editingSalesman) {
      setSalesmanDetails(editingSalesman);
    } else {
      setSalesmanDetails(initialSalesmanState);
    }
  }, [editingSalesman]);

  if (!context) return null;
  const { companyData, addSalesman, editSalesman, deleteSalesman } = context;

  const filteredSalesmen = useMemo(() => {
    if (!companyData?.salesmen) return [];
    if (!searchTerm) return companyData.salesmen;
    return companyData.salesmen.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companyData?.salesmen, searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSalesmanDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesmanDetails.name) {
      addNotification('Salesman Name is required.', 'error');
      return;
    }

    let success = false;
    if (editingSalesman) {
      success = editSalesman(editingSalesman.id, salesmanDetails);
    } else {
      success = !!addSalesman(salesmanDetails);
    }
    
    if (success) {
      setEditingSalesman(null);
    }
  };
  
  const handleEdit = (salesman: Salesman) => {
    setEditingSalesman(salesman);
    window.scrollTo(0, 0);
  };
  
  const cancelEdit = () => {
    setEditingSalesman(null);
  };

  const handleDelete = (salesman: Salesman) => {
    showModal(
      <ConfirmationDialog
        title="Delete Salesman"
        message={`Are you sure you want to delete "${salesman.name}"?`}
        onConfirm={() => {
          if (editingSalesman?.id === salesman.id) cancelEdit();
          deleteSalesman(salesman.id);
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">{editingSalesman ? 'Edit Salesman' : 'Create Salesman'}</h1>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
          <Input label="Salesman Name" id="name" name="name" value={salesmanDetails.name} onChange={handleChange} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Contact No." id="contactNo" name="contactNo" value={salesmanDetails.contactNo || ''} onChange={handleChange} />
            <Input label="Email ID" id="email" name="email" type="email" value={salesmanDetails.email || ''} onChange={handleChange} />
          </div>

          <div className="flex justify-end items-center pt-4 gap-4">
            {editingSalesman && <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>}
            <Button type="submit">
              <SaveIcon className="w-5 h-5 mr-2" />
              {editingSalesman ? 'Update Salesman' : 'Save Salesman'}
            </Button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Existing Salesmen</h2>
        <div className="relative mb-4">
          <Input label="" id="search-salesman" type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-10 w-full" />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-[55vh] overflow-y-auto">
          {filteredSalesmen && filteredSalesmen.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredSalesmen.map(salesman => (
                <li key={salesman.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{salesman.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{salesman.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(salesman)} title="Edit Salesman" className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(salesman)} title="Delete Salesman" className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No salesmen found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSalesman;
