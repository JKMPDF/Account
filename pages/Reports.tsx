

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { BookOpenIcon, ScaleIcon, ChartPieIcon, LedgerIcon, StockIcon, TrialBalanceIcon, ClipboardCheckIcon, GstReturnIcon, CashFlowIcon, SalesmanIcon, ChequeIcon, AgingIcon, BillWiseIcon, BudgetIcon, InterestIcon } from '../components/Icon';

const reportItems = [
  { title: 'Day Book', description: 'View all voucher entries chronologically.', icon: <BookOpenIcon className="w-8 h-8" />, path: '/reports/day-book' },
  { title: 'Ledger Report', description: 'Detailed statement for any account.', icon: <LedgerIcon className="w-8 h-8" />, path: '/reports/ledger-report' },
  { title: 'Cash Flow', description: 'View inflows and outflows of cash.', icon: <CashFlowIcon className="w-8 h-8" />, path: '/reports/cash-flow' },
  { title: 'Bank Reconciliation', description: 'Match bank statements with books.', icon: <ClipboardCheckIcon className="w-8 h-8" />, path: '/reports/bank-reconciliation' },
  { title: 'Stock Summary', description: 'View stock movement and balances.', icon: <StockIcon className="w-8 h-8" />, path: '/reports/stock-summary' },
  { title: 'Trial Balance', description: 'Closing balances of all ledgers.', icon: <TrialBalanceIcon className="w-8 h-8" />, path: '/reports/trial-balance' },
  { title: 'Profit & Loss', description: 'View income, expenses, and net profit.', icon: <ChartPieIcon className="w-8 h-8" />, path: '/reports/profit-and-loss' },
  { title: 'Balance Sheet', description: 'View assets, liabilities, and equity.', icon: <ScaleIcon className="w-8 h-8" />, path: '/reports/balance-sheet' },
  { title: 'GST Returns', description: 'Generate JSON for GSTR-1 filing.', icon: <GstReturnIcon className="w-8 h-8" />, path: '/reports/gst-returns' },
  { title: 'Aging Report', description: 'Analyze outstanding receivables/payables.', icon: <AgingIcon className="w-8 h-8" />, path: '/reports/aging-report' },
  { title: 'Sales by Customer', description: 'Analyze sales figures per customer.', icon: <LedgerIcon className="w-8 h-8" />, path: '/reports/sales-by-customer' },
  { title: 'Sales by Salesman', description: 'Track performance of sales agents.', icon: <SalesmanIcon className="w-8 h-8" />, path: '/reports/sales-by-salesman' },
  { title: 'Cheque Register', description: 'Track all cheque-related transactions.', icon: <ChequeIcon className="w-8 h-8" />, path: '/reports/cheque-register' },
  { title: 'Bill-wise Details', description: 'View outstanding bills for parties.', icon: <BillWiseIcon className="w-8 h-8" />, path: '/reports/bill-wise-details' },
  { title: 'Budget Variance', description: 'Compare actuals against budgets.', icon: <BudgetIcon className="w-8 h-8" />, path: '/reports/budget-variance' },
  { title: 'Interest Calculation', description: 'Calculate interest on overdue amounts.', icon: <InterestIcon className="w-8 h-8" />, path: '/reports/interest-calculation' },
  { title: 'PDC Report', description: 'Manage post-dated cheques.', icon: <ChequeIcon className="w-8 h-8" />, path: '/reports/pdc-report' },
];

const Reports: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {reportItems.map((item) => (
          <Card
            key={item.title}
            title={item.title}
            description={item.description}
            icon={item.icon}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </div>
  );
};

export default Reports;
