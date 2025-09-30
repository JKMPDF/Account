import type { Voucher, CompanyData, Ledger, StockItem } from '../types';
import { formatDate, numberToWords } from './exportUtils';

declare const jspdf: any;
declare const QRCode: any;

const safeGeneratePdf = (generationLogic: () => void, onComplete?: () => void) => {
    try {
        if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') throw new Error("PDF library (jspdf) is not loaded.");
        if (typeof (jspdf.jsPDF.API as any).autoTable !== 'function') throw new Error("PDF table plugin (autotable) is not loaded.");
        generationLogic();
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert(`An error occurred while generating the PDF: ${(error as Error).message}`);
    } finally {
        if(onComplete) onComplete();
    }
};

const safeText = (text: any): string => String(text ?? '');

const generateHeader = (doc: any, companyDetails: CompanyData['details'], title: string) => {
    doc.setFontSize(18); doc.setFont(undefined, 'bold');
    doc.text(safeText(companyDetails.name), 105, 15, { align: 'center' });
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(safeText(companyDetails.address), 105, 22, { align: 'center' });
    doc.setFontSize(14); doc.setFont(undefined, 'bold');
    doc.text(safeText(title), 105, 35, { align: 'center' });
    doc.setLineWidth(0.5); doc.line(15, 38, 195, 38);
};

const generateInvoicePDF = (voucher: Voucher, companyData: CompanyData, doc: any, isMulti: boolean = false) => {
    const { details: company, ledgers, stockItems, salesmen, invoiceCustomization } = companyData;
    const ledgerMap = new Map(ledgers.map(l => [l.id, l]));
    const stockItemMap = new Map(stockItems.map(i => [i.id, i]));
    const salesmanMap = new Map(salesmen.map(s => [s.id, s.name]));
    
    if(!isMulti) { doc.addPage(); doc.deletePage(1); } else { doc.addPage(); }

    const partyEntry = voucher.entries.find(e => ['Sundry Debtors', 'Sundry Creditors', 'Bank Accounts', 'Cash-in-hand'].includes(ledgerMap.get(e.ledgerId)?.group || ''));
    const mainEntry = voucher.entries.find(e => ledgerMap.get(e.ledgerId)?.group === (voucher.type === 'Sale' || voucher.type === 'Credit Note' ? 'Sales Accounts' : 'Purchase Accounts'));
    const partyLedger = ledgerMap.get(partyEntry?.ledgerId || '');

    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
    const MARGIN = 15;
    const LEFT_MARGIN = MARGIN; const RIGHT_MARGIN = PAGE_WIDTH - MARGIN;
    const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
    const COL1_X = LEFT_MARGIN; const COL2_X = LEFT_MARGIN + CONTENT_WIDTH / 2;
    
    const headingColor = '#1E293B'; const textColor = '#334155';
    const lightTextColor = '#64748B'; const borderColor = '#E2E8F0';
    let y = 20;

    // --- HEADER ---
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(headingColor);
    doc.text('TAX INVOICE', RIGHT_MARGIN, y, { align: 'right' });
    
    if (invoiceCustomization?.logo) {
      try {
        doc.addImage(invoiceCustomization.logo, 'PNG', LEFT_MARGIN, y-8, 30, 15, undefined, 'FAST');
      } catch (e) { console.error("Could not add logo", e); }
    }
    
    y += 12;
    doc.setDrawColor(borderColor); doc.setLineWidth(0.5);
    doc.line(LEFT_MARGIN, y, RIGHT_MARGIN, y); y += 10;
    
    // --- COMPANY AND PARTY DETAILS ---
    let col1Y = y; let col2Y = y;
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(lightTextColor); doc.text('FROM:', COL1_X, col1Y); col1Y += 5;
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(textColor);
    
    const companyContent = [
        safeText(company.name).toUpperCase(),
        ...doc.splitTextToSize(safeText(company.address), CONTENT_WIDTH / 2 - 5),
        `GSTIN: ${safeText(company.gstNo)}`,
        `PAN: ${safeText(company.panNo)}`,
        `Email: ${safeText(company.email)}`,
        `Phone: ${safeText(company.phone)}`
    ].filter(line => line && !line.endsWith(': '));
    doc.text(companyContent, COL1_X, col1Y);
    col1Y += (companyContent.length * 5);

    if (partyLedger) {
        doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(lightTextColor); doc.text('BILL TO:', COL2_X, col2Y); col2Y += 5;
        doc.setFont('Helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(textColor);
        const partyContent = [ safeText(partyLedger.name), ...doc.splitTextToSize(safeText(partyLedger.address), CONTENT_WIDTH / 2 - 5), `GSTIN: ${safeText(partyLedger.gstNo) || 'N/A'}` ].filter(Boolean);
        doc.text(partyContent, COL2_X, col2Y); col2Y += (partyContent.length * 5);
    }
    
    col2Y += 5; doc.setDrawColor(borderColor); doc.line(COL2_X, col2Y, RIGHT_MARGIN, col2Y); col2Y += 5;
    const invoiceMeta = [ { label: 'Invoice No.', value: safeText(voucher.voucherNo) }, { label: 'Invoice Date', value: formatDate(voucher.date) }];
    if (voucher.originalInvoiceNo) invoiceMeta.push({ label: 'Original Inv No.', value: safeText(voucher.originalInvoiceNo) });
    if (voucher.salesmanId) invoiceMeta.push({ label: 'Salesman', value: salesmanMap.get(voucher.salesmanId) || '' });
    
    doc.setFontSize(10);
    invoiceMeta.forEach(item => {
        doc.setFont('Helvetica', 'bold'); doc.setTextColor(textColor); doc.text(item.label, COL2_X, col2Y);
        doc.setFont('Helvetica', 'normal'); doc.text(item.value, COL2_X + 35, col2Y); col2Y += 6;
    });

    y = Math.max(col1Y, col2Y) + 10;

    // --- ITEMS TABLE ---
    const tableBody: any[] = [];
    mainEntry?.inventoryAllocations?.forEach((alloc, index) => {
        const stock = stockItemMap.get(alloc.stockItemId);
        tableBody.push([ index + 1, `${safeText(stock?.name)}\nHSN: ${safeText(stock?.hsnCode)}`, safeText(stock?.unit), alloc.quantity.toFixed(2), alloc.rate.toFixed(2), (alloc.quantity * alloc.rate).toFixed(2) ]);
    });

    (doc as any).autoTable({ startY: y, head: [['#', 'ITEM & HSN', 'UNIT', 'QTY', 'RATE', 'AMOUNT']], body: tableBody, theme: 'grid', headStyles: { fillColor: headingColor, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 }, styles: { fontSize: 9, cellPadding: 2.5, valign: 'middle' }, columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }, margin: { left: MARGIN, right: MARGIN } });

    let finalY = (doc as any).lastAutoTable.finalY;
    
    // --- TOTALS SECTION ---
    const cgst = voucher.entries.find(e => ledgerMap.get(e.ledgerId)?.name.toLowerCase() === 'cgst')?.amount || 0;
    const sgst = voucher.entries.find(e => ledgerMap.get(e.ledgerId)?.name.toLowerCase() === 'sgst')?.amount || 0;
    const igst = voucher.entries.find(e => ledgerMap.get(e.ledgerId)?.name.toLowerCase() === 'igst')?.amount || 0;
    const grandTotal = partyEntry?.amount || 0;
    const subTotal = grandTotal - (cgst+sgst+igst);
    
    const totalsData = [ { label: 'Subtotal', value: subTotal.toFixed(2) }, ...(cgst > 0 ? [{ label: `CGST`, value: cgst.toFixed(2) }] : []), ...(sgst > 0 ? [{ label: `SGST`, value: sgst.toFixed(2) }] : []), ...(igst > 0 ? [{ label: `IGST`, value: igst.toFixed(2) }] : []) ];
    let totalsY = finalY + 8;
    const totalsLabelX = RIGHT_MARGIN - 60; const totalsValueX = RIGHT_MARGIN;
    doc.setFontSize(10);
    totalsData.forEach(item => { doc.setFont('Helvetica', 'normal'); doc.setTextColor(textColor); doc.text(item.label, totalsLabelX, totalsY, { align: 'left' }); doc.text(item.value, totalsValueX, totalsY, { align: 'right' }); totalsY += 6; });
    totalsY += 2; doc.setLineWidth(0.5); doc.line(totalsLabelX - 2, totalsY, RIGHT_MARGIN, totalsY); totalsY += 6;
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(headingColor);
    doc.text('GRAND TOTAL', totalsLabelX, totalsY, { align: 'left' }); doc.text(company.currencySymbol + ' ' + grandTotal.toFixed(2), totalsValueX, totalsY, { align: 'right' });
    
    // --- FOOTER SECTION ---
    let leftFooterY = finalY + 10;

    doc.setFontSize(9); doc.setTextColor(lightTextColor);
    doc.text('Total Amount in Words:', LEFT_MARGIN, leftFooterY);
    doc.setFont('Helvetica', 'normal'); doc.setTextColor(textColor);
    const amountWords = doc.splitTextToSize(numberToWords(grandTotal), CONTENT_WIDTH / 2 - 10);
    doc.text(amountWords, LEFT_MARGIN, leftFooterY + 5);
    leftFooterY += (amountWords.length * 4) + 5;
    
    if (company.upiId && grandTotal > 0) {
        leftFooterY = Math.max(leftFooterY, totalsY) + 10;
        try {
            const upiString = `upi://pay?pa=${company.upiId}&pn=${encodeURIComponent(company.name)}&am=${grandTotal.toFixed(2)}&cu=INR`;
            const tempDiv = document.createElement('div');
            tempDiv.style.display = 'none';
            document.body.appendChild(tempDiv);
            
            new QRCode(tempDiv, { text: upiString, width: 96, height: 96, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
            
            const canvas = tempDiv.querySelector('canvas');
            if (canvas) {
                const qrDataUrl = canvas.toDataURL('image/png');
                doc.setFontSize(9);
                doc.setTextColor(lightTextColor);
                doc.text("Scan to Pay:", LEFT_MARGIN, leftFooterY);
                doc.addImage(qrDataUrl, 'PNG', LEFT_MARGIN, leftFooterY + 2, 30, 30);
                leftFooterY += 35;
            }
            document.body.removeChild(tempDiv);
        } catch (e) { console.error("Failed to generate QR Code:", e); }
    }

    let bottomY = PAGE_HEIGHT - MARGIN;
    
    doc.setFont('Helvetica', 'bold');
    doc.text(`For ${company.name}`, RIGHT_MARGIN, bottomY - 15, { align: 'right' });
    doc.text('Authorised Signatory', RIGHT_MARGIN, bottomY, { align: 'right' });
    
    if (invoiceCustomization?.terms) {
        bottomY -= 25; // make space for terms
        doc.setDrawColor(borderColor); doc.line(LEFT_MARGIN, bottomY - 2, RIGHT_MARGIN, bottomY -2);
        doc.setFontSize(8); doc.setTextColor(lightTextColor);
        doc.text("Terms & Conditions:", LEFT_MARGIN, bottomY);
        doc.setFont('Helvetica', 'normal'); doc.setTextColor(textColor);
        const termsLines = doc.splitTextToSize(invoiceCustomization.terms, CONTENT_WIDTH);
        doc.text(termsLines, LEFT_MARGIN, bottomY + 4);
    }
};

const generateJournalPDF = (voucher: Voucher, companyData: CompanyData, doc: any, isMulti: boolean = false) => {
    const { details: companyDetails, ledgers } = companyData;
    const ledgerMap = new Map(ledgers.map(l => [l.id, l]));
    if(!isMulti) { doc.addPage(); doc.deletePage(1); } else { doc.addPage(); }

    generateHeader(doc, companyDetails, voucher.type);
    doc.setFontSize(10); doc.setFont(undefined, 'bold');
    doc.text(`Voucher No:`, 15, 45); doc.setFont(undefined, 'normal'); doc.text(safeText(voucher.voucherNo), 45, 45);
    doc.setFont(undefined, 'bold'); doc.text(`Date:`, 150, 45); doc.setFont(undefined, 'normal'); doc.text(formatDate(voucher.date), 165, 45);
    const tableData = voucher.entries.map(e => [e.type, safeText(ledgerMap.get(e.ledgerId)?.name), e.type === 'Dr' ? e.amount.toFixed(2) : '', e.type === 'Cr' ? e.amount.toFixed(2) : '']);
    const totalDebit = voucher.entries.filter(e => e.type === 'Dr').reduce((s, e) => s + e.amount, 0).toFixed(2);
    const totalCredit = voucher.entries.filter(e => e.type === 'Cr').reduce((s, e) => s + e.amount, 0).toFixed(2);
    (doc as any).autoTable({ startY: 55, head: [['Dr/Cr', 'Particulars', 'Debit', 'Credit']], body: tableData, theme: 'grid', foot: [['', 'Total', totalDebit, totalCredit]], footStyles: { fontStyle: 'bold' }, styles: { fontSize: 9 }, columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } } });
    let finalY = (doc as any).lastAutoTable.finalY;
    if (voucher.narration) { doc.setFont(undefined, 'bold'); doc.text('Narration:', 15, finalY + 10); doc.setFont(undefined, 'normal'); doc.text(doc.splitTextToSize(safeText(voucher.narration), 180), 15, finalY + 15); }
};

