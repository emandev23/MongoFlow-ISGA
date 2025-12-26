import { create } from 'zustand';
import { PipelineStage, QueryHistory, ExecutionStats, SchemaField } from '@/types/pipeline';

interface PipelineState {
  stages: PipelineStage[];
  schema: SchemaField[];
  history: QueryHistory[];
  executionStats: ExecutionStats | null;
  recentExecutionStats: ExecutionStats[];
  selectedField: string | null;
  breadcrumbs: string[];
  
  addStage: (type: PipelineStage['type']) => void;
  removeStage: (id: string) => void;
  updateStage: (id: string, config: Record<string, any>) => void;
  reorderStages: (fromIndex: number, toIndex: number) => void;
  setStages: (stages: PipelineStage[]) => void;
  setSchema: (schema: SchemaField[]) => void;
  addToHistory: (query: Omit<QueryHistory, 'id' | 'timestamp'>) => void;
  setExecutionStats: (stats: ExecutionStats | null) => void;
  addExecutionStat: (stats: ExecutionStats) => void;
  setSelectedField: (field: string | null) => void;
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  clearPipeline: () => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  stages: [],
  schema: [],
  history: [],
  executionStats: null,
  recentExecutionStats: [],
  selectedField: null,
  breadcrumbs: [],
  
  addStage: (type) => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}-${Math.random()}`,
      type,
      config: getDefaultConfig(type),
    };
    set((state) => ({ stages: [...state.stages, newStage] }));
  },
  
  removeStage: (id) => {
    set((state) => ({ stages: state.stages.filter((s) => s.id !== id) }));
  },
  
  updateStage: (id, config) => {
    set((state) => ({
      stages: state.stages.map((s) =>
        s.id === id ? { ...s, config: { ...s.config, ...config } } : s
      ),
    }));
  },
  
  reorderStages: (fromIndex, toIndex) => {
    set((state) => {
      const newStages = [...state.stages];
      const [removed] = newStages.splice(fromIndex, 1);
      newStages.splice(toIndex, 0, removed);
      return { stages: newStages };
    });
  },
  
  setStages: (stages) => set({ stages }),
  
  setSchema: (schema) => set({ schema }),
  
  addToHistory: (query) => {
    const historyItem: QueryHistory = {
      ...query,
      id: `history-${Date.now()}`,
      timestamp: new Date(),
    };
    set((state) => ({
      history: [historyItem, ...state.history].slice(0, 50),
    }));
  },
  
  setExecutionStats: (stats) => set({ executionStats: stats }),
  
  addExecutionStat: (stats) => {
    set((state) => ({
      recentExecutionStats: [stats, ...state.recentExecutionStats].slice(0, 100),
    }));
  },
  
  setSelectedField: (field) => set({ selectedField: field }),
  
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  
  clearPipeline: () => set({ stages: [], executionStats: null }),
}));

function getDefaultConfig(type: PipelineStage['type']): Record<string, any> {
  switch (type) {
    case '$match':
      return { conditions: [] };
    case '$group':
      return { _id: null, fields: {} };
    case '$sort':
      return { fields: [] };
    case '$limit':
      return { limit: 10 };
    case '$skip':
      return { skip: 0 };
    case '$project':
      return { fields: {} };
    case '$unwind':
      return { path: '' };
    case '$lookup':
      return { from: '', localField: '', foreignField: '', as: '' };
    case '$addFields':
      return { fields: {} };
    case '$count':
      return { field: 'count' };
    default:
      return {};
  }
}

