import { create } from 'zustand';
import { VisualQuery, QueryGroup, QueryCondition } from '@/types/query';

interface QueryState {
  queries: VisualQuery[];
  currentQuery: VisualQuery | null;
  queryResults: any[];
  isLoadingResults: boolean;
  
  createQuery: (name?: string) => void;
  updateQuery: (query: VisualQuery) => void;
  deleteQuery: (id: string) => void;
  setCurrentQuery: (query: VisualQuery | null) => void;
  addCondition: (groupId: string, condition: Omit<QueryCondition, 'id'>) => void;
  updateCondition: (groupId: string, conditionId: string, updates: Partial<QueryCondition>) => void;
  removeCondition: (groupId: string, conditionId: string) => void;
  addGroup: (parentGroupId: string, logicalOperator: 'AND' | 'OR') => void;
  setQueryResults: (results: any[]) => void;
  setLoadingResults: (loading: boolean) => void;
}

const createDefaultQuery = (name?: string): VisualQuery => ({
  id: `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: name || 'New Query',
  query: {
    id: `group-${Date.now()}`,
    conditions: [],
    logicalOperator: 'AND',
    groups: [],
  },
});

export const useQueryStore = create<QueryState>((set, get) => ({
  queries: [],
  currentQuery: null,
  queryResults: [],
  isLoadingResults: false,
  
  createQuery: (name) => {
    const newQuery = createDefaultQuery(name);
    set({ currentQuery: newQuery });
  },
  
  updateQuery: (query) => {
    set({ currentQuery: query });
    set((state) => ({
      queries: state.queries.map((q) => (q.id === query.id ? query : q)),
    }));
  },
  
  deleteQuery: (id) => {
    set((state) => ({
      queries: state.queries.filter((q) => q.id !== id),
      currentQuery: state.currentQuery?.id === id ? null : state.currentQuery,
    }));
  },
  
  setCurrentQuery: (query) => set({ currentQuery: query }),
  
  addCondition: (groupId, condition) => {
    const state = get();
    if (!state.currentQuery) return;
    
    const newCondition: QueryCondition = {
      ...condition,
      id: `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updateGroup = (group: QueryGroup): QueryGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [...group.conditions, newCondition],
        };
      }
      if (group.groups) {
        return {
          ...group,
          groups: group.groups.map(updateGroup),
        };
      }
      return group;
    };
    
    const updatedQuery = {
      ...state.currentQuery,
      query: updateGroup(state.currentQuery.query),
    };
    
    set({ currentQuery: updatedQuery });
  },
  
  updateCondition: (groupId, conditionId, updates) => {
    const state = get();
    if (!state.currentQuery) return;
    
    const updateGroup = (group: QueryGroup): QueryGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.map((c) =>
            c.id === conditionId ? { ...c, ...updates } : c
          ),
        };
      }
      if (group.groups) {
        return {
          ...group,
          groups: group.groups.map(updateGroup),
        };
      }
      return group;
    };
    
    const updatedQuery = {
      ...state.currentQuery,
      query: updateGroup(state.currentQuery.query),
    };
    
    set({ currentQuery: updatedQuery });
  },
  
  removeCondition: (groupId, conditionId) => {
    const state = get();
    if (!state.currentQuery) return;
    
    const updateGroup = (group: QueryGroup): QueryGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.filter((c) => c.id !== conditionId),
        };
      }
      if (group.groups) {
        return {
          ...group,
          groups: group.groups.map(updateGroup),
        };
      }
      return group;
    };
    
    const updatedQuery = {
      ...state.currentQuery,
      query: updateGroup(state.currentQuery.query),
    };
    
    set({ currentQuery: updatedQuery });
  },
  
  addGroup: (parentGroupId, logicalOperator) => {
    const state = get();
    if (!state.currentQuery) return;
    
    const newGroup: QueryGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conditions: [],
      logicalOperator,
      groups: [],
    };
    
    const updateGroup = (group: QueryGroup): QueryGroup => {
      if (group.id === parentGroupId) {
        return {
          ...group,
          groups: [...(group.groups || []), newGroup],
        };
      }
      if (group.groups) {
        return {
          ...group,
          groups: group.groups.map(updateGroup),
        };
      }
      return group;
    };
    
    const updatedQuery = {
      ...state.currentQuery,
      query: updateGroup(state.currentQuery.query),
    };
    
    set({ currentQuery: updatedQuery });
  },
  
  setQueryResults: (results) => set({ queryResults: results }),
  
  setLoadingResults: (loading) => set({ isLoadingResults: loading }),
}));

