"use client";

import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import SettingsModal from '../components/SettingsModal';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Timeline from '../components/Timeline';
import TelemetryChart from '../components/TelemetryChart';

// Disable SSR for MapComponent since it relies on window
const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

import { useAppStore } from '../store/useAppStore';

export default function Home() {
  const { theme } = useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <main className="flex h-screen w-full bg-white dark:bg-black text-gray-900 dark:text-white overflow-hidden transition-colors duration-200">
      <SettingsModal />
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 relative">
          <MapComponent />
          <button 
            className="md:hidden absolute top-4 right-4 z-30 bg-white dark:bg-gray-800 p-2 rounded shadow-md text-gray-700 dark:text-gray-200"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col z-20 shadow-2xl">
          <TelemetryChart />
          <Timeline />
        </div>
      </div>
      
      {/* Mobile backdrop overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </main>
  );
}
