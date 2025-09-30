
import React, { useMemo } from 'react';
import type { Ledger, Voucher } from '../types';
import { calculateLedgerBalancesForPeriod } from '../utils/accounting';

interface TopPartiesListProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
  startDate: string;
  endDate: string;
  type: 'Debtors' | 'Creditors';
  currency: string;
}

const TopPartiesList: React.FC<TopPartiesListProps> = ({ ledgers, vouchers, startDate, endDate, type, currency }) => {
  const groupName = `Sundry ${type}`;

  const topParties = useMemo(() => {
    const { closingBalances } = calculateLedgerBalancesForPeriod(ledgers, vouchers, startDate, endDate);
    
    return ledgers
      .filter(l => l.group === groupName)
      .map(l => ({
        name: l.name,
        balance: closingBalances.get(l.id) || 0,
      }))
      .filter(p => Math.abs(p.balance) > 0.01)
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 5);
  }, [ledgers, vouchers, startDate, endDate, groupName]);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col min-h-[350px]">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Top 5 {type}</h3>
      {topParties.length > 0 ? (
        <ul className="space-y-3 flex-grow">
          {topParties.map(party => (
            <li key={party.name} className="flex justify-between items-center text-sm">
              <span className="text-slate-700 dark:text-slate-300 truncate pr-4">{party.name}</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {currency} {Math.abs(party.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400">No outstanding {type.toLowerCase()} for this period.</p>
        </div>
      )}
    </div>
  );
};

export default TopPartiesList;
