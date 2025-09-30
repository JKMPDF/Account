

import React, { useContext, useMemo, useState } from 'react';
import { CompanyDataContext } from '../context/CompanyDataContext';
import Input from '../components/Input';
import { SearchIcon } from '../components/Icon';
import type { AuditLog } from '../types';

const AuditTrail: React.FC = () => {
    const { companyData } = useContext(CompanyDataContext)!;
    const { auditLogs = [], users = [] } = companyData!;
    const [searchTerm, setSearchTerm] = useState('');

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return auditLogs;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return auditLogs.filter(log =>
            log.action.toLowerCase().includes(lowerCaseSearch) ||
            log.entity.toLowerCase().includes(lowerCaseSearch) ||
            log.details.toLowerCase().includes(lowerCaseSearch) ||
            (userMap.get(log.userId) || 'System').toLowerCase().includes(lowerCaseSearch)
        );
    }, [auditLogs, searchTerm, userMap]);

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    const getActionChipColor = (action: AuditLog['action']) => {
        switch (action) {
            case 'Create': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Update': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'Delete': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };
    
    return (
        <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Audit Trail</h1>
                <div className="relative w-full md:w-72">
                    <Input
                        label=""
                        id="search-audit"
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="!pl-10"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50">
                            <tr>
                                <th className="p-3 font-medium">Timestamp</th>
                                <th className="p-3 font-medium">Action</th>
                                <th className="p-3 font-medium">Entity</th>
                                <th className="p-3 font-medium">Details</th>
                                <th className="p-3 font-medium">User</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map(log => (
                                    <tr key={log.id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{formatDate(log.timestamp)}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionChipColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{log.entity}</td>
                                        <td className="p-3 text-slate-800 dark:text-slate-200">{log.details}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-400">{userMap.get(log.userId) || log.userId}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center p-10 text-slate-500 dark:text-slate-400">No logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditTrail;
