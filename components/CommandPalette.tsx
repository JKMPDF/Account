
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, DashboardIcon, EntryIcon, ReportIcon, ItemsIcon, DataTransferIcon, CogIcon, BookOpenIcon, ScaleIcon, ChartPieIcon, LedgerIcon, StockIcon, TrialBalanceIcon, ClipboardCheckIcon, GstReturnIcon, AgingIcon, ClockIcon } from './Icon';

interface Command {
  id: string;
  name: string;
  section: string;
  icon: React.FC<{className?: string}>;
  action: () => void;
  keywords?: string;
}

const CommandPalette: React.FC<{ isOpen: boolean; setIsOpen: (isOpen: boolean) => void }> = ({ isOpen, setIsOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // Navigation
    { id: 'nav-dashboard', name: 'Dashboard', section: 'Navigation', icon: DashboardIcon, action: () => navigate('/') },
    { id: 'nav-voucher-entry', name: 'Voucher Entry', section: 'Navigation', icon: EntryIcon, action: () => navigate('/post-entry'), keywords: 'new create voucher sale purchase' },
    { id: 'nav-reports', name: 'Reports', section: 'Navigation', icon: ReportIcon, action: () => navigate('/view-report') },
    { id: 'nav-masters', name: 'Create Masters', section: 'Navigation', icon: ItemsIcon, action: () => navigate('/create-items'), keywords: 'ledger stock item' },
    { id: 'nav-data-tools', name: 'Data Tools', section: 'Navigation', icon: DataTransferIcon, action: () => navigate('/data-tools'), keywords: 'backup restore import export' },
    { id: 'nav-settings', name: 'Settings', section: 'Navigation', icon: CogIcon, action: () => navigate('/settings'), keywords: 'company profile appearance theme' },
    // Reports
    { id: 'report-day-book', name: 'Day Book', section: 'Reports', icon: BookOpenIcon, action: () => navigate('/reports/day-book') },
    { id: 'report-ledger', name: 'Ledger Report', section: 'Reports', icon: LedgerIcon, action: () => navigate('/reports/ledger-report') },
    { id: 'report-aging', name: 'Aging Report', section: 'Reports', icon: AgingIcon, action: () => navigate('/reports/aging-report'), keywords: 'receivables payables' },
    { id: 'report-stock-summary', name: 'Stock Summary', section: 'Reports', icon: StockIcon, action: () => navigate('/reports/stock-summary') },
    { id: 'report-trial-balance', name: 'Trial Balance', section: 'Reports', icon: TrialBalanceIcon, action: () => navigate('/reports/trial-balance') },
    { id: 'report-pl', name: 'Profit & Loss', section: 'Reports', icon: ChartPieIcon, action: () => navigate('/reports/profit-and-loss') },
    { id: 'report-balance-sheet', name: 'Balance Sheet', section: 'Reports', icon: ScaleIcon, action: () => navigate('/reports/balance-sheet') },
    { id: 'report-bank-recon', name: 'Bank Reconciliation', section: 'Reports', icon: ClipboardCheckIcon, action: () => navigate('/reports/bank-reconciliation') },
    { id: 'report-gst', name: 'GST Returns', section: 'Reports', icon: GstReturnIcon, action: () => navigate('/reports/gst-returns') },
    // Audit
    { id: 'audit-trail', name: 'Audit Trail', section: 'Tools', icon: ClockIcon, action: () => navigate('/audit-trail'), keywords: 'log history changes' },
  ];

  const filteredCommands = React.useMemo(() => {
    if (!searchTerm) return commands;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return commands.filter(cmd => 
        cmd.name.toLowerCase().includes(lowerCaseSearch) || 
        cmd.section.toLowerCase().includes(lowerCaseSearch) ||
        cmd.keywords?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm, commands]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filteredCommands]);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, [setIsOpen]);

  const executeCommand = (command: Command) => {
    command.action();
    closePalette();
  };
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[activeIndex]) {
        executeCommand(filteredCommands[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      closePalette();
    }
  }, [filteredCommands, activeIndex, closePalette]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4" onClick={closePalette}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative border-b border-slate-200 dark:border-slate-700">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent p-4 pl-12 text-lg text-slate-800 dark:text-slate-200 focus:outline-none"
            />
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2">
            {filteredCommands.length > 0 ? (
                 Object.entries(
                    filteredCommands.reduce((acc, cmd) => {
                        (acc[cmd.section] = acc[cmd.section] || []).push(cmd);
                        return acc;
                    }, {} as Record<string, Command[]>)
                ).map(([section, cmds]) => (
                    <li key={section}>
                        <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{section}</h3>
                        <ul>
                           {cmds.map(cmd => {
                                const index = filteredCommands.indexOf(cmd);
                                return (
                                <li
                                    key={cmd.id}
                                    onClick={() => executeCommand(cmd)}
                                    onMouseMove={() => setActiveIndex(index)}
                                    className={`flex items-center gap-4 px-3 py-2.5 rounded-md cursor-pointer ${
                                    activeIndex === index ? 'bg-sky-500 text-white' : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <cmd.icon className={`w-5 h-5 ${activeIndex === index ? 'text-white' : 'text-slate-400'}`} />
                                    <span>{cmd.name}</span>
                                </li>
                                );
                            })}
                        </ul>
                    </li>
                ))
            ) : (
                <li className="p-6 text-center text-slate-500">No results found.</li>
            )}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;