export const generateVoucherPDF = (voucher: Voucher, companyData: CompanyData) => {
    safeGeneratePdf(() => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        if (['Sale', 'Purchase', 'Credit Note', 'Debit Note'].includes(voucher.type)) {
            generateInvoicePDF(voucher, companyData, doc);
        } else {
            generateJournalPDF(voucher, companyData, doc);
        }
        const safeName = safeText(companyData.details.name).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`voucher_${voucher.type.replace(' ','_')}_${voucher.voucherNo}_${safeName}.pdf`);
    });
};

export const generateMultiVoucherPDF = (vouchers: Voucher[], companyData: CompanyData) => {
    safeGeneratePdf(() => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.deletePage(1); // Start with a blank slate
        
        vouchers.forEach(voucher => {
            if (['Sale', 'Purchase', 'Credit Note', 'Debit Note'].includes(voucher.type)) {
                generateInvoicePDF(voucher, companyData, doc, true);
            } else {
                generateJournalPDF(voucher, companyData, doc, true);
            }
        });

        const safeName = safeText(companyData.details.name).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`vouchers_export_${safeName}.pdf`);
    });
};

export const generateAdvancedLedgerReportPDF = (ledger: Ledger, reportData: any[], headers: {id: string, label: string}[], openingBalance: number, fromDate: string, toDate: string, companyData: CompanyData) => {
    safeGeneratePdf(() => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF(headers.length > 7 ? 'landscape' : 'portrait');
        generateHeader(doc, companyData.details, `Ledger Report: ${safeText(ledger.name)}`);
        doc.setFontSize(10); doc.text(`Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`, doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
        const head = [headers.map(h => h.label)];
        const body = reportData.map(row => headers.map(h => {
            let value = (row as any)[h.id];
            if (h.id === 'date') return formatDate(value);
            if (h.id === 'balance' && typeof value === 'number') return `${Math.abs(value).toFixed(2)} ${value >= 0 ? 'Dr' : 'Cr'}`;
            if (typeof value === 'number') return value.toFixed(2);
            return safeText(value);
        }));
        (doc as any).autoTable({ startY: 55, head: head, body: [ headers.map(h => { if (h.id === 'particulars') return 'Opening Balance'; if (h.id === 'balance') return `${Math.abs(openingBalance).toFixed(2)} ${openingBalance >= 0 ? 'Dr' : 'Cr'}`; return ''; }), ...body ], theme: 'grid', styles: { fontSize: 8 } });
        doc.save(`Ledger_${safeText(ledger.name).replace(/ /g, '_')}.pdf`);
    });
};

