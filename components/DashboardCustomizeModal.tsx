
import React, { useState, useContext } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import Button from './Button';
import Checkbox from './Checkbox';
import { useModal } from '../context/ModalContext';

const DashboardCustomizeModal: React.FC = () => {
  const context = useContext(CompanyDataContext);
  if (!context || !context.companyData) return null;

  const { companyData, updateDashboardLayout } = context;
  const { hideModal } = useModal();
  
  const initialLayout = companyData.dashboardLayout || [
    { id: 'sales', visible: true }, { id: 'purchases', visible: true }, { id: 'cash', visible: true }, { id: 'debtors', visible: true }, { id: 'creditors', visible: true }
  ];

  const [layout, setLayout] = useState(initialLayout);

  const cardLabels: Record<string, string> = {
    sales: "Total Sales",
    purchases: "Total Purchases",
    cash: "Cash & Bank",
    debtors: "Sundry Debtors",
    creditors: "Sundry Creditors"
  };

  const handleToggle = (id: string) => {
    setLayout(prev => prev.map(item => item.id === id ? { ...item, visible: !item.visible } : item));
  };
  
  const handleSave = () => {
      updateDashboardLayout(layout);
      hideModal();
  };

  // Drag and drop handlers would go here for reordering
  
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Customize Dashboard KPIs</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Select which Key Performance Indicators to display on your dashboard.
        Drag and drop to reorder (feature coming soon).
      </p>
      <div className="space-y-4">
        {layout.map(item => (
          <div key={item.id} className="flex items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md">
            <Checkbox
              id={`kpi-${item.id}`}
              label={cardLabels[item.id] || item.id}
              checked={item.visible}
              onChange={() => handleToggle(item.id)}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Button variant="secondary" onClick={hideModal}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default DashboardCustomizeModal;
