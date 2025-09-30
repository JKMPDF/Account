import React, { useContext } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import { useDateRange } from '../context/DateRangeContext';
import Button from '../components/Button';
import { generateGstr1Json } from '../utils/gstGenerator';
import { useNotifications } from '../context/NotificationContext';
import { GstReturnIcon } from '../components/Icon';
import { formatDate } from '../utils/exportUtils';

const GstReturns: React.FC = () => {
    const context = useContext(CompanyDataContext);
    const { startDate, endDate } = useDateRange();
    const { addNotification } = useNotifications();

    if (!context) return null;
    const { companyData } = context;

    const handleGenerate = () => {
        if (companyData) {
            generateGstr1Json(companyData, startDate, endDate);
            addNotification('GSTR-1 JSON file generated successfully!', 'success');
        } else {
            addNotification('Could not generate file. Company data not available.', 'error');
        }
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">GST Returns</h1>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto text-center">
                <div className="mx-auto bg-slate-100 dark:bg-slate-700 h-16 w-16 flex items-center justify-center rounded-full text-sky-500 dark:text-sky-400">
                    <GstReturnIcon className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-4">Generate GSTR-1 JSON</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    This tool will generate a GSTR-1 JSON file for the selected period, ready for upload to the GST portal.
                </p>
                <div className="my-6 bg-slate-100 dark:bg-slate-700/50 p-4 rounded-md">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Selected Period:</p>
                    <p className="text-lg font-mono text-sky-500 dark:text-sky-400">
                        {formatDate(startDate)} to {formatDate(endDate)}
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={!companyData?.details.gstApplicable}>
                    {companyData?.details.gstApplicable ? 'Generate & Download JSON' : 'GST Not Applicable'}
                </Button>
                 {!companyData?.details.gstApplicable && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2">Enable GST in Company Profile to use this feature.</p>
                )}
            </div>
        </div>
    );
};

export default GstReturns;
