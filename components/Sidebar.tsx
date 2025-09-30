
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DashboardIcon, EntryIcon, ReportIcon, ItemsIcon, DataTransferIcon, CogIcon } from './Icon';

const navItems = [
    { name: 'Dashboard', path: '/', icon: DashboardIcon },
    { name: 'Voucher Entry', path: '/post-entry', icon: EntryIcon },
    { name: 'Reports', path: '/view-report', icon: ReportIcon },
    { name: 'Masters', path: '/create-items', icon: ItemsIcon },
    { name: 'Data Tools', path: '/data-tools', icon: DataTransferIcon },
    { name: 'Settings', path: '/settings', icon: CogIcon }
];

const Sidebar: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="w-16 lg:w-56 bg-white dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center lg:items-start p-2 lg:p-4 space-y-4">
             <div className="mb-4 hidden lg:block text-2xl font-bold text-slate-900 dark:text-slate-100 p-2">
                JKM <span className="text-sky-500 dark:text-sky-400">Edit</span>
            </div>
            <nav className="flex-1 w-full">
                <ul className="space-y-2">
                    {navItems.map(item => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                className={({ isActive: isNavLinkActive }) =>
                                    `flex items-center p-3 rounded-lg transition-colors duration-200 w-full justify-center lg:justify-start
                                    ${isActive(item.path)
                                        ? 'bg-sky-500/10 dark:bg-sky-600/20 text-sky-600 dark:text-sky-300'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`
                                }
                            >
                                <item.icon className="w-6 h-6" />
                                <span className="ml-4 hidden lg:inline font-medium">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;