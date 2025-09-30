import React, { useState, useMemo } from 'react';
import type { StockItem, BatchAllocation } from '../types';
import { useModal } from '../context/ModalContext';
import Button from './Button';
import Input from './Input';
import { SaveIcon, TrashIcon, CreateIcon } from './Icon';

interface BatchSerialModalProps {
    stockItem: StockItem;
    quantity: number;
    existingAllocations?: BatchAllocation[] | string[];
    onSave: (allocations: BatchAllocation[] | string[]) => void;
}

const BatchSerialModal: React.FC<BatchSerialModalProps> = ({ stockItem, quantity, existingAllocations, onSave }) => {
    const { hideModal } = useModal();
    const isBatch = stockItem.isBatchTracked;

    const [batches, setBatches] = useState<BatchAllocation[]>(
        (isBatch && Array.isArray(existingAllocations) && existingAllocations.length > 0 ? existingAllocations : [{ batchNo: '', quantity: quantity, expiryDate: '' }]) as BatchAllocation[]
    );
    const [serials, setSerials] = useState<string[]>(
        (!isBatch && Array.isArray(existingAllocations) && existingAllocations.length > 0 ? existingAllocations : Array(quantity).fill('')) as string[]
    );
    
    const handleBatchChange = (index: number, field: keyof BatchAllocation, value: string | number) => {
        const newBatches = [...batches];
        (newBatches[index] as any)[field] = value;
        setBatches(newBatches);
    };

    const addBatchRow = () => setBatches([...batches, { batchNo: '', quantity: 0, expiryDate: '' }]);
    const removeBatchRow = (index: number) => setBatches(batches.filter((_, i) => i !== index));

    const handleSerialChange = (index: number, value: string) => {
        const newSerials = [...serials];
        newSerials[index] = value;
        setSerials(newSerials);
    };

    const totalBatchQty = useMemo(() => batches.reduce((sum, b) => sum + Number(b.quantity || 0), 0), [batches]);
    
    const handleSave = () => {
        if (isBatch) {
            if (totalBatchQty !== quantity) {
                alert(`Total batch quantity (${totalBatchQty}) must match the invoice quantity (${quantity}).`);
                return;
            }
            onSave(batches.filter(b => b.batchNo && b.quantity > 0));
        } else {
            if (serials.length !== quantity) {
                alert(`You must enter ${quantity} serial numbers.`);
                return;
            }
            if(serials.some(s => !s.trim())) {
                alert('All serial number fields must be filled.');
                return;
            }
            onSave(serials);
        }
        hideModal();
    };
    
    return (
        <div className="p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {isBatch ? 'Batch Allocation' : 'Serial Number Entry'} for {stockItem.name}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Total Quantity: <span className="font-bold">{quantity}</span></p>

            {isBatch ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                     <div className="grid grid-cols-12 gap-2 font-semibold text-xs text-slate-500 dark:text-slate-400">
                        <div className="col-span-5">Batch No.</div>
                        <div className="col-span-3">Quantity</div>
                        <div className="col-span-3">Expiry (Optional)</div>
                     </div>
                    {batches.map((batch, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5"><Input label="" id={`batchNo-${index}`} value={batch.batchNo} onChange={e => handleBatchChange(index, 'batchNo', e.target.value)} /></div>
                            <div className="col-span-3"><Input label="" id={`batchQty-${index}`} type="number" value={batch.quantity} onChange={e => handleBatchChange(index, 'quantity', Number(e.target.value))} /></div>
                            <div className="col-span-3"><Input label="" id={`batchExp-${index}`} type="date" value={batch.expiryDate || ''} onChange={e => handleBatchChange(index, 'expiryDate', e.target.value)} /></div>
                            <div className="col-span-1"><Button type="button" variant="danger" className="!p-2" onClick={() => removeBatchRow(index)}><TrashIcon className="w-5 h-5"/></Button></div>
                        </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={addBatchRow}><CreateIcon className="w-4 h-4 mr-1"/>Add Batch</Button>
                    <div className={`text-right font-semibold ${totalBatchQty !== quantity ? 'text-red-500' : 'text-green-500'}`}>
                        Total Batch Qty: {totalBatchQty} / {quantity}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-2">
                    {serials.map((serial, index) => (
                        <Input key={index} label={`Serial #${index + 1}`} id={`serial-${index}`} value={serial} onChange={e => handleSerialChange(index, e.target.value)} />
                    ))}
                </div>
            )}

            <div className="mt-6 flex justify-end gap-4">
                <Button variant="secondary" onClick={hideModal}>Cancel</Button>
                <Button onClick={handleSave}><SaveIcon className="w-5 h-5 mr-2" /> Save</Button>
            </div>
        </div>
    );
};

export default BatchSerialModal;