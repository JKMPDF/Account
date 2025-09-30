

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { CompanyData, CompanyDetails, Ledger, StockItem, Voucher, AuditLog, Godown, Salesman, ChequePrintingConfig, Currency, PriceList, CostCentre, Budget, User, RecurringInvoice, InvoiceCustomization } from '../types';
import { useNotifications } from './NotificationContext';

interface CompanyDataContextType {
  companyData: CompanyData | null;
  loading: boolean;
  loadDataFromFile: (file: File) => Promise<void>;
  createNewCompany: (details: CompanyDetails) => void;
  exportDataAsJson: () => void;
  logout: () => void;
  addLedger: (ledger: Omit<Ledger, 'id'>) => Ledger | null;
  editLedger: (ledgerId: string, updatedLedger: Omit<Ledger, 'id'>) => boolean;
  deleteLedger: (ledgerId: string) => boolean;
  addVoucher: (voucher: Omit<Voucher, 'id'>) => Voucher | null;
  editVoucher: (voucherId: string, updatedVoucher: Omit<Voucher, 'id'>) => boolean;
  deleteVoucher: (voucherIds: string[]) => void;
  addStockItem: (stockItem: Omit<StockItem, 'id'>) => StockItem | null;
  editStockItem: (itemId: string, updatedItem: Omit<StockItem, 'id'>) => boolean;
  deleteStockItem: (itemId: string) => boolean;
  updateCompanyDetails: (details: CompanyDetails) => void;
  reconcileBankEntries: (reconciledEntryIds: string[], reconciliationDate: string) => void;
  addGodown: (godown: Omit<Godown, 'id'>) => Godown | null;
  editGodown: (godownId: string, updatedGodown: Omit<Godown, 'id'>) => boolean;
  deleteGodown: (godownId: string) => boolean;
  addSalesman: (salesman: Omit<Salesman, 'id'>) => Salesman | null;
  editSalesman: (salesmanId: string, updatedSalesman: Omit<Salesman, 'id'>) => boolean;
  deleteSalesman: (salesmanId: string) => boolean;
  updateChequePrintingConfig: (config: ChequePrintingConfig) => void;
  updateInvoiceCustomization: (customization: InvoiceCustomization) => void;
  updateDashboardLayout: (layout: { id: string; visible: boolean }[]) => void;
  activeUser: User | null;
  setActiveUser: (user: User | null) => void;
  // New CRUD functions for advanced features
  addCurrency: (currency: Omit<Currency, 'id'>) => Currency | null;
  editCurrency: (currencyId: string, updatedCurrency: Omit<Currency, 'id'>) => boolean;
  deleteCurrency: (currencyId: string) => boolean;
  addPriceList: (priceList: Omit<PriceList, 'id'>) => PriceList | null;
  editPriceList: (priceListId: string, updatedPriceList: Omit<PriceList, 'id'>) => boolean;
  deletePriceList: (priceListId: string) => boolean;
  addCostCentre: (costCentre: Omit<CostCentre, 'id'>) => CostCentre | null;
  editCostCentre: (costCentreId: string, updatedCostCentre: Omit<CostCentre, 'id'>) => boolean;
  deleteCostCentre: (costCentreId: string) => boolean;
  addBudget: (budget: Omit<Budget, 'id'>) => Budget | null;
  editBudget: (budgetId: string, updatedBudget: Omit<Budget, 'id'>) => boolean;
  deleteBudget: (budgetId: string) => boolean;
  addUser: (user: Omit<User, 'id'>) => User | null;
  editUser: (userId: string, updatedUser: Omit<User, 'id'>) => boolean;
  deleteUser: (userId: string) => boolean;
  addRecurringInvoice: (invoice: Omit<RecurringInvoice, 'id'>) => RecurringInvoice | null;
  editRecurringInvoice: (invoiceId: string, updatedInvoice: Omit<RecurringInvoice, 'id'>) => boolean;
  deleteRecurringInvoice: (invoiceId: string) => boolean;
}

export const CompanyDataContext = createContext<CompanyDataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'jkmEditCompanyData';
const ACTIVE_USER_KEY = 'jkmEditActiveUser';

