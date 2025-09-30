

import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const settingsNav = [
    { name: 'Company Profile', path: '/settings/profile' },
    { name: 'User Management', path: '/settings/users' },
    { name: 'Appearance', path: '/settings/appearance' },
    { name: 'Invoice Customization', path: '/settings/invoice-customization' },
    { name: 'Cheque Printing', path: '/settings/cheque-printing' },
    { name: 'Download Location', path: '/settings/downloads' },
];

const Settings: React.FC = () => {
    const location = useLocation();

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="md:col-span-1">
                    <nav className="space-y-1">
                        {settingsNav.map(item => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) =>
                                    `block px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        isActive
                                            ? 'bg-sky-100 dark:bg-sky-600/20 text-sky-700 dark:text-sky-300'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                    }`
                                }
                            >
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </aside>
                <main className="md:col-span-3">
                    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
