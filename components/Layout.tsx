
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import NotificationContainer from './NotificationContainer';
import Sidebar from './Sidebar';
import Modal from './Modal';
import CommandPalette from './CommandPalette';
import { useHotkeys } from '../hooks/useHotkeys';

const Layout: React.FC = () => {
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const navigate = useNavigate();

  useHotkeys([
    ['ctrl+k', (e) => { e.preventDefault(); setCommandPaletteOpen(true); }],
    ['alt+n', (e) => { e.preventDefault(); navigate('/post-entry'); }],
    ['alt+m', (e) => { e.preventDefault(); navigate('/create-items'); }],
    ['alt+r', (e) => { e.preventDefault(); navigate('/view-report'); }],
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-300 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <NotificationContainer />
      <Modal />
      <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setCommandPaletteOpen} />
    </div>
  );
};

export default Layout;