const performMigration = (data: any, addNotification: (message: string, type: 'info') => void): CompanyData => {
    let needsMigration = false;
    const migrationChecks = [
      !data.auditLogs,
      (data.vouchers || []).some((v: any) => (v.entries || []).some((e: any) => !e.id)),
      !data.godowns, !data.salesmen, !data.chequePrintingConfig, !data.currencies, !data.priceLists,
      !data.costCentres, !data.budgets, !data.users, !data.recurringInvoices, !data.invoiceCustomization, !data.dashboardLayout,
      data.details && (data.details.panNo === undefined || data.details.upiId === undefined)
    ];
    
    if (migrationChecks.some(check => check)) { needsMigration = true; }

    if (needsMigration) {
      addNotification("Updating data from older version...", 'info');
      const migrated: CompanyData = {
        ...data,
        details: {
          ...data.details,
          panNo: data.details?.panNo || '',
          upiId: data.details?.upiId || '',
        },
        ledgers: data.ledgers || [],
        stockItems: data.stockItems || [],
        auditLogs: (data.auditLogs || []).map((log: any) => ({ ...log, userId: log.user || 'system_mig' })),
        godowns: data.godowns || [], salesmen: data.salesmen || [],
        chequePrintingConfig: data.chequePrintingConfig || { width: 200, height: 90, payeeX: 15, payeeY: 30, dateX: 160, dateY: 15, amountWordsX: 20, amountWordsY: 45, amountFigX: 160, amountFigY: 35 },
        vouchers: (data.vouchers || []).map((voucher: any) => ({
          ...voucher, entries: (voucher.entries || []).map((entry: any, index: number) => ({ ...entry, id: entry.id || `entry_mig_${voucher.id || Date.now()}_${index}` }))
        })),
        currencies: data.currencies || [{ id: 'curr_inr', name: 'Indian Rupee', symbol: '₹', code: 'INR' }],
        priceLists: data.priceLists || [], costCentres: data.costCentres || [], budgets: data.budgets || [],
        users: data.users || [{id: 'user_admin', name: 'Admin'}], recurringInvoices: data.recurringInvoices || [],
        invoiceCustomization: data.invoiceCustomization || { logo: '', terms: '' },
        dashboardLayout: data.dashboardLayout || [ { id: 'sales', visible: true }, { id: 'purchases', visible: true }, { id: 'cash', visible: true }, { id: 'debtors', visible: true }, { id: 'creditors', visible: true } ],
      };
      return migrated;
    }
    return data as CompanyData;
};

