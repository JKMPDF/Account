
import React, { useContext } from 'react';
import { CompanyDataContext } from '../../context/CompanyDataContext';
import { UserIcon } from '../../components/Icon';
import Select from '../../components/Select';

const UserManagement: React.FC = () => {
    const context = useContext(CompanyDataContext);
    if (!context || !context.companyData) return null;
    
    const { companyData, activeUser, setActiveUser } = context;
    const { users } = companyData;

    const userOptions = users.map(u => ({ value: u.id, label: u.name }));

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h2>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-lg">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Developer Note</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    This is a foundational user management system. It allows switching the "active user" for audit trail purposes. A full authentication system is not implemented.
                </p>
            </div>

            <div className="max-w-md">
                <Select
                    label="Select Active User"
                    id="active-user"
                    value={activeUser?.id || ''}
                    onChange={(userId) => {
                        const user = users.find(u => u.id === userId) || null;
                        setActiveUser(user);
                    }}
                    options={userOptions}
                />
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">All Users</h3>
                <ul className="mt-4 space-y-3">
                    {users.map(user => (
                        <li key={user.id} className="flex items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                            <UserIcon className="w-6 h-6 mr-3 text-slate-500 dark:text-slate-400" />
                            <span className="font-medium text-slate-800 dark:text-slate-200">{user.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default UserManagement;
