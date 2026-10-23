import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, HardHat } from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0E26]">
      {/* Barra lateral */}
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra superior no celular */}
        <header className="md:hidden flex items-center justify-between px-5 py-3.5 bg-[#0B0E26] border-b border-[#2A2F55] shrink-0 transition-colors">
          <div className="flex items-center gap-2.5">
            <HardHat className="text-[#FFCA18]" size={24} />
            <span className="text-lg font-bold tracking-widest text-[#FFCA18]">OBRACONTROL</span>
          </div>
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="p-2 text-[#8F9BB3] hover:text-white bg-[#111535] border border-[#2A2F55] rounded-xl transition-colors cursor-pointer"
            title="Abrir menu"
          >
            <Menu size={22} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}