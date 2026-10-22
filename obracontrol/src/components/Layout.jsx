import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0E26]">
      {/* Barra lateral fixa */}
      <Sidebar />

      {/* Área onde as telas filhas (Dashboard, Estoque, etc.) são renderizadas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}