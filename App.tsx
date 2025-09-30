


import React, { useContext, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CompanyDataContext } from './context/CompanyDataContext';
import Layout from './components/Layout';

// Lazy load all page components for code-splitting
const Welcome = lazy(() => import('./pages/Welcome'));
const CreateCompany = lazy(() => import('./pages/CreateCompany'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateItems = lazy(() => import('./pages/CreateItems'));
const CreateLedger = lazy(() => import('./pages/CreateLedger'));
const PostEntry = lazy(() => import('./pages/PostEntry'));
const DayBook = lazy(() => import('./pages/DayBook'));
const Reports = lazy(() => import('./pages/Reports'));
const BalanceSheet = lazy(() => import('./pages/BalanceSheet'));
const ProfitAndLoss = lazy(() => import('./pages/ProfitAndLoss'));
const CreateStockItem = lazy(() => import('./pages/CreateStockItem'));
const DataTools = lazy(() => import('./pages/DataTools'));
const LedgerReport = lazy(() => import('./pages/LedgerReport'));
const StockSummary = lazy(() => import('./pages/StockSummary'));
const TrialBalance = lazy(() => import('./pages/TrialBalance'));
const Settings = lazy(() => import('./pages/CompanySettings'));
const BankReconciliation = lazy(() => import('./pages/BankReconciliation'));
const GstReturns = lazy(() => import('./pages/GstReturns'));
const CompanyProfile = lazy(() => import('./pages/settings/CompanyProfile'));
const Appearance = lazy(() => import('./pages/settings/Appearance'));
const DownloadSettings = lazy(() => import('./pages/settings/DownloadSettings'));
const AgingReport = lazy(() => import('./pages/AgingReport'));
const AuditTrail = lazy(() => import('./pages/AuditTrail'));
const CreateGodown = lazy(() => import('./pages/CreateGodown'));
const CreateSalesman = lazy(() => import('./pages/CreateSalesman'));
const CashFlowStatement = lazy(() => import('./pages/CashFlowStatement'));
const SalesByCustomerReport = lazy(() => import('./pages/SalesByCustomerReport'));
const SalesBySalesmanReport = lazy(() => import('./pages/SalesBySalesmanReport'));
const ChequeRegister = lazy(() => import('./pages/ChequeRegister'));
const ChequePrinting = lazy(() => import('./pages/settings/ChequePrinting'));
const CreateCurrency = lazy(() => import('./pages/CreateCurrency'));
const PriceLists = lazy(() => import('./pages/PriceLists'));
const CreateCostCentre = lazy(() => import('./pages/CreateCostCentre'));
const Budgets = lazy(() => import('./pages/Budgets'));
const RecurringInvoices = lazy(() => import('./pages/RecurringInvoices'));
const BillWiseReport = lazy(() => import('./pages/BillWiseReport'));
const BudgetVarianceReport = lazy(() => import('./pages/BudgetVarianceReport'));
const InterestCalculationReport = lazy(() => import('./pages/InterestCalculationReport'));
const PdcReport = lazy(() => import('./pages/PdcReport'));
const InvoiceCustomization = lazy(() => import('./pages/settings/InvoiceCustomization'));
const UserManagement = lazy(() => import('./pages/settings/UserManagement'));


const App: React.FC = () => {
  const context = useContext(CompanyDataContext);

  if (context === undefined) {
    return <div>Loading...</div>; // Or some other loading state
  }
  
  const { companyData, loading } = context;

  const LoadingSkeleton = (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex animate-pulse">
        {/* Sidebar Skeleton */}
        <div className="w-16 lg:w-56 bg-white dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 p-2 lg:p-4 space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 hidden lg:block"></div>
            <div className="space-y-2">
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
        </div>
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col">
            <div className="bg-white dark:bg-slate-800 shadow-md p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                </div>
            </div>
            <main className="flex-grow p-6">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
            </main>
        </div>
    </div>
  );

  if (loading) {
    return LoadingSkeleton;
  }

  return (
    <Suspense fallback={LoadingSkeleton}>
      <Routes>
        {companyData ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/create-items" element={<CreateItems />} />
            <Route path="/post-entry" element={<PostEntry />} />
            <Route path="/view-report" element={<Reports />} />
            {/* Reports */}
            <Route path="/reports/day-book" element={<DayBook />} />
            <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
            <Route path="/reports/profit-and-loss" element={<ProfitAndLoss />} />
            <Route path="/reports/ledger-report" element={<LedgerReport />} />
            <Route path="/reports/stock-summary" element={<StockSummary />} />
            <Route path="/reports/trial-balance" element={<TrialBalance />} />
            <Route path="/reports/bank-reconciliation" element={<BankReconciliation />} />
            <Route path="/reports/gst-returns" element={<GstReturns />} />
            <Route path="/reports/aging-report" element={<AgingReport />} />
            <Route path="/reports/cash-flow" element={<CashFlowStatement />} />
            <Route path="/reports/sales-by-customer" element={<SalesByCustomerReport />} />
            <Route path="/reports/sales-by-salesman" element={<SalesBySalesmanReport />} />
            <Route path="/reports/cheque-register" element={<ChequeRegister />} />
            {/* New Advanced Reports */}
            <Route path="/reports/bill-wise-details" element={<BillWiseReport />} />
            <Route path="/reports/budget-variance" element={<BudgetVarianceReport />} />
            <Route path="/reports/interest-calculation" element={<InterestCalculationReport />} />
            <Route path="/reports/pdc-report" element={<PdcReport />} />

            {/* Masters */}
            <Route path="/create-ledger" element={<CreateLedger />} />
            <Route path="/create-stock" element={<CreateStockItem />} />
            <Route path="/create-godown" element={<CreateGodown />} />
            <Route path="/create-salesman" element={<CreateSalesman />} />
            {/* New Advanced Masters */}
            <Route path="/create-currency" element={<CreateCurrency />} />
            <Route path="/price-lists" element={<PriceLists />} />
            <Route path="/create-cost-centre" element={<CreateCostCentre />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/recurring-invoices" element={<RecurringInvoices />} />

            {/* Tools */}
            <Route path="/data-tools" element={<DataTools />} />
            <Route path="/audit-trail" element={<AuditTrail />} />

            {/* Settings */}
            <Route path="/settings" element={<Settings />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<CompanyProfile />} />
              <Route path="appearance" element={<Appearance />} />
              <Route path="downloads" element={<DownloadSettings />} />
              <Route path="cheque-printing" element={<ChequePrinting />} />
              {/* New Advanced Settings */}
              <Route path="invoice-customization" element={<InvoiceCustomization />} />
              <Route path="users" element={<UserManagement />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          <>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/create-company" element={<CreateCompany />} />
            <Route path="*" element={<Navigate to="/welcome" />} />
          </>
        )}
      </Routes>
    </Suspense>
  );
};

export default App;