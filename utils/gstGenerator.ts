
import type { CompanyData, Voucher, Ledger, StockItem } from '../types';

const triggerDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const generateGstr1Json = (companyData: CompanyData, startDate: string, endDate: string) => {
    const { details, ledgers, stockItems, vouchers } = companyData;
    const ledgerMap = new Map(ledgers.map(l => [l.id, l]));
    const stockItemMap = new Map(stockItems.map(i => [i.id, i]));

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const fp = `${(end.getMonth() + 1).toString().padStart(2, '0')}${end.getFullYear()}`;

    const relevantVouchers = vouchers.filter(v => {
        const vDate = new Date(v.date);
        return ['Sale', 'Credit Note', 'Debit Note'].includes(v.type) && vDate >= start && vDate <= end;
    });

    const b2b: any[] = [];
    const b2cl: any[] = [];
    const b2cs: any = {};
    const cdnr: any[] = [];
    const cdnur: any[] = [];
    const hsn: any = {};

    const findTaxLedger = (name: string) => ledgers.find(l => l.name.toLowerCase() === name.toLowerCase() && l.group === 'Duties & Taxes');
    const cgstLedgerId = findTaxLedger('cgst')?.id;
    const sgstLedgerId = findTaxLedger('sgst')?.id;
    const igstLedgerId = findTaxLedger('igst')?.id;

    relevantVouchers.forEach(voucher => {
        const partyEntry = voucher.entries.find(e => ['Sundry Debtors', 'Sundry Creditors'].includes(ledgerMap.get(e.ledgerId)?.group || ''));
        if (!partyEntry) return;

        const partyLedger = ledgerMap.get(partyEntry.ledgerId);
        if (!partyLedger) return;

        const mainEntry = voucher.entries.find(e => ['Sales Accounts', 'Purchase Accounts'].includes(ledgerMap.get(e.ledgerId)?.group || ''));
        const totalInvoiceValue = partyEntry.amount;
        const taxableValue = mainEntry?.amount || 0;
        
        const cgstAmount = voucher.entries.find(e => e.ledgerId === cgstLedgerId)?.amount || 0;
        const sgstAmount = voucher.entries.find(e => e.ledgerId === sgstLedgerId)?.amount || 0;
        const igstAmount = voucher.entries.find(e => e.ledgerId === igstLedgerId)?.amount || 0;
        const totalTax = cgstAmount + sgstAmount + igstAmount;
        const rate = taxableValue > 0 ? parseFloat(((totalTax / taxableValue) * 100).toFixed(2)) : 0;
        
        mainEntry?.inventoryAllocations?.forEach(alloc => {
            const stock = stockItemMap.get(alloc.stockItemId);
            if (stock?.hsnCode) {
                if (!hsn[stock.hsnCode]) {
                    hsn[stock.hsnCode] = { desc: stock.name, uqc: stock.unit, qty: 0, val: 0, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
                }
                const itemValue = alloc.quantity * alloc.rate;
                hsn[stock.hsnCode].qty += alloc.quantity;
                hsn[stock.hsnCode].val += itemValue;
                hsn[stock.hsnCode].txval += itemValue;
                if (voucher.transactionType === 'Inter-State') {
                    hsn[stock.hsnCode].iamt += itemValue * ((stock.gstRate || 0) / 100);
                } else {
                    hsn[stock.hsnCode].camt += itemValue * ((stock.gstRate || 0) / 2 / 100);
                    hsn[stock.hsnCode].samt += itemValue * ((stock.gstRate || 0) / 2 / 100);
                }
            }
        });
        
        const isRegistered = partyLedger.registrationType === 'Registered' && partyLedger.gstNo;
        
        if (voucher.type === 'Sale') {
            if (isRegistered) {
                b2b.push({
                    ctin: partyLedger.gstNo,
                    inv: [{
                        inum: voucher.voucherNo.toString(),
                        idt: new Date(voucher.date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                        val: totalInvoiceValue,
                        pos: partyLedger.state?.substring(0, 2) || '',
                        rchrg: 'N',
                        inv_typ: 'R',
                        itms: [{
                            num: 1,
                            itm_det: { txval: taxableValue, rt: rate, iamt: igstAmount, camt: cgstAmount, samt: sgstAmount, csamt: 0 }
                        }]
                    }]
                });
            } else {
                if (voucher.transactionType === 'Inter-State' && totalInvoiceValue > 250000) {
                    b2cl.push({
                        pos: partyLedger.state?.substring(0, 2) || '',
                        inv: [{
                            inum: voucher.voucherNo.toString(),
                            idt: new Date(voucher.date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                            val: totalInvoiceValue,
                            itms: [{
                                num: 1,
                                itm_det: { txval: taxableValue, rt: rate, iamt: igstAmount, csamt: 0 }
                            }]
                        }]
                    });
                } else {
                    const stateCode = partyLedger.state?.substring(0, 2) || '97';
                    const key = `${stateCode}|${rate}|OE`;
                    if (!b2cs[key]) {
                        b2cs[key] = { sply_ty: voucher.transactionType === 'Inter-State' ? 'INTER' : 'INTRA', pos: stateCode, rt: rate, typ: 'OE', txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
                    }
                    b2cs[key].txval += taxableValue;
                    b2cs[key].iamt += igstAmount;
                    b2cs[key].camt += cgstAmount;
                    b2cs[key].samt += sgstAmount;
                }
            }
        } else if (voucher.type === 'Credit Note' || voucher.type === 'Debit Note') {
            const noteData = {
                nt_num: voucher.voucherNo.toString(),
                nt_dt: new Date(voucher.date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                ntty: voucher.type === 'Credit Note' ? 'C' : 'D',
                val: totalInvoiceValue,
                itms: [{
                    num: 1,
                    itm_det: { txval: taxableValue, rt: rate, iamt: igstAmount, camt: cgstAmount, samt: sgstAmount, csamt: 0 }
                }]
            };

            if (isRegistered) {
                cdnr.push({ ctin: partyLedger.gstNo, nt: [noteData] });
            } else {
                cdnur.push({ typ: voucher.transactionType === 'Inter-State' ? 'B2CL' : 'B2CS', ...noteData });
            }
        }
    });

    const gstr1Data = {
        gstin: details.gstNo,
        fp,
        gt: details.prevYearTurnover || 0,
        cur_gt: Object.values(b2b).reduce((sum, b: any) => sum + b.inv[0].val, 0),
        b2b,
        b2cl,
        b2cs: Object.values(b2cs),
        cdnr,
        cdnur,
        hsn: { data: Object.values(hsn) },
    };

    const filename = `GSTR1_${details.gstNo}_${fp}.json`;
    triggerDownload(filename, JSON.stringify(gstr1Data, null, 2));
};
