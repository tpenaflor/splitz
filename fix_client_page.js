const fs = require('fs');
let content = fs.readFileSync('src/app/ClientPage.tsx', 'utf-8');

// Add imports
content = content.replace(
  "import Sidebar from '../components/Sidebar';",
  "import Sidebar from '../components/Sidebar';\nimport SettingsModal from '../components/SettingsModal';\nimport { useEffect } from 'react';"
);
content = content.replace(
  "import { useAppStore } from '../store/useAppStore';",
  "import { useAppStore } from '../store/useAppStore';"
);

// Apply useEffect for dark mode and mount modal
const oldMain = `export default function ClientPage() {
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-gray-950 text-white">
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
}`;

const newMain = `export default function ClientPage() {
  const { theme } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
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
}`;

content = content.replace(oldMain, newMain);
fs.writeFileSync('src/app/ClientPage.tsx', content);
