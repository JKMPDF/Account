

import type { Ledger, Voucher, StockItem, InventoryAllocation, VoucherEntry, Godown, Salesman } from '../types';

export const GROUP_TYPES = {
  ASSET: ['Current Assets', 'Bank Accounts', 'Cash-in-hand', 'Deposits (Asset)', 'Loans & Advances (Asset)', 'Stock-in-hand', 'Sundry Debtors', 'Fixed Assets', 'Investments', 'Suspense A/c'],
  LIABILITY: ['Current Liabilities', 'Duties & Taxes', 'Provisions', 'Sundry Creditors', 'Bank OD A/c', 'Loans (Liability)', 'Secured Loans', 'Unsecured Loans'],
  EQUITY: ['Capital Account', 'Reserves & Surplus'],
  INCOME: ['Sales Accounts', 'Direct Incomes', 'Indirect Incomes'],
  EXPENSE: ['Purchase Accounts', 'Direct Expenses', 'Indirect Expenses'],
};

export const BALANCE_SHEET_STRUCTURE = {
  LIABILITIES: {
    'Capital Account': ['Capital Account'],
    'Loans (Liability)': ['Loans (Liability)', 'Secured Loans', 'Unsecured Loans', 'Bank OD A/c'],
    'Current Liabilities': ['Current Liabilities', 'Duties & Taxes', 'Provisions', 'Sundry Creditors'],
    'Reserves & Surplus': ['Reserves & Surplus'],
  },
  ASSETS: {
    'Fixed Assets': ['Fixed Assets'],
    'Investments': ['Investments'],
    'Current Assets': ['Current Assets', 'Bank Accounts', 'Cash-in-hand', 'Deposits (Asset)', 'Loans & Advances (Asset)', 'Stock-in-hand', 'Sundry Debtors'],
    'Suspense A/c': ['Suspense A/c']
  }
};

// FIX: Add missing ReportRowData interface.
export interface ReportRowData {
  id: string;
  title: string;
  total: number;
  children?: ReportRowData[];
  ledgers?: { id: string; name: string; balance: number }[];
}

export const PL_STRUCTURE = {
    INCOME: {
        'Revenue from Operations': ['Sales Accounts', 'Direct Incomes'],
        'Other Income': ['Indirect Incomes'],
    },
    EXPENSE: {
        'Cost of Materials Consumed': ['Purchase Accounts'],
        'Other Expenses': ['Direct Expenses', 'Indirect Expenses'],
    }
};

export const getGroupType = (group: string): keyof typeof GROUP_TYPES | 'UNKNOWN' => {
  for (const type in GROUP_TYPES) {
    if ((GROUP_TYPES as any)[type].includes(group)) {
      return type as keyof typeof GROUP_TYPES;
    }
  }
  return 'UNKNOWN';
};

// New comprehensive balance calculation for a period
export const calculateLedgerBalancesForPeriod = (ledgers: Ledger[], vouchers: Voucher[], startDate: string, endDate: string) => {
  const openingBalances = new Map<string, number>();
  const transactions = new Map<string, number>();
  const closingBalances = new Map<string, number>();

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Include the entire end day

  // 1. Initialize with ledger opening balances
  ledgers.forEach(l => {
    let openingBalance = 0;
    if (l.openingBalance && l.openingBalanceType) {
        const amount = Number(l.openingBalance) || 0;
        openingBalance = l.openingBalanceType === 'Dr' ? amount : -amount;
    }
    openingBalances.set(l.id, openingBalance);
  });

  // 2. Process vouchers before the start date to get the opening balance for the period
  vouchers.forEach(v => {
    if (new Date(v.date) < start) {
      v.entries.forEach(entry => {
        const currentBalance = openingBalances.get(entry.ledgerId) || 0;
        const amount = Number(entry.amount) || 0;
        const newBalance = entry.type === 'Dr' ? currentBalance + amount : currentBalance - amount;
        openingBalances.set(entry.ledgerId, newBalance);
      });
    }
  });

  // 3. Process transactions within the date range
  vouchers.forEach(v => {
    const vDate = new Date(v.date);
    if (vDate >= start && vDate <= end) {
      v.entries.forEach(entry => {
        const currentTransaction = transactions.get(entry.ledgerId) || 0;
        const amount = Number(entry.amount) || 0;
        const newTransaction = entry.type === 'Dr' ? currentTransaction + amount : currentTransaction - amount;
        transactions.set(entry.ledgerId, newTransaction);
      });
    }
  });
  
  // 4. Calculate closing balances
  ledgers.forEach(l => {
    const ob = openingBalances.get(l.id) || 0;
    const trans = transactions.get(l.id) || 0;
    closingBalances.set(l.id, ob + trans);
  });
  
  return { openingBalances, transactions, closingBalances };
};