export const generateTrialBalancePDF = (rows: any[], debitTotal: number, creditTotal: number, endDate: string, companyData: CompanyData) => {
    safeGeneratePdf(() => {
        const { jsPDF } = jspdf; const doc = new jsPDF();
        generateHeader(doc, companyData.details, 'Trial Balance');
        doc.setFontSize(10); doc.text(`As on: ${formatDate(endDate)}`, 105, 45, { align: 'center' });
        const body = rows.map(r => [safeText(r.name), r.debit > 0 ? r.debit.toFixed(2) : '', r.credit > 0 ? r.credit.toFixed(2) : '']);
        (doc as any).autoTable({ startY: 55, head: [['Particulars', 'Debit', 'Credit']], body, foot: [['Total', debitTotal.toFixed(2), creditTotal.toFixed(2)]], theme: 'grid', footStyles: { fontStyle: 'bold' }, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } } });
        doc.save('trial_balance.pdf');
    });
};

export const generatePLPDF = (incomeLedgers: any[], expenseLedgers: any[], totalIncome: number, totalExpense: number, netProfit: number, startDate: string, endDate: string, companyData: CompanyData) => {
    safeGeneratePdf(() => {
        const { jsPDF } = jspdf; const doc = new jsPDF();
        generateHeader(doc, companyData.details, 'Profit & Loss Statement');
        doc.setFontSize(10); doc.text(`Period: ${formatDate(startDate)} to ${formatDate(endDate)}`, 105, 45, { align: 'center' });
        (doc as any).autoTable({ startY: 55, head: [['Expenses', 'Amount']], body: expenseLedgers.map(i => [safeText(i.name), i.balance.toFixed(2)]), foot: [['Total Expenses', totalExpense.toFixed(2)]], theme: 'striped', footStyles: { fontStyle: 'bold' }, columnStyles: { 1: { halign: 'right' } }, margin: { right: 107 } });
        (doc as any).autoTable({ startY: 55, head: [['Incomes', 'Amount']], body: incomeLedgers.map(i => [safeText(i.name), i.balance.toFixed(2)]), foot: [['Total Incomes', totalIncome.toFixed(2)]], theme: 'striped', footStyles: { fontStyle: 'bold' }, columnStyles: { 1: { halign: 'right' } }, margin: { left: 107 } });
        let finalY = Math.max((doc as any).lastAutoTable.finalY, (doc as any).previousAutoTable.finalY);
        doc.setFontSize(12); doc.setFont(undefined, 'bold');
        doc.text(`${netProfit >= 0 ? 'Net Profit' : 'Net Loss'}: ${Math.abs(netProfit).toFixed(2)}`, 105, finalY + 15, { align: 'center' });
        doc.save('profit_and_loss.pdf');
    });
};

