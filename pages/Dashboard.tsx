

import React, { useContext, useMemo, useState } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useDateRange } from '../context/DateRangeContext';
import { calculateLedgerBalancesForPeriod, calculateMonthlySalesAndProfit, calculateProfitAndLoss } from '../utils/accounting';
import KpiCard from '../components/KpiCard';
import MonthlySalesChart from '../components/MonthlySalesChart';
import MonthlyProfitChart from '../components/MonthlyProfitChart';
import DonutChart from '../components/DonutChart';
import TopPartiesList from '../components/TopPartiesList';
import { formatDate } from '../utils/exportUtils';
import { CogIcon } from '../components/Icon';
import { useModal } from '../context/ModalContext';
import DashboardCustomizeModal from '../components/DashboardCustomizeModal';

const Dashboard: React.FC = () => {
  const { companyData } = useContext(CompanyDataContext)!;
  const { startDate, endDate } = useDateRange();
  const { showModal } = useModal();
  
  const { details, ledgers, vouchers, stockItems, salesmen, dashboardLayout } = companyData!;
  
  const filteredVouchers = useMemo(() => {
      if (!startDate || !endDate) return [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return vouchers.filter(v => {
        const vDate = new Date(v.date);
        return vDate >= start && vDate <= end;
      });
  }, [vouchers, startDate, endDate]);

  const monthlyData = useMemo(() => {
    if (!companyData || !startDate || !endDate) return [];
    return calculateMonthlySalesAndProfit(ledgers, vouchers, startDate, endDate);
  }, [companyData, startDate, endDate, ledgers, vouchers]);

  const salesChartData = useMemo(() => monthlyData.map(m => ({ label: m.name, value: m.sales })), [monthlyData]);
  const profitChartData = useMemo(() => monthlyData.map(m => ({ label: m.name, value: m.profit })), [monthlyData]);

  const { totalSales, totalPurchases, cashBankBalance, sundryDebtors, sundryCreditors, incomeExpenseData } = useMemo(() => {
    const { transactions, closingBalances } = calculateLedgerBalancesForPeriod(ledgers, vouchers, startDate, endDate);
    
    let sales = 0;
    let purchases = 0;
    let cashBank = 0;
    let debtors = 0;
    let creditors = 0;

    ledgers.forEach(l => {
      const balance = closingBalances.get(l.id) || 0;
      if (l.group === 'Bank Accounts' || l.group === 'Cash-in-hand') cashBank += balance;
      else if (l.group === 'Sundry Debtors') debtors += balance;
      else if (l.group === 'Sundry Creditors') creditors -= balance;
    });
    
    const { totalIncome, totalExpense } = calculateProfitAndLoss(ledgers, transactions);
    
    filteredVouchers.forEach(v => {
      if (v.type === 'Sale') {
        sales += v.entries.find(e => ledgers.find(l => l.id === e.ledgerId)?.group === 'Sales Accounts')?.amount || 0;
      } else if (v.type === 'Purchase') {
        purchases += v.entries.find(e => ledgers.find(l => l.id === e.ledgerId)?.group === 'Purchase Accounts')?.amount || 0;
      }
    });

    const incomeExpenseData = [
        { label: 'Income', value: totalIncome, color: '#34d399' },
        { label: 'Expense', value: totalExpense, color: '#f87171' },
    ];
    
    return { 
      totalSales: sales, 
      totalPurchases: purchases,
      cashBankBalance: cashBank,
      sundryDebtors: debtors,
      sundryCreditors: creditors,
      incomeExpenseData
    };

  }, [filteredVouchers, ledgers, vouchers, startDate, endDate]);

  if (!startDate || !endDate) {
      return <div className="flex items-center justify-center h-full"><div className="text-xl text-slate-600 dark:text-slate-300">Loading financial period...</div></div>;
  }
  
  const kpiCards = [
    { id: 'sales', title: "Total Sales", value: totalSales, period: "for the period", color: "green", isBalance: false },
    { id: 'purchases', title: "Total Purchases", value: totalPurchases, period: "for the period", color: "orange", isBalance: false },
    { id: 'cash', title: "Cash & Bank", value: cashBankBalance, period: "as on date", color: "sky", isBalance: true },
    { id: 'debtors', title: "Sundry Debtors", value: sundryDebtors, period: "receivables as on date", color: "blue", isBalance: true },
    { id: 'creditors', title: "Sundry Creditors", value: sundryCreditors, period: "payables as on date", color: "red", isBalance: true },
  ];
  
  const orderedVisibleCards = useMemo(() => {
      return (dashboardLayout || [])
        .map(layoutItem => {
            const card = kpiCards.find(c => c.id === layoutItem.id);
            return card ? { ...card, visible: layoutItem.visible } : null;
        })
        .filter(card => card && card.visible);
  }, [dashboardLayout, kpiCards]);

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">Financial overview for <span className="font-semibold text-sky-500 dark:text-sky-400">{formatDate(startDate)}</span> to <span className="font-semibold text-sky-500 dark:text-sky-400">{formatDate(endDate)}</span>.</p>
        </div>
        <button onClick={() => showModal(<DashboardCustomizeModal />)} title="Customize Dashboard" className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <CogIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
         {orderedVisibleCards.map(card => card && <KpiCard key={card.id} title={card.title} value={card.value} currency={details.currencySymbol} period={card.period} color={card.color as any} isBalance={card.isBalance} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlySalesChart data={salesChartData} currency={details.currencySymbol} />
          <MonthlyProfitChart data={profitChartData} currency={details.currencySymbol} />
        </div>
        <DonutChart data={incomeExpenseData} currency={details.currencySymbol} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <TopPartiesList ledgers={ledgers} vouchers={vouchers} startDate={startDate} endDate={endDate} type="Debtors" currency={details.currencySymbol} />
        <TopPartiesList ledgers={ledgers} vouchers={vouchers} startDate={startDate} endDate={endDate} type="Creditors" currency={details.currencySymbol} />
      </div>
    </div>
  );
};

export default Dashboard;
