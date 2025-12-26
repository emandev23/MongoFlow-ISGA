import { create } from 'zustand';

interface WorkflowState {
  selectedDatabase: string | null;
  selectedCollection: string | null;
  connectionString: string | null;
  isConnected: boolean;
  hasEverConnected: boolean; // Track if we've ever been connected
  
  setConnectionString: (connectionString: string | null) => void;
  selectDatabase: (dbName: string) => void;
  selectCollection: (collectionName: string) => void;
  disconnect: () => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  selectedDatabase: null,
  selectedCollection: null,
  connectionString: null,
  isConnected: false,
  hasEverConnected: false,
  
  setConnectionString: (connectionString) => {
    set({ 
      connectionString,
      isConnected: !!connectionString,
      hasEverConnected: !!connectionString, // Mark as connected once
    });
  },
  
  selectDatabase: (dbName) => {
    set((state) => ({ 
      selectedDatabase: dbName,
      selectedCollection: null, // Reset collection when DB changes
      // Preserve ALL connection state
      connectionString: state.connectionString,
      isConnected: state.isConnected,
      hasEverConnected: state.hasEverConnected,
    }));
  },
  
  selectCollection: (collectionName) => {
    set((state) => ({ 
      selectedCollection: collectionName,
      // Preserve ALL connection state
      connectionString: state.connectionString,
      isConnected: state.isConnected,
      hasEverConnected: state.hasEverConnected,
      selectedDatabase: state.selectedDatabase,
    }));
  },
  
  disconnect: () => {
    set({
      selectedDatabase: null,
      selectedCollection: null,
      connectionString: null,
      isConnected: false,
      hasEverConnected: false, // Reset on explicit disconnect
    });
  },
  
  reset: () => {
    set({
      selectedDatabase: null,
      selectedCollection: null,
      connectionString: null,
      isConnected: false,
      hasEverConnected: false,
    });
  },
}));