export const generateBalanceSheetPDF = (liabilityData: any[], assetData: any[], totalLiabilities: number, totalAssets: number, endDate: string, companyData: CompanyData) => {
    safeGeneratePdf(() => {
        const { jsPDF } = jspdf; const doc = new jsPDF();
        generateHeader(doc, companyData.details, 'Balance Sheet');
        doc.setFontSize(10); doc.text(`As on: ${formatDate(endDate)}`, 105, 45, { align: 'center' });
        (doc as any).autoTable({ startY: 55, head: [['Liabilities & Equity', 'Amount']], body: liabilityData.map(i => [safeText(i.head), i.total.toFixed(2)]), foot: [['Total Liabilities', totalLiabilities.toFixed(2)]], theme: 'striped', footStyles: { fontStyle: 'bold' }, columnStyles: { 1: { halign: 'right' } }, margin: { right: 107 } });
        (doc as any).autoTable({ startY: 55, head: [['Assets', 'Amount']], body: assetData.map(i => [safeText(i.head), i.total.toFixed(2)]), foot: [['Total Assets', totalAssets.toFixed(2)]], theme: 'striped', footStyles: { fontStyle: 'bold' }, columnStyles: { 1: { halign: 'right' } }, margin: { left: 107 } });
        doc.save('balance_sheet.pdf');
    });
};

export const generateStockSummaryPDF = (stockItems: StockItem[], summaryData: Map<string, any>, startDate: string, endDate: string, companyData: CompanyData) => {
    safeGeneratePdf(() => {
        const { jsPDF } = jspdf; const doc = new jsPDF('landscape');
        generateHeader(doc, companyData.details, 'Stock Summary');
        doc.setFontSize(10); doc.text(`Period: ${formatDate(startDate)} to ${formatDate(endDate)}`, 148, 45, { align: 'center' });
        const body = stockItems.map(item => { const data = summaryData.get(item.id); if (!data) return []; return [ safeText(item.name), data.openingQty, data.openingValue.toFixed(2), data.inwardQty, data.inwardValue.toFixed(2), data.outwardQty, data.outwardValue.toFixed(2), data.closingQty, data.closingValue.toFixed(2) ]; }).filter(r => r.length > 0);
        (doc as any).autoTable({ startY: 55, head: [ [{ content: 'Particulars', rowSpan: 2 }, { content: 'Opening Balance', colSpan: 2 }, { content: 'Inwards', colSpan: 2 }, { content: 'Outwards', colSpan: 2 }, { content: 'Closing Balance', colSpan: 2 }], ['Qty', 'Value', 'Qty', 'Value', 'Qty', 'Value', 'Qty', 'Value'] ], body, theme: 'grid', headStyles: { halign: 'center' }, columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' } } });
        doc.save('stock_summary.pdf');
    });
};