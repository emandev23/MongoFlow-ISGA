import { create } from 'zustand';
import { Database, Collection, Document } from '@/types/pipeline';

interface DocumentState {
  databases: Database[];
  selectedDatabase: string | null;
  selectedCollection: string | null;
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  
  setDatabases: (databases: Database[]) => void;
  selectDatabase: (dbName: string) => void;
  selectCollection: (collectionName: string) => void;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Omit<Document, '_id'>) => void;
  updateDocument: (id: string, document: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  selectDocument: (document: Document | null) => void;
  createDatabase: (name: string) => void;
  createCollection: (dbName: string, collectionName: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  databases: [],
  selectedDatabase: null,
  selectedCollection: null,
  documents: [],
  selectedDocument: null,
  isLoading: false,
  
  setDatabases: (databases) => set({ databases }),
  
  selectDatabase: (dbName) => {
    set({ selectedDatabase: dbName, selectedCollection: null, documents: [], selectedDocument: null });
  },
  
  selectCollection: (collectionName) => {
    set({ selectedCollection: collectionName, documents: [], selectedDocument: null });
  },
  
  setDocuments: (documents) => set({ documents }),
  
  addDocument: (doc) => {
    const newDoc: Document = {
      ...doc,
      _id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    set((state) => ({
      documents: [...state.documents, newDoc],
    }));
  },
  
  updateDocument: (id, updates) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc._id === id ? { ...doc, ...updates } : doc
      ),
      selectedDocument: state.selectedDocument?._id === id
        ? { ...state.selectedDocument, ...updates }
        : state.selectedDocument,
    }));
  },
  
  deleteDocument: (id) => {
    set((state) => ({
      documents: state.documents.filter((doc) => doc._id !== id),
      selectedDocument: state.selectedDocument?._id === id ? null : state.selectedDocument,
    }));
  },
  
  selectDocument: (document) => set({ selectedDocument: document }),
  
  createDatabase: (name) => {
    const newDb: Database = {
      name,
      collections: [],
    };
    set((state) => ({
      databases: [...state.databases, newDb],
    }));
  },
  
  createCollection: (dbName, collectionName) => {
    set((state) => ({
      databases: state.databases.map((db) =>
        db.name === dbName
          ? {
              ...db,
              collections: [
                ...db.collections,
                { name: collectionName, documentCount: 0 },
              ],
            }
          : db
      ),
    }));
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
}));