// Calculate Profit & Loss for the period
export const calculateProfitAndLoss = (ledgers: Ledger[], ledgerTransactions: Map<string, number>) => {
    let totalIncome = 0;
    let totalExpense = 0;

    const incomeLedgers: {name: string, balance: number}[] = [];
    const expenseLedgers: {name: string, balance: number}[] = [];

    ledgers.forEach(ledger => {
        const groupType = getGroupType(ledger.group);
        const transactionAmount = ledgerTransactions.get(ledger.id) || 0;

        if (groupType === 'INCOME') {
            const incomeAmount = -transactionAmount;
            if (incomeAmount !== 0) {
                totalIncome += incomeAmount;
                incomeLedgers.push({ name: ledger.name, balance: incomeAmount });
            }
        } else if (groupType === 'EXPENSE') {
            if (transactionAmount !== 0) {
                totalExpense += transactionAmount;
                expenseLedgers.push({ name: ledger.name, balance: transactionAmount });
            }
        }
    });

    const netProfit = totalIncome - totalExpense;
    return { incomeLedgers, expenseLedgers, totalIncome, totalExpense, netProfit };
};


// Calculate Balance Sheet as on the end date
export const calculateBalanceSheet = (ledgers: Ledger[], ledgerClosingBalances: Map<string, number>, netProfitForPeriod: number) => {
    let totalAssets = 0;
    let totalLiabilities = 0;

    const assetLedgers: {name: string, balance: number, group: string}[] = [];
    const liabilityLedgers: {name: string, balance: number, group: string}[] = [];
    
    ledgers.forEach(ledger => {
        const groupType = getGroupType(ledger.group);
        const balance = ledgerClosingBalances.get(ledger.id) || 0;

        if (balance === 0 && getGroupType(ledger.group) !== 'EQUITY') return;

        if (groupType === 'ASSET') {
            if(balance !== 0) {
              totalAssets += balance;
              assetLedgers.push({ name: ledger.name, balance, group: ledger.group });
            }
        } else if (groupType === 'LIABILITY' || groupType === 'EQUITY') {
            const liabilityAmount = -balance;
            totalLiabilities += liabilityAmount;
            // For P&L, we add profit for the period to the opening liability.
            // The logic below already handles this by adding net profit separately.
            // So we don't double-add it here.
            liabilityLedgers.push({ name: ledger.name, balance: liabilityAmount, group: ledger.group });
        }
    });

    // Add P&L for the period to liabilities side
    if (netProfitForPeriod !== 0) {
      const profitAndLossItem = { name: 'Profit & Loss A/c (Period)', balance: netProfitForPeriod, group: 'Reserves & Surplus' };
      totalLiabilities += netProfitForPeriod;
      liabilityLedgers.push(profitAndLossItem);
    }
    
    const groupedAssets = assetLedgers.reduce((acc, item) => {
        (acc[item.group] = acc[item.group] || []).push(item);
        return acc;
    }, {} as Record<string, {name: string; balance: number}[]>);

    const groupedLiabilities = liabilityLedgers.reduce((acc, item) => {
        (acc[item.group] = acc[item.group] || []).push(item);
        return acc;
    }, {} as Record<string, {name: string; balance: number}[]>);

    return { groupedAssets, groupedLiabilities, totalAssets, totalLiabilities };
};

