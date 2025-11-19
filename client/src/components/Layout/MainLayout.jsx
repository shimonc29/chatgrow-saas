import { useState } from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-gradient-to-r from-bg-card to-bg-light border-b border-accent-teal/30 sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold">
              <span className="text-xl">👑</span>{' '}
              <span className="bg-gradient-to-r from-accent-teal to-accent-hover bg-clip-text text-transparent">ChatGrow</span>
            </h1>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-accent-teal/10 hover:bg-accent-teal/20 transition-colors"
              aria-label="פתח תפריט"
            >
              <svg className="w-6 h-6 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
