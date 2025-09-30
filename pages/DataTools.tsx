
import React, { useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyDataContext } from '../context/CompanyDataContext';
import Button from '../components/Button';
import { UploadIcon, ExportIcon } from '../components/Icon';

const DataTools: React.FC = () => {
    const navigate = useNavigate();
    const context = useContext(CompanyDataContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!context) return null;
    const { exportDataAsJson, loadDataFromFile } = context;

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            loadDataFromFile(file);
        }
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">Data Tools</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Export Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 space-y-4 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-sky-500 dark:text-sky-400">Export Backup</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Create a full backup of your company data. This will generate a single JSON file that can be used to restore your company later.</p>
                    </div>
                    <div className="pt-2">
                        <Button onClick={exportDataAsJson}>
                            <ExportIcon className="w-5 h-5 mr-2" />
                            Export Company Backup
                        </Button>
                    </div>
                </div>

                {/* Import Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 space-y-4 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-sky-500 dark:text-sky-400">Import / Restore</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Restore a company from a previously exported backup file (.json). This will overwrite any current company data.</p>
                    </div>
                    <div className="pt-2">
                         <Button onClick={handleUploadClick}>
                            <UploadIcon className="w-5 h-5 mr-2" />
                            Import from Backup
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".json,application/json"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataTools;