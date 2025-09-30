
export type CompanyType = 'Private' | 'Public' | 'Proprietor' | 'LLP' | 'Firm' | '';

export interface CompanyDetails {
  name: string;
  address: string;
  country: string;
  state: string;
  pincode: string;
  email: string;
  phone: string;
  financialYear: string;
  currencySymbol: string;
  companyType: CompanyType;
  gstApplicable: boolean;
  gstNo: string;
  tdsApplicable: boolean;
  prevYearTurnover: number | '';
  panNo?: string;
  upiId?: string;
}

export interface Currency {
  id: string;
  name: string; // e.g., US Dollar
  symbol: string; // e.g., $
  code: string; // e.g., USD
}

export interface PriceList {
  id: string;
  name: string; // e.g., Retail, Wholesale
  itemRates: Record<string, number>; // key: stockItemId, value: rate
}

export interface CostCentre {
    id: string;
    name: string;
}

export interface Budget {
    id: string;
    ledgerId: string;
    period: 'Monthly' | 'Yearly';
    // Store monthly budgets in an array
    monthlyAmounts: number[]; // Array of 12 numbers
    year: string; // e.g., 2023-24
}

export interface User {
    id: string;
    name: string;
    // roles/permissions can be added later
}

export interface Ledger {
  id: string;
  name: string;
  group: string;
  openingBalance?: number;
  openingBalanceType?: 'Dr' | 'Cr';
  // Fields for Sundry Creditor/Debtor
  registrationType?: 'Registered' | 'Unregistered';
  address?: string;
  country?: string;
  state?: string;
  pincode?: string;
  gstNo?: string;
  panNo?: string;
  phone?: string;
  email?: string;
  creditLimit?: number;
  contactPersonName?: string;
  contactPersonMobile?: string;
  isBillWise?: boolean; // New: Bill-wise settlement
  creditPeriod?: number; // New: In days, for interest calc
  interestRate?: number; // New: Annual interest rate
  isTcsApplicable?: boolean; // New
  // Fields for Bank Accounts
  bankAccountNo?: string;
  bankIfscCode?: string;
  bankName?: string;
  // Multi-currency
  currencyId?: string; // New: For foreign currency ledgers
  // Price List
  priceListId?: string; // New: For Sundry Debtors
}

export interface BatchAllocation {
  batchNo: string;
  expiryDate?: string;
  quantity: number;
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  hsnCode?: string;
  gstRate?: number;
  reorderLevel?: number;
  isBatchTracked?: boolean; // New
  isSerialTracked?: boolean; // New
  openingStock?: {
    godownId: string;
    quantity: number;
    rate: number;
  }[];
}

export interface Godown {
  id: string;
  name: string;
  location?: string;
}

export interface Salesman {
  id: string;
  name: string;
  contactNo?: string;
  email?: string;
}

export interface InventoryAllocation {
  stockItemId: string;
  quantity: number;
  rate: number;
  godownId?: string;
  batches?: BatchAllocation[]; // New
  serialNumbers?: string[]; // New
}

export interface BillAllocation {
  invoiceId: string; // Id of the voucher being settled
  amount: number;
}

export interface Attachment {
    name: string;
    type: string;
    data: string; // base64
}

export type VoucherType = 
    | 'Sale' | 'Purchase' | 'Payment' | 'Receipt' | 'Journal' 
    | 'Credit Note' | 'Debit Note' | 'Stock Journal'
    | 'Sale Order' | 'Purchase Order' | 'Delivery Note' | 'Receipt Note';

export interface VoucherEntry {
  id: string;
  type: 'Dr' | 'Cr';
  ledgerId: string;
  amount: number;
  inventoryAllocations?: InventoryAllocation[];
  reconciliationDate?: string;
  billAllocations?: BillAllocation[]; // New
}

export interface Voucher {
  id:string;
  date: string;
  type: VoucherType;
  voucherNo: number;
  entries: VoucherEntry[];
  narration: string;
  transactionType?: 'Intra-State' | 'Inter-State';
  ewayBillNo?: string;
  transporterName?: string;
  vehicleNo?: string;
  originalInvoiceNo?: string;
  salesmanId?: string;
  // New features
  linkedVoucherId?: string; // For linking orders/notes to invoices
  attachments?: Attachment[];
  costCentreId?: string;
  tcsLedgerId?: string;
  tcsAmount?: number;
  currencyId?: string;
  exchangeRate?: number;
  isPdc?: boolean; // Post-dated cheque
  // Status for non-accounting vouchers
  status?: 'Open' | 'Closed' | 'Cancelled';
}

// Re-using from InvoiceForm for recurring invoices template
export interface InvoiceItem {
    stockItemId: string;
    quantity: number;
    rate: number;
}

export interface RecurringInvoice {
    id: string;
    partyLedgerId: string;
    mainLedgerId: string;
    items: InvoiceItem[];
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
    startDate: string;
    nextDueDate: string;
    narration: string;
    transactionType: 'Intra-State' | 'Inter-State';
}


export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string; // Changed from 'user'
  action: 'Create' | 'Update' | 'Delete' | 'Login' | 'Logout'; // Added actions
  entity: 'Voucher' | 'Ledger' | 'Stock Item' | 'Company' | 'Godown' | 'Salesman' | 'Currency' | 'PriceList' | 'CostCentre' | 'Budget' | 'User' | 'RecurringInvoice'; // Added entities
  details: string;
}

export interface ChequePrintingConfig {
    width: number;
    height: number;
    payeeX: number;
    payeeY: number;
    dateX: number;
    dateY: number;
    amountWordsX: number;
    amountWordsY: number;
    amountFigX: number;
    amountFigY: number;
}

export interface InvoiceCustomization {
    logo?: string; // base64
    terms?: string;
}

export interface CompanyData {
  details: CompanyDetails;
  ledgers: Ledger[];
  stockItems: StockItem[];
  vouchers: Voucher[];
  auditLogs: AuditLog[];
  godowns: Godown[];
  salesmen: Salesman[];
  chequePrintingConfig?: ChequePrintingConfig;
  // New Entities for advanced features
  currencies: Currency[];
  priceLists: PriceList[];
  costCentres: CostCentre[];
  budgets: Budget[];
  users: User[];
  recurringInvoices: RecurringInvoice[];
  invoiceCustomization: InvoiceCustomization;
  // For dashboard customization
  dashboardLayout?: { id: string; visible: boolean }[];
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}