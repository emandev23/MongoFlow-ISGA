import { create } from 'zustand';

interface SettingsState {
  // Connection Settings
  connectionString: string;
  defaultDatabase: string;
  connectionTimeout: number;
  
  // Display Preferences
  darkMode: boolean;
  compactView: boolean;
  showLineNumbers: boolean;
  fontSize: number;
  theme: 'light' | 'dark' | 'auto';
  
  // Query Settings
  defaultLimit: number;
  enableQueryHistory: boolean;
  maxHistoryItems: number;
  autoExecute: boolean;
  
  // Code Generation
  defaultLanguage: 'nodejs' | 'python' | 'shell';
  includeComments: boolean;
  codeStyle: 'compact' | 'readable';
  
  // Performance
  enableCache: boolean;
  cacheSize: number;
  showPerformanceMetrics: boolean;
  
  // Updates
  updateConnectionString: (value: string) => void;
  updateDefaultDatabase: (value: string) => void;
  updateConnectionTimeout: (value: number) => void;
  toggleDarkMode: () => void;
  toggleCompactView: () => void;
  toggleShowLineNumbers: () => void;
  updateFontSize: (value: number) => void;
  updateTheme: (value: 'light' | 'dark' | 'auto') => void;
  updateDefaultLimit: (value: number) => void;
  toggleEnableQueryHistory: () => void;
  updateMaxHistoryItems: (value: number) => void;
  toggleAutoExecute: () => void;
  updateDefaultLanguage: (value: 'nodejs' | 'python' | 'shell') => void;
  toggleIncludeComments: () => void;
  updateCodeStyle: (value: 'compact' | 'readable') => void;
  toggleEnableCache: () => void;
  updateCacheSize: (value: number) => void;
  toggleShowPerformanceMetrics: () => void;
  resetSettings: () => void;
}

const defaultSettings = {
  connectionString: 'mongodb://localhost:27017',
  defaultDatabase: '',
  connectionTimeout: 30000,
  darkMode: false,
  compactView: false,
  showLineNumbers: true,
  fontSize: 14,
  theme: 'auto' as const,
  defaultLimit: 100,
  enableQueryHistory: true,
  maxHistoryItems: 50,
  autoExecute: false,
  defaultLanguage: 'nodejs' as const,
  includeComments: false,
  codeStyle: 'readable' as const,
  enableCache: true,
  cacheSize: 100,
  showPerformanceMetrics: true,
};

// Load settings from localStorage on initialization
const loadSettings = (): Partial<SettingsState> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('mongoflow-settings');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save settings to localStorage
const saveSettings = (settings: SettingsState) => {
  if (typeof window === 'undefined') return;
  try {
    const settingsToSave = {
      connectionString: settings.connectionString,
      defaultDatabase: settings.defaultDatabase,
      connectionTimeout: settings.connectionTimeout,
      darkMode: settings.darkMode,
      compactView: settings.compactView,
      showLineNumbers: settings.showLineNumbers,
      fontSize: settings.fontSize,
      theme: settings.theme,
      defaultLimit: settings.defaultLimit,
      enableQueryHistory: settings.enableQueryHistory,
      maxHistoryItems: settings.maxHistoryItems,
      autoExecute: settings.autoExecute,
      defaultLanguage: settings.defaultLanguage,
      includeComments: settings.includeComments,
      codeStyle: settings.codeStyle,
      enableCache: settings.enableCache,
      cacheSize: settings.cacheSize,
      showPerformanceMetrics: settings.showPerformanceMetrics,
    };
    localStorage.setItem('mongoflow-settings', JSON.stringify(settingsToSave));
  } catch {
    // Ignore errors
  }
};

const loadedSettings = loadSettings();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  ...loadedSettings,
  
  updateConnectionString: (value) => {
    set({ connectionString: value });
    saveSettings(get());
  },
  updateDefaultDatabase: (value) => {
    set({ defaultDatabase: value });
    saveSettings(get());
  },
  updateConnectionTimeout: (value) => {
    set({ connectionTimeout: value });
    saveSettings(get());
  },
  toggleDarkMode: () => {
    set((state) => ({ darkMode: !state.darkMode }));
    saveSettings(get());
  },
  toggleCompactView: () => {
    set((state) => ({ compactView: !state.compactView }));
    saveSettings(get());
  },
  toggleShowLineNumbers: () => {
    set((state) => ({ showLineNumbers: !state.showLineNumbers }));
    saveSettings(get());
  },
  updateFontSize: (value) => {
    set({ fontSize: value });
    saveSettings(get());
  },
  updateTheme: (value) => {
    set({ theme: value });
    saveSettings(get());
  },
  updateDefaultLimit: (value) => {
    set({ defaultLimit: value });
    saveSettings(get());
  },
  toggleEnableQueryHistory: () => {
    set((state) => ({ enableQueryHistory: !state.enableQueryHistory }));
    saveSettings(get());
  },
  updateMaxHistoryItems: (value) => {
    set({ maxHistoryItems: value });
    saveSettings(get());
  },
  toggleAutoExecute: () => {
    set((state) => ({ autoExecute: !state.autoExecute }));
    saveSettings(get());
  },
  updateDefaultLanguage: (value) => {
    set({ defaultLanguage: value });
    saveSettings(get());
  },
  toggleIncludeComments: () => {
    set((state) => ({ includeComments: !state.includeComments }));
    saveSettings(get());
  },
  updateCodeStyle: (value) => {
    set({ codeStyle: value });
    saveSettings(get());
  },
  toggleEnableCache: () => {
    set((state) => ({ enableCache: !state.enableCache }));
    saveSettings(get());
  },
  updateCacheSize: (value) => {
    set({ cacheSize: value });
    saveSettings(get());
  },
  toggleShowPerformanceMetrics: () => {
    set((state) => ({ showPerformanceMetrics: !state.showPerformanceMetrics }));
    saveSettings(get());
  },
  resetSettings: () => {
    set(defaultSettings);
    localStorage.removeItem('mongoflow-settings');
  },
}));