export const CompanyDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const { addNotification } = useNotifications();

  const migrateData = useCallback((data: any): CompanyData => {
    return performMigration(data, (message, type) => addNotification(message, type));
  }, [addNotification]);

  useEffect(() => {
    setLoading(true);
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const data = JSON.parse(storedData);
        const processedData = migrateData(data);
        if (JSON.stringify(data) !== JSON.stringify(processedData)) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(processedData));
        }
        setCompanyData(processedData);
      }
    } catch (error) {
        console.error("Failed to load data from local storage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY); setCompanyData(null);
    } finally { setLoading(false); }
  }, [migrateData]);
  
  useEffect(() => {
    if(companyData && !activeUser) {
        const storedUserId = localStorage.getItem(ACTIVE_USER_KEY);
        const userToSet = companyData.users.find(u => u.id === storedUserId) || companyData.users[0] || null;
        setActiveUser(userToSet);
    }
  }, [companyData, activeUser]);
  
  const handleSetActiveUser = (user: User | null) => {
      setActiveUser(user);
      if(user) { localStorage.setItem(ACTIVE_USER_KEY, user.id); } 
      else { localStorage.removeItem(ACTIVE_USER_KEY); }
  }

  const saveData = useCallback((data: CompanyData | null) => {
    try {
      if (data) { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data)); } 
      else { localStorage.removeItem(LOCAL_STORAGE_KEY); localStorage.removeItem(ACTIVE_USER_KEY); }
      setCompanyData(data);
    } catch (error) { console.error("Failed to save data to local storage", error); addNotification('Failed to save data!', 'error'); }
  }, [addNotification]);
  
  const addAuditLog = ( action: AuditLog['action'], entity: AuditLog['entity'], details: string ): AuditLog => ({
      id: `log_${Date.now()}_${Math.random()}`, timestamp: new Date().toISOString(),
      userId: activeUser?.id || 'System', action, entity, details,
  });

  const loadDataFromFile = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const fileContent = event.target?.result;
                if (typeof fileContent !== 'string') throw new Error('Could not read file content.');
                const data = JSON.parse(fileContent);
                const processedData = migrateData(data);
                saveData(processedData);
                addNotification('Company data restored successfully!', 'success');
                resolve();
            } catch (error) {
                console.error("Failed to load data from file", error);
                addNotification(`Error loading file: ${(error as Error).message}`, 'error');
                saveData(null); reject(error);
            }
        };
        reader.onerror = () => {
            addNotification('Error reading the file.', 'error');
            reject(reader.error);
        };
        reader.readAsText(file);
    });
  };

  const createNewCompany = (details: CompanyDetails) => {
    const newCompanyData: CompanyData = {
      details, ledgers: [], stockItems: [], vouchers: [], auditLogs: [], godowns: [], salesmen: [],
      chequePrintingConfig: { width: 200, height: 90, payeeX: 15, payeeY: 30, dateX: 160, dateY: 15, amountWordsX: 20, amountWordsY: 45, amountFigX: 160, amountFigY: 35 },
      currencies: [{ id: 'curr_inr', name: 'Indian Rupee', symbol: '₹', code: 'INR' }],
      priceLists: [], costCentres: [], budgets: [], users: [{id: 'user_admin', name: 'Admin'}], recurringInvoices: [],
      invoiceCustomization: { logo: '', terms: '' },
      dashboardLayout: [ { id: 'sales', visible: true }, { id: 'purchases', visible: true }, { id: 'cash', visible: true }, { id: 'debtors', visible: true }, { id: 'creditors', visible: true } ],
    };
    saveData(newCompanyData);
  };

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType }); const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.download = filename; link.href = url;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportDataAsJson = () => {
    if (!companyData) { addNotification('No company data to export.', 'error'); return; }
    try {
      const jsonString = JSON.stringify(companyData, null, 2);
      const safeName = companyData.details.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `jkmedit_backup_${safeName}_${new Date().toISOString().split('T')[0]}.json`;
      triggerDownload(filename, jsonString, 'application/json');
      addNotification('Company data exported successfully!', 'success');
    } catch (error) { console.error("Failed to export data", error); addNotification('An error occurred while exporting data.', 'error'); }
  };

  const logout = () => { saveData(null); };

  // Generic CRUD factory
  // FIX: Constrain OmitT to be an object to allow use of 'in' operator.
  const createCrud = <T extends { id: string, name?: string }, OmitT extends object>(entityName: keyof CompanyData, entityLabel: AuditLog['entity']) => ({
    add: (data: OmitT): T | null => {
        if (!companyData) return null;
        const newItem: T = { ...data as any, id: `${entityName}_${Date.now()}` };
        const newArray = [...(companyData[entityName] as T[]), newItem];
        // FIX: Add type assertion for `name` property.
        if('name' in newItem && typeof (newItem as any).name === 'string') newArray.sort((a: any, b: any) => a.name.localeCompare(b.name));
        const log = addAuditLog('Create', entityLabel, `Created ${entityLabel}: ${'name' in newItem ? (newItem as any).name : newItem.id}`);
        saveData({ ...companyData, [entityName]: newArray, auditLogs: [log, ...companyData.auditLogs] });
        addNotification(`${entityLabel} created successfully!`, 'success');
        return newItem;
    },
    edit: (id: string, updatedData: OmitT): boolean => {
        if (!companyData) return false;
        const updatedArray = (companyData[entityName] as T[]).map(item => item.id === id ? { ...updatedData as any, id } : item);
        if('name' in updatedData && typeof (updatedData as any).name === 'string') updatedArray.sort((a: any, b: any) => a.name.localeCompare(b.name));
        const log = addAuditLog('Update', entityLabel, `Updated ${entityLabel}: ${'name' in updatedData ? (updatedData as any).name : id}`);
        saveData({ ...companyData, [entityName]: updatedArray, auditLogs: [log, ...companyData.auditLogs] });
        addNotification(`${entityLabel} updated successfully!`, 'success');
        return true;
    },
    delete: (id: string): boolean => {
        if (!companyData) return false;
        const array = (companyData[entityName] as T[]);
        const itemToDelete = array.find(item => item.id === id);
        if (!itemToDelete) return false;
        // Basic usage check for masters to prevent data corruption
        if (['ledgers', 'stockItems', 'godowns', 'salesmen', 'currencies', 'priceLists', 'costCentres'].includes(String(entityName))) {
          const isUsed = companyData.vouchers.some(v => JSON.stringify(v).includes(id));
          if(isUsed){ addNotification(`Cannot delete ${entityLabel} as it is used in vouchers.`, 'error'); return false; }
        }
        const updatedArray = array.filter(item => item.id !== id);
        const log = addAuditLog('Delete', entityLabel, `Deleted ${entityLabel}: ${'name' in itemToDelete && typeof (itemToDelete as any).name === 'string' ? (itemToDelete as any).name : itemToDelete.id}`);
        saveData({ ...companyData, [entityName]: updatedArray, auditLogs: [log, ...companyData.auditLogs] });
        addNotification(`${entityLabel} deleted successfully.`, 'success');
        return true;
    },
  });

  const ledgerCrud = createCrud<Ledger, Omit<Ledger, 'id'>>('ledgers', 'Ledger');
  const stockItemCrud = createCrud<StockItem, Omit<StockItem, 'id'>>('stockItems', 'Stock Item');
  const godownCrud = createCrud<Godown, Omit<Godown, 'id'>>('godowns', 'Godown');
  const salesmanCrud = createCrud<Salesman, Omit<Salesman, 'id'>>('salesmen', 'Salesman');
  const currencyCrud = createCrud<Currency, Omit<Currency, 'id'>>('currencies', 'Currency');
  const priceListCrud = createCrud<PriceList, Omit<PriceList, 'id'>>('priceLists', 'PriceList');
  const costCentreCrud = createCrud<CostCentre, Omit<CostCentre, 'id'>>('costCentres', 'CostCentre');
  const budgetCrud = createCrud<Budget, Omit<Budget, 'id'>>('budgets', 'Budget');
  const userCrud = createCrud<User, Omit<User, 'id'>>('users', 'User');
  const recurringInvoiceCrud = createCrud<RecurringInvoice, Omit<RecurringInvoice, 'id'>>('recurringInvoices', 'RecurringInvoice');

  const addVoucher = (voucherData: Omit<Voucher, 'id'>): Voucher | null => {
    if (!companyData) return null;
    const timestamp = Date.now();
    const newVoucher: Voucher = { ...voucherData, id: `voucher_${timestamp}`, entries: voucherData.entries.map((e, i) => ({ ...e, id: `entry_${timestamp}_${i}` })) };
    const log = addAuditLog('Create', 'Voucher', `Created ${newVoucher.type} No. ${newVoucher.voucherNo}`);
    saveData({ ...companyData, vouchers: [...companyData.vouchers, newVoucher], auditLogs: [log, ...companyData.auditLogs] });
    addNotification('Voucher posted successfully!', 'success');
    return newVoucher;
  };

  const editVoucher = (voucherId: string, updatedVoucherData: Omit<Voucher, 'id'>): boolean => {
    if (!companyData) return false;
    const timestamp = Date.now();
    const updatedVouchers = companyData.vouchers.map(v => v.id === voucherId ? { ...updatedVoucherData, id: voucherId, entries: updatedVoucherData.entries.map((e, i) => ({ ...e, id: e.id || `entry_edit_${timestamp}_${i}` })) } : v);
    const log = addAuditLog('Update', 'Voucher', `Updated ${updatedVoucherData.type} No. ${updatedVoucherData.voucherNo}`);
    saveData({ ...companyData, vouchers: updatedVouchers, auditLogs: [log, ...companyData.auditLogs] });
    addNotification('Voucher updated successfully!', 'success');
    return true;
  };

  const deleteVoucher = (voucherIds: string[]) => {
    if (!companyData) return;
    const vouchersToDelete = companyData.vouchers.filter(v => voucherIds.includes(v.id));
    const updatedVouchers = companyData.vouchers.filter(v => !voucherIds.includes(v.id));
    const logs = vouchersToDelete.map(v => addAuditLog('Delete', 'Voucher', `Deleted ${v.type} No. ${v.voucherNo}`));
    saveData({ ...companyData, vouchers: updatedVouchers, auditLogs: [...logs, ...companyData.auditLogs] });
    addNotification(`${voucherIds.length} voucher(s) deleted successfully.`, 'success');
  };
  
  const updateChequePrintingConfig = (config: ChequePrintingConfig) => {
    if (!companyData) return;
    saveData({ ...companyData, chequePrintingConfig: config });
    addNotification('Cheque printing settings saved!', 'success');
  }

  const updateCompanyDetails = (details: CompanyDetails) => {
    if (!companyData) return;
    const log = addAuditLog('Update', 'Company', `Updated company profile details.`);
    saveData({ ...companyData, details, auditLogs: [log, ...companyData.auditLogs] });
    addNotification('Company details updated successfully!', 'success');
  };

  const reconcileBankEntries = (reconciledEntryIds: string[], reconciliationDate: string) => {
    if (!companyData) return;
    const updatedVouchers = companyData.vouchers.map(v => ({...v, entries: v.entries.map(e => reconciledEntryIds.includes(e.id) ? { ...e, reconciliationDate } : e) }));
    saveData({ ...companyData, vouchers: updatedVouchers });
    addNotification(`${reconciledEntryIds.length} ${reconciledEntryIds.length === 1 ? 'entry' : 'entries'} reconciled successfully!`, 'success');
  };
  
  const updateInvoiceCustomization = (customization: InvoiceCustomization) => {
    if (!companyData) return;
    saveData({ ...companyData, invoiceCustomization: customization });
    addNotification('Invoice settings saved!', 'success');
  };
  
  const updateDashboardLayout = (layout: { id: string; visible: boolean }[]) => {
      if(!companyData) return; saveData({ ...companyData, dashboardLayout: layout });
      addNotification('Dashboard layout saved!', 'success');
  }

  return (
    <CompanyDataContext.Provider value={{
      companyData, loading, loadDataFromFile, createNewCompany, exportDataAsJson, logout,
      addLedger: ledgerCrud.add, editLedger: ledgerCrud.edit, deleteLedger: ledgerCrud.delete, 
      addVoucher, editVoucher, deleteVoucher,
      addStockItem: stockItemCrud.add, editStockItem: stockItemCrud.edit, deleteStockItem: stockItemCrud.delete, 
      updateCompanyDetails, reconcileBankEntries,
      addGodown: godownCrud.add, editGodown: godownCrud.edit, deleteGodown: godownCrud.delete, 
      addSalesman: salesmanCrud.add, editSalesman: salesmanCrud.edit, deleteSalesman: salesmanCrud.delete, 
      updateChequePrintingConfig, updateInvoiceCustomization, updateDashboardLayout, activeUser, setActiveUser: handleSetActiveUser,
      addCurrency: currencyCrud.add, editCurrency: currencyCrud.edit, deleteCurrency: currencyCrud.delete,
      addPriceList: priceListCrud.add, editPriceList: priceListCrud.edit, deletePriceList: priceListCrud.delete,
      addCostCentre: costCentreCrud.add, editCostCentre: costCentreCrud.edit, deleteCostCentre: costCentreCrud.delete,
      addBudget: budgetCrud.add, editBudget: budgetCrud.edit, deleteBudget: budgetCrud.delete,
      addUser: userCrud.add, editUser: userCrud.edit, deleteUser: userCrud.delete,
      addRecurringInvoice: recurringInvoiceCrud.add, editRecurringInvoice: recurringInvoiceCrud.edit, deleteRecurringInvoice: recurringInvoiceCrud.delete,
    }}>
      {children}
    </CompanyDataContext.Provider>
  );
};