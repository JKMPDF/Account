
import React, { useContext, useMemo } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useDateRange } from '../context/DateRangeContext';
import { calculateCashFlow } from '../utils/accounting';
import { formatDate } from '../utils/exportUtils';

const SectionRow: React.FC<{ name: string; amount: number; isSubtotal?: boolean }> = ({ name, amount, isSubtotal = false }) => (
    <div className={`flex justify-between py-2 ${isSubtotal ? 'font-semibold border-t border-slate-200 dark:border-slate-700 pt-2' : 'text-slate-700 dark:text-slate-300'}`}>
        <span>{name}</span>
        <span className="font-mono">{amount.toFixed(2)}</span>
    </div>
);

const CashFlowStatement: React.FC = () => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { startDate, endDate } = useDateRange();
    const { ledgers, vouchers } = companyData!;

    const cashFlowData = useMemo(() => {
        return calculateCashFlow(ledgers, vouchers, startDate, endDate);
    }, [ledgers, vouchers, startDate, endDate]);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Cash Flow Statement</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-6">For the period from {formatDate(startDate)} to {formatDate(endDate)}</p>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-w-4xl mx-auto space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-sky-500 dark:text-sky-400 mb-2">Cash Flow from Operating Activities</h2>
                    <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                        {cashFlowData.operating.activities.map(item => <SectionRow key={item.name} name={item.name} amount={item.amount} />)}
                    </div>
                    <SectionRow name="Net Cash from Operating Activities" amount={cashFlowData.operating.total} isSubtotal />
                </div>

                <div>
                    <h2 className="text-xl font-bold text-sky-500 dark:text-sky-400 mb-2">Cash Flow from Investing Activities</h2>
                     <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                        {cashFlowData.investing.activities.map(item => <SectionRow key={item.name} name={item.name} amount={item.amount} />)}
                    </div>
                    <SectionRow name="Net Cash from Investing Activities" amount={cashFlowData.investing.total} isSubtotal />
                </div>

                <div>
                    <h2 className="text-xl font-bold text-sky-500 dark:text-sky-400 mb-2">Cash Flow from Financing Activities</h2>
                     <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                        {cashFlowData.financing.activities.map(item => <SectionRow key={item.name} name={item.name} amount={item.amount} />)}
                    </div>
                    <SectionRow name="Net Cash from Financing Activities" amount={cashFlowData.financing.total} isSubtotal />
                </div>
                
                <div className="border-t-2 border-slate-300 dark:border-slate-600 pt-4 space-y-2">
                    <SectionRow name="Net Increase/Decrease in Cash" amount={cashFlowData.netChange} />
                    <SectionRow name="Cash at beginning of period" amount={cashFlowData.openingBalance} />
                    <div className="flex justify-between py-2 font-bold text-lg text-slate-800 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-600 pt-3">
                        <span>Cash at end of period</span>
                        <span className="font-mono">{cashFlowData.closingBalance.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashFlowStatement;
