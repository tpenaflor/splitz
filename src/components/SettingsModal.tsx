import React from 'react';
import { Shield, X, Moon, Sun } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, privacyMode, setPrivacyMode, theme, setTheme } = useAppStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h2>
          <button 
            onClick={() => setIsSettingsOpen(false)}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Privacy Zone Toggle */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className={`w-4 h-4 \${privacyMode ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="font-semibold text-gray-900 dark:text-gray-200">Meetup Privacy Zone</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically hides the start and end of your ride outside of the shared meetup zones to protect your home address in Event Mode.
              </p>
            </div>
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none \${privacyMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${privacyMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-orange-500" />}
                <span className="font-semibold text-gray-900 dark:text-gray-200">Appearance</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Toggle between Light and Dark mode across the application and map.
              </p>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors \${theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors \${theme === 'dark' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                Dark
              </button>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <button 
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
