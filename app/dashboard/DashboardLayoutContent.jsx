'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import { MenuIcon, XIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function DashboardLayoutContent({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
        <div className="font-semibold text-lg text-gray-800">Dashboard</div>
        <div className="w-10" />{' '}
        {/* Spacer for centering if needed, matches button width */}
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:bg-white md:static md:h-screen md:sticky md:top-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto">
          <Sidebar onLinkClick={closeSidebar} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-[calc(100vh-65px)] md:h-screen overflow-y-auto p-1.5 relative bg-linear-to-br from-[#1a3a4a] to-[#2d5266] ">
        <div className="max-w-full mx-auto h-full flex flex-col min-h-0">
          <div className="bg-transparent h-full flex flex-col min-h-0">
            <div
              key={pathname}
              className="bg-gray-300 rounded-2xl shadow-md p-1 h-full flex flex-col min-h-0 animate-dashboard-reveal overflow-y-auto no-scroll"
            >
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
