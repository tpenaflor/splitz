const fs = require('fs');
let content = fs.readFileSync('src/app/ClientPage.tsx', 'utf-8');

const oldMain = `export default function Home() {
  return (
    <main className="flex h-screen w-full bg-black text-white overflow-hidden">
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

const newMain = `import { useAppStore } from '../store/useAppStore';

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
}`;

content = content.replace(oldMain, newMain);
fs.writeFileSync('src/app/ClientPage.tsx', content);
