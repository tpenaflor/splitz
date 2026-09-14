const fs = require('fs');
let store = fs.readFileSync('src/store/useAppStore.ts', 'utf-8');

// Add to interface
store = store.replace(
  "appMode: 'event' | 'segment';",
  "appMode: 'event' | 'segment';\n  theme: 'light' | 'dark';\n  isSettingsOpen: boolean;"
);
store = store.replace(
  "setPrivacyMode: (val: boolean) => void;",
  "setPrivacyMode: (val: boolean) => void;\n  setTheme: (theme: 'light' | 'dark') => void;\n  setIsSettingsOpen: (isOpen: boolean) => void;"
);

// Add to initial state
store = store.replace(
  "appMode: 'event',",
  "appMode: 'event',\n  theme: 'dark',\n  isSettingsOpen: false,"
);

// Add actions
store = store.replace(
  "deleteSegment: (id) => set((state) => ({",
  "setTheme: (theme) => set({ theme }),\n  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),\n  deleteSegment: (id) => set((state) => ({"
);

fs.writeFileSync('src/store/useAppStore.ts', store);