// FIX: Add missing calculateCashFlow function
export const calculateCashFlow = (ledgers: Ledger[], vouchers: Voucher[], startDate: string, endDate: string) => {
    const cashAndBankLedgerIds = new Set(ledgers.filter(l => l.group === 'Cash-in-hand' || l.group === 'Bank Accounts' || l.group === 'Bank OD A/c').map(l => l.id));
    const ledgerMap = new Map(ledgers.map(l => [l.id, l]));

    const { openingBalances, closingBalances } = calculateLedgerBalancesForPeriod(ledgers, vouchers, startDate, endDate);

    let openingBalance = 0;
    let closingBalance = 0;

    for (const id of cashAndBankLedgerIds) {
        openingBalance += openingBalances.get(id) || 0;
        closingBalance += closingBalances.get(id) || 0;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const periodVouchers = vouchers.filter(v => {
        const vDate = new Date(v.date);
        return vDate >= start && vDate <= end;
    });

    const operating = { total: 0, activities: new Map<string, number>() };
    const investing = { total: 0, activities: new Map<string, number>() };
    const financing = { total: 0, activities: new Map<string, number>() };

    periodVouchers.forEach(v => {
        const cashEntry = v.entries.find(e => cashAndBankLedgerIds.has(e.ledgerId));
        if (!cashEntry) return;

        const isContra = v.entries.every(e => cashAndBankLedgerIds.has(e.ledgerId));
        if (isContra) return;

        const cashInflow = cashEntry.type === 'Dr' ? cashEntry.amount : -cashEntry.amount;

        v.entries.forEach(otherEntry => {
            if (cashAndBankLedgerIds.has(otherEntry.ledgerId)) return;
            
            const ledger = ledgerMap.get(otherEntry.ledgerId);
            if (!ledger) return;

            let activityMap: Map<string, number> | undefined;
            if (['Fixed Assets', 'Investments'].includes(ledger.group)) {
                activityMap = investing.activities;
            } else if (['Capital Account', 'Loans (Liability)', 'Secured Loans', 'Unsecured Loans'].includes(ledger.group)) {
                activityMap = financing.activities;
            } else {
                activityMap = operating.activities;
            }
            
            const currentAmount = activityMap.get(ledger.group) || 0;
            activityMap.set(ledger.group, currentAmount + cashInflow);
        });
    });

    operating.total = Array.from(operating.activities.values()).reduce((s, a) => s + a, 0);
    investing.total = Array.from(investing.activities.values()).reduce((s, a) => s + a, 0);
    financing.total = Array.from(financing.activities.values()).reduce((s, a) => s + a, 0);

    return {
        operating: { total: operating.total, activities: Array.from(operating.activities.entries()).map(([name, amount]) => ({ name, amount })) },
        investing: { total: investing.total, activities: Array.from(investing.activities.entries()).map(([name, amount]) => ({ name, amount })) },
        financing: { total: financing.total, activities: Array.from(financing.activities.entries()).map(([name, amount]) => ({ name, amount })) },
        openingBalance,
        closingBalance,
        netChange: closingBalance - openingBalance,
    };
};

// FIX: Replace calculateStockSummary with a version that handles Godowns
export const calculateStockSummary = (stockItems: StockItem[], vouchers: Voucher[], godowns: Godown[], startDate: string, endDate: string) => {
    type SummaryState = {
        openingQty: number; openingValue: number;
        inwardQty: number; inwardValue: number;
        outwardQty: number; outwardValue: number;
        closingQty: number; closingValue: number;
    };

    type StockSummaryData = {
        total: SummaryState;
        godowns: Map<string, SummaryState>;
    };

    const summary = new Map<string, StockSummaryData>();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const initialSummaryState = (): SummaryState => ({
        openingQty: 0, openingValue: 0,
        inwardQty: 0, inwardValue: 0,
        outwardQty: 0, outwardValue: 0,
        closingQty: 0, closingValue: 0,
    });

    stockItems.forEach(item => {
        summary.set(item.id, {
            total: initialSummaryState(),
            godowns: new Map<string, SummaryState>(),
        });
    });

    const processAllocation = (alloc: InventoryAllocation, voucherType: Voucher['type'], entryType: VoucherEntry['type'], isOpening: boolean) => {
        const itemSummary = summary.get(alloc.stockItemId);
        if (!itemSummary) return;

        const godownId = alloc.godownId || 'none';
        if (!itemSummary.godowns.has(godownId)) {
            itemSummary.godowns.set(godownId, initialSummaryState());
        }
        const godownSummary = itemSummary.godowns.get(godownId)!;
        const value = alloc.quantity * alloc.rate;

        let direction: 'inward' | 'outward' | 'none' = 'none';
        if (voucherType === 'Purchase' || voucherType === 'Credit Note') direction = 'inward';
        else if (voucherType === 'Sale' || voucherType === 'Debit Note') direction = 'outward';
        else if (voucherType === 'Stock Journal') direction = entryType === 'Dr' ? 'inward' : 'outward';

        if (direction === 'inward') {
            if (isOpening) {
                godownSummary.openingQty += alloc.quantity;
                godownSummary.openingValue += value;
            } else {
                godownSummary.inwardQty += alloc.quantity;
                godownSummary.inwardValue += value;
            }
        } else if (direction === 'outward') {
            if (isOpening) {
                godownSummary.openingQty -= alloc.quantity;
                godownSummary.openingValue -= value;
            } else {
                godownSummary.outwardQty += alloc.quantity;
                godownSummary.outwardValue += value;
            }
        }
    };

    vouchers.forEach(v => {
        const vDate = new Date(v.date);
        const isOpening = vDate < start;
        const isInPeriod = vDate >= start && vDate <= end;
        if (!isOpening && !isInPeriod) return;
        v.entries.forEach(e => e.inventoryAllocations?.forEach(alloc => processAllocation(alloc, v.type, e.type, isOpening)));
    });

    stockItems.forEach(item => {
        const itemSummary = summary.get(item.id);
        if (itemSummary) {
            itemSummary.godowns.forEach(godownSummary => {
                godownSummary.closingQty = godownSummary.openingQty + godownSummary.inwardQty - godownSummary.outwardQty;
                const totalInQty = godownSummary.openingQty + godownSummary.inwardQty;
                const totalInValue = godownSummary.openingValue + godownSummary.inwardValue;
                const avgCost = totalInQty > 0 ? totalInValue / totalInQty : 0;
                const calculatedOutValue = godownSummary.outwardQty * avgCost;
                godownSummary.closingValue = totalInValue - calculatedOutValue;

                itemSummary.total.openingQty += godownSummary.openingQty;
                itemSummary.total.openingValue += godownSummary.openingValue;
                itemSummary.total.inwardQty += godownSummary.inwardQty;
                itemSummary.total.inwardValue += godownSummary.inwardValue;
                itemSummary.total.outwardQty += godownSummary.outwardQty;
                itemSummary.total.outwardValue += godownSummary.outwardValue; // Note: using actual value from vouchers for total
            });

            itemSummary.total.closingQty = itemSummary.total.openingQty + itemSummary.total.inwardQty - itemSummary.total.outwardQty;
            const totalInQty = itemSummary.total.openingQty + itemSummary.total.inwardQty;
            const totalInValue = itemSummary.total.openingValue + itemSummary.total.inwardValue;
            const avgCost = totalInQty > 0 ? totalInValue / totalInQty : 0;
            const calculatedOutValue = itemSummary.total.outwardQty * avgCost;
            itemSummary.total.closingValue = totalInValue - calculatedOutValue;
        }
    });

    return summary;
};

export const calculateMonthlySalesAndProfit = (ledgers: Ledger[], vouchers: Voucher[], startDate: string, endDate: string) => {
    const months: { name: string, year: number, month: number, sales: number, profit: number }[] = [];
    const start = new Date(startDate);
    // Ensure the end date includes the entire last day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let current = new Date(start);
    while (current <= end) {
        months.push({
            name: current.toLocaleString('default', { month: 'short' }),
            year: current.getFullYear(),
            month: current.getMonth(),
            sales: 0,
            profit: 0
        });
        current.setMonth(current.getMonth() + 1);
        if (current.getFullYear() > end.getFullYear() || (current.getFullYear() === end.getFullYear() && current.getMonth() > end.getMonth())) {
            break;
        }
    }

    const ledgerMap = new Map(ledgers.map(l => [l.id, l]));

    months.forEach(month => {
        const monthStart = new Date(month.year, month.month, 1);
        const monthEnd = new Date(month.year, month.month + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthlyVouchers = vouchers.filter(v => {
            const vDate = new Date(v.date);
            return vDate >= monthStart && vDate <= monthEnd;
        });

        if (monthlyVouchers.length === 0) return;

        let monthlyIncome = 0;
        let monthlyExpense = 0;

        monthlyVouchers.forEach(v => {
            v.entries.forEach(e => {
                const ledger = ledgerMap.get(e.ledgerId);
                if (!ledger) return;

                const groupType = getGroupType(ledger.group);

                if (groupType === 'INCOME') {
                    monthlyIncome += e.type === 'Cr' ? e.amount : -e.amount;
                } else if (groupType === 'EXPENSE') {
                    monthlyExpense += e.type === 'Dr' ? e.amount : -e.amount;
                }

                if (ledger.group === 'Sales Accounts') {
                   if (v.type === 'Sale' || v.type === 'Debit Note') { // Debit note to party increases sales value
                        month.sales += e.type === 'Cr' ? e.amount : 0;
                   } else if (v.type === 'Credit Note') { // Credit Note (Sales Return)
                        month.sales -= e.type === 'Dr' ? e.amount : 0;
                   }
                }
            });
        });

        month.profit = monthlyIncome - monthlyExpense;
    });

    return months;
};

// FIX: Add missing calculateSalesByCustomer function
export const calculateSalesByCustomer = (ledgers: Ledger[], vouchers: Voucher[], stockItems: StockItem[], startDate: string, endDate: string) => {
    const customerLedgers = ledgers.filter(l => l.group === 'Sundry Debtors');
    const customerLedgerIds = new Set(customerLedgers.map(l => l.id));
    const ledgerMap = new Map(ledgers.map(l => [l.id, l.name]));

    const salesData = new Map<string, { totalQuantity: number, totalValue: number }>();

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const salesVouchers = vouchers.filter(v => {
        const vDate = new Date(v.date);
        return v.type === 'Sale' && vDate >= start && vDate <= end;
    });

    salesVouchers.forEach(v => {
        const customerEntry = v.entries.find(e => customerLedgerIds.has(e.ledgerId));
        if (!customerEntry) return;

        const salesEntry = v.entries.find(e => {
            const ledger = ledgers.find(l => l.id === e.ledgerId);
            return ledger?.group === 'Sales Accounts';
        });

        if (salesEntry && salesEntry.inventoryAllocations) {
            const customerId = customerEntry.ledgerId;
            const currentData = salesData.get(customerId) || { totalQuantity: 0, totalValue: 0 };
            
            salesEntry.inventoryAllocations.forEach(alloc => {
                currentData.totalQuantity += alloc.quantity;
                currentData.totalValue += alloc.quantity * alloc.rate;
            });

            salesData.set(customerId, currentData);
        }
    });

    return Array.from(salesData.entries()).map(([customerId, data]) => ({
        customerId,
        customerName: ledgerMap.get(customerId) || 'Unknown',
        totalQuantity: data.totalQuantity,
        totalValue: data.totalValue,
        averagePrice: data.totalQuantity > 0 ? data.totalValue / data.totalQuantity : 0,
    })).sort((a, b) => b.totalValue - a.totalValue);
};

// FIX: Add missing calculateSalesBySalesman function
export const calculateSalesBySalesman = (salesmen: Salesman[], vouchers: Voucher[], stockItems: StockItem[], startDate: string, endDate: string) => {
    const salesmanMap = new Map(salesmen.map(s => [s.id, s.name]));
    const salesData = new Map<string, { totalValue: number, invoiceCount: number }>();

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const salesVouchersWithSalesman = vouchers.filter(v => {
        const vDate = new Date(v.date);
        return v.type === 'Sale' && v.salesmanId && vDate >= start && vDate <= end;
    });

    salesVouchersWithSalesman.forEach(v => {
        const salesmanId = v.salesmanId!;
        const totalValue = v.entries.filter(e => e.type === 'Dr').reduce((sum, e) => sum + e.amount, 0);
        
        const currentData = salesData.get(salesmanId) || { totalValue: 0, invoiceCount: 0 };
        currentData.totalValue += totalValue;
        currentData.invoiceCount += 1;
        salesData.set(salesmanId, currentData);
    });

    return Array.from(salesData.entries()).map(([salesmanId, data]) => ({
        salesmanId,
        salesmanName: salesmanMap.get(salesmanId) || 'Unknown',
        ...data,
    })).sort((a, b) => b.totalValue - a.totalValue);
};

// FIX: Add missing generateSchedule3BalanceSheetData function.
export const generateSchedule3BalanceSheetData = (ledgers: Ledger[], closingBalances: Map<string, number>, netProfit: number): ReportRowData[] => {
    const data: { [key: string]: { [key: string]: { name: string, balance: number }[] } } = {
        LIABILITIES: {},
        ASSETS: {}
    };

    ledgers.forEach(ledger => {
        const balance = closingBalances.get(ledger.id) || 0;
        if (Math.abs(balance) < 0.01 && getGroupType(ledger.group) !== 'EQUITY') return;

        for (const side in BALANCE_SHEET_STRUCTURE) {
            for (const head in (BALANCE_SHEET_STRUCTURE as any)[side]) {
                if ((BALANCE_SHEET_STRUCTURE as any)[side][head].includes(ledger.group)) {
                    if (!data[side][head]) data[side][head] = [];
                    data[side][head].push({ name: ledger.name, balance: getGroupType(ledger.group) === 'ASSET' ? balance : -balance });
                }
            }
        }
    });

    // Add profit/loss to Reserves & Surplus
    if (netProfit !== 0) {
        if (!data.LIABILITIES['Reserves & Surplus']) data.LIABILITIES['Reserves & Surplus'] = [];
        data.LIABILITIES['Reserves & Surplus'].push({ name: 'Profit & Loss A/c (Period)', balance: netProfit });
    }

    const mapToReportRow = (side: 'LIABILITIES' | 'ASSETS', title: string): ReportRowData => {
        const mainHead: ReportRowData = {
            id: side.toLowerCase(),
            title: title,
            total: 0,
            children: []
        };

        for (const head in (BALANCE_SHEET_STRUCTURE as any)[side]) {
            const ledgersUnderHead = data[side][head] || [];
            if (ledgersUnderHead.length > 0) {
                const headTotal = ledgersUnderHead.reduce((sum, l) => sum + l.balance, 0);
                mainHead.children?.push({
                    id: `${side.toLowerCase()}-${head.replace(/ /g, '-')}`,
                    title: head,
                    total: headTotal,
                    ledgers: ledgersUnderHead.map(l => ({ ...l, id: l.name }))
                });
            }
        }
        
        mainHead.total = mainHead.children?.reduce((sum, c) => sum + c.total, 0) || 0;
        return mainHead;
    };
    
    return [
        mapToReportRow('LIABILITIES', 'EQUITY AND LIABILITIES'),
        mapToReportRow('ASSETS', 'ASSETS')
    ];
};

// FIX: Add missing generateSchedule3PLData function.
export const generateSchedule3PLData = (ledgers: Ledger[], transactions: Map<string, number>): ReportRowData[] => {
    const data: { [key: string]: { [key: string]: { name: string, balance: number }[] } } = {
        INCOME: {},
        EXPENSE: {}
    };

    ledgers.forEach(ledger => {
        const transactionAmount = transactions.get(ledger.id) || 0;
        if (Math.abs(transactionAmount) < 0.01) return;

        for (const side in PL_STRUCTURE) {
            for (const head in (PL_STRUCTURE as any)[side]) {
                if ((PL_STRUCTURE as any)[side][head].includes(ledger.group)) {
                    if (!data[side][head]) data[side][head] = [];
                    const balance = side === 'INCOME' ? -transactionAmount : transactionAmount;
                    data[side][head].push({ name: ledger.name, balance });
                }
            }
        }
    });

    const mapToReportRow = (side: 'INCOME' | 'EXPENSE', title: string): ReportRowData => {
        const mainHead: ReportRowData = {
            id: side.toLowerCase(),
            title: title,
            total: 0,
            children: []
        };
        for (const head in (PL_STRUCTURE as any)[side]) {
            const ledgersUnderHead = data[side][head] || [];
            if (ledgersUnderHead.length > 0) {
                 const headTotal = ledgersUnderHead.reduce((sum, l) => sum + l.balance, 0);
                 mainHead.children?.push({
                    id: `${side.toLowerCase()}-${head.replace(/ /g, '-')}`,
                    title: head,
                    total: headTotal,
                    ledgers: ledgersUnderHead.map(l => ({ ...l, id: l.name }))
                });
            }
        }
        mainHead.total = mainHead.children?.reduce((sum, c) => sum + c.total, 0) || 0;
        return mainHead;
    };

    const incomeData = mapToReportRow('INCOME', 'I. Revenue');
    const expenseData = mapToReportRow('EXPENSE', 'II. Expenses');
    const netProfit = incomeData.total - expenseData.total;
    
    const profitData: ReportRowData = {
        id: 'profit',
        title: netProfit >= 0 ? 'III. Profit for the period' : 'III. Loss for the period',
        total: netProfit
    };

    return [incomeData, expenseData, profitData];
};
