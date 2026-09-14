"use client";

import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import SettingsModal from '../components/SettingsModal';
import { useEffect } from 'react';
import Timeline from '../components/Timeline';
import TelemetryChart from '../components/TelemetryChart';

// Disable SSR for MapComponent since it relies on window
const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

import { useAppStore } from '../store/useAppStore';

export default function Home() {
  const { theme } = useAppStore();

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
        </div>
        <div className="flex flex-col z-20 shadow-2xl">
          <TelemetryChart />
          <Timeline />
        </div>
      </div>
      <Sidebar />
    </main>
  );
}
