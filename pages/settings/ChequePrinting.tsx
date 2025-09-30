
import React, { useState, useContext } from 'react';
import { CompanyDataContext } from '../../context/CompanyDataContext';
import { ChequePrintingConfig } from '../../types';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { SaveIcon } from '../../components/Icon';

const ChequePrinting: React.FC = () => {
  const context = useContext(CompanyDataContext);
  if (!context || !context.companyData) return null;

  const { companyData, updateChequePrintingConfig } = context;
  const [config, setConfig] = useState<ChequePrintingConfig>(
    companyData.chequePrintingConfig || { width: 200, height: 90, payeeX: 15, payeeY: 30, dateX: 160, dateY: 15, amountWordsX: 20, amountWordsY: 45, amountFigX: 160, amountFigY: 35 }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateChequePrintingConfig(config);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cheque Printing Configuration</h2>
      <p className="text-sm text-slate-500 dark:text-slate-500">
        Set the dimensions and field positions for printing cheques. All measurements are in millimeters (mm).
      </p>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Overall Dimensions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Cheque Width" name="width" type="number" value={config.width} onChange={handleChange} />
            <Input label="Cheque Height" name="height" type="number" value={config.height} onChange={handleChange} />
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Field Positions (X, Y from top-left)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <fieldset className="border border-slate-300 dark:border-slate-600 p-3 rounded-md">
                <legend className="px-2 font-medium text-slate-600 dark:text-slate-400">Date</legend>
                <div className="flex gap-4">
                    <Input label="X Pos" name="dateX" type="number" value={config.dateX} onChange={handleChange} />
                    <Input label="Y Pos" name="dateY" type="number" value={config.dateY} onChange={handleChange} />
                </div>
            </fieldset>
            <fieldset className="border border-slate-300 dark:border-slate-600 p-3 rounded-md">
                <legend className="px-2 font-medium text-slate-600 dark:text-slate-400">Payee Name</legend>
                <div className="flex gap-4">
                    <Input label="X Pos" name="payeeX" type="number" value={config.payeeX} onChange={handleChange} />
                    <Input label="Y Pos" name="payeeY" type="number" value={config.payeeY} onChange={handleChange} />
                </div>
            </fieldset>
            <fieldset className="border border-slate-300 dark:border-slate-600 p-3 rounded-md">
                <legend className="px-2 font-medium text-slate-600 dark:text-slate-400">Amount in Words</legend>
                <div className="flex gap-4">
                    <Input label="X Pos" name="amountWordsX" type="number" value={config.amountWordsX} onChange={handleChange} />
                    <Input label="Y Pos" name="amountWordsY" type="number" value={config.amountWordsY} onChange={handleChange} />
                </div>
            </fieldset>
            <fieldset className="border border-slate-300 dark:border-slate-600 p-3 rounded-md">
                <legend className="px-2 font-medium text-slate-600 dark:text-slate-400">Amount in Figures</legend>
                <div className="flex gap-4">
                    <Input label="X Pos" name="amountFigX" type="number" value={config.amountFigX} onChange={handleChange} />
                    <Input label="Y Pos" name="amountFigY" type="number" value={config.amountFigY} onChange={handleChange} />
                </div>
            </fieldset>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="submit">
                <SaveIcon className="w-5 h-5 mr-2" />
                Save Configuration
            </Button>
        </div>
      </form>
    </div>
  );
};

export default ChequePrinting;
