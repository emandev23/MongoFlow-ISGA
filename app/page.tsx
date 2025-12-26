'use client';

import { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePipelineStore } from '@/store/pipelineStore';
import { useDocumentStore } from '@/store/documentStore';
import { useQueryStore } from '@/store/queryStore';
import { useWorkflowStore } from '@/store/workflowStore';
import { mockDatabases } from '@/lib/mockDocuments';
import { analyzeSchemaFromDocuments } from '@/lib/schemaAnalyzer';
import { DatabaseConnection } from '@/components/DatabaseConnection';
import { MainSidebar, ViewType } from '@/components/layout/MainSidebar';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { CollectionTabs, CollectionTabType } from '@/components/CollectionTabs';
import { DocumentViewer } from '@/components/DocumentViewer';
import { DatabaseSelector } from '@/components/DatabaseSelector';
import { UnifiedQueryBuilder } from '@/components/UnifiedQueryBuilder';
import { SchemaSidebar } from '@/components/SchemaSidebar';
import { SchemaView } from '@/components/views/SchemaView';
import { IndexesView } from '@/components/views/IndexesView';
import { ValidationView } from '@/components/views/ValidationView';
import { SettingsView } from '@/components/views/SettingsView';
import { ExecutionStats } from '@/components/ExecutionStats';
import { MongoShell } from '@/components/MongoShell';
import { AIAssistant } from '@/components/AIAssistant';
import { Database } from 'lucide-react';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { schema, setSchema, stages, addToHistory, setExecutionStats } = usePipelineStore();
  const { setDatabases, documents, databases } = useDocumentStore();
  const { createQuery, currentQuery } = useQueryStore();
  const { selectedDatabase, selectedCollection, isConnected, connectionString, hasEverConnected } = useWorkflowStore();
  const [isShellExpanded, setIsShellExpanded] = useState(false);
  const [shellHistory, setShellHistory] = useState<Array<{ command: string; error?: string; result?: any }>>([]);
  const connectionRef = useRef({ isConnected, connectionString });
  
  // Get active view from URL, default to 'documents'
  const activeViewFromUrl = (searchParams.get('view') as ViewType) || 'documents';
  const [activeView, setActiveView] = useState<ViewType>(activeViewFromUrl);
  
  // Collection tab state (when a collection is selected)
  const collectionTabFromUrl = (searchParams.get('tab') as CollectionTabType) || 'documents';
  const [activeCollectionTab, setActiveCollectionTab] = useState<CollectionTabType>(collectionTabFromUrl);
  
  const isUpdatingFromUrl = useRef(false);
  const isInitialMount = useRef(true);
  
  // Index count state - must be declared before conditional return
  const [indexCount, setIndexCount] = useState(0);

  // Listen for shell expansion requests from AI
  useEffect(() => {
    const handleExpand = () => {
      if (!isShellExpanded) {
        setIsShellExpanded(true);
      }
    };
    window.addEventListener('mongoShellExpand' as any, handleExpand);
    return () => window.removeEventListener('mongoShellExpand' as any, handleExpand);
  }, [isShellExpanded]);
  
  // Keep ref in sync with state
  useEffect(() => {
    connectionRef.current = { isConnected, connectionString };
  }, [isConnected, connectionString]);

  // Sync view state with URL changes (browser back/forward)
  useEffect(() => {
    const viewFromUrl = (searchParams.get('view') as ViewType) || 'documents';
    if (viewFromUrl !== activeView && ['documents', 'settings'].includes(viewFromUrl)) {
      isUpdatingFromUrl.current = true;
      setActiveView(viewFromUrl);
    }
    
    // Sync collection tab from URL
    const tabFromUrl = (searchParams.get('tab') as CollectionTabType) || 'documents';
    if (tabFromUrl !== activeCollectionTab && ['documents', 'aggregations', 'schema', 'indexes', 'validation'].includes(tabFromUrl)) {
      setActiveCollectionTab(tabFromUrl);
    }
  }, [searchParams, activeView, activeCollectionTab]);

  // Sync URL with view changes (only when user explicitly changes view, not from URL)
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Don't update URL if we're updating from URL (browser back/forward)
    if (isUpdatingFromUrl.current) {
      isUpdatingFromUrl.current = false;
      return;
    }

    const currentView = searchParams.get('view') || 'documents';
    if (currentView !== activeView) {
      // Update URL when view changes - this creates a history entry
      const url = new URL(window.location.href);
      url.searchParams.set('view', activeView);
      router.push(url.pathname + url.search, { scroll: false });
    }
  }, [activeView, router, searchParams]);

  useEffect(() => {
    // Mock API call to get databases
    const databases = mockDatabases();
    setDatabases(databases);
    
    // Create default query if none exists
    if (!currentQuery) {
      createQuery('My Query');
    }
  }, [setDatabases, createQuery, currentQuery]);

  // Update schema dynamically based on documents
  useEffect(() => {
    if (documents.length > 0) {
      const analyzedSchema = analyzeSchemaFromDocuments(documents);
      setSchema(analyzedSchema);
    } else {
      // If no documents, set empty schema
      setSchema([]);
    }
  }, [documents, setSchema]);

  // Fetch index count when collection changes
  useEffect(() => {
    if (connectionString && selectedDatabase && selectedCollection) {
      fetch('/api/mongodb/indexes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString,
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.count !== undefined) {
            setIndexCount(data.count);
          }
        })
        .catch(() => setIndexCount(0));
    } else {
      setIndexCount(0);
    }
  }, [connectionString, selectedDatabase, selectedCollection]);

  // Get document and index counts
  const selectedDb = databases.find(db => db.name === selectedDatabase);
  const selectedCol = selectedDb?.collections.find(col => col.name === selectedCollection);
  const documentCount = selectedCol?.documentCount ?? documents.length;

  // Show database connection workflow ONLY if we've never been connected
  // Once connected (hasEverConnected = true), NEVER redirect - allow free navigation
  // This prevents any redirects when clicking databases/collections in the sidebar
  const shouldShowConnection = useMemo(() => {
    // Only show connection screen if we've never successfully connected
    // Once connected, stay on main app forever (until explicit disconnect)
    return !hasEverConnected || !isConnected || !connectionString;
  }, [hasEverConnected, isConnected, connectionString]);
  
  // Only render DatabaseConnection if we need to connect
  // Once connected, always show the main app regardless of database/collection selection
  if (shouldShowConnection) {
    return <DatabaseConnection />;
  }

  // Helper component to show "no collection selected" message
  const NoCollectionMessage = () => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center max-w-md">
        <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Collection Selected</h2>
        <p className="text-muted-foreground">
          Select a database and collection from the sidebar to view documents, build queries, and analyze data.
        </p>
            </div>
          </div>
        );
      
  const renderCollectionContent = () => {
    // All views require a collection to be selected
    if (!selectedDatabase || !selectedCollection) {
      return <NoCollectionMessage />;
    }

    switch (activeCollectionTab) {
      case 'documents':
        // Documents view - full width, no DatabaseSelector (sidebar has it)
        return <DocumentViewer />;
      
      case 'aggregations':
        // Aggregations view - schema sidebar + query builder
        return (
          <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-3">
              <SchemaSidebar schema={schema} />
            </div>
            <div className="col-span-9">
              <UnifiedQueryBuilder />
            </div>
          </div>
        );
      
      case 'schema':
        return <SchemaView />;
      
      case 'indexes':
        return <IndexesView />;
      
      case 'validation':
        return <ValidationView />;
      
      default:
        return <DocumentViewer />;
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'documents':
        // Always show collection content (which handles no collection case)
        // Collection tabs will be shown if collection is selected
        return renderCollectionContent();
      
      case 'settings':
        return <SettingsView />;
      
      default:
        // Default to collection content
        return renderCollectionContent();
    }
  };

  const handleCollectionTabChange = (tab: CollectionTabType) => {
    setActiveCollectionTab(tab);
    // Update URL with new tab
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.push(url.pathname + url.search, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">MongoFlow Pro</h1>
                <div className="mt-1">
                  <BreadcrumbNav />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Collection Tabs - Only show when collection is selected */}
              {selectedDatabase && selectedCollection && (
                <CollectionTabs
                  activeTab={activeCollectionTab}
                  onTabChange={handleCollectionTabChange}
                  documentCount={documentCount}
                  indexCount={indexCount}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <MainSidebar 
          activeView={activeView} 
          onViewChange={(view) => {
            setActiveView(view);
            // Update URL with new view
            const url = new URL(window.location.href);
            url.searchParams.set('view', view);
            router.push(url.pathname + url.search, { scroll: false });
          }} 
        />
        
        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto p-6 transition-all ${isShellExpanded ? 'pb-[500px]' : 'pb-12'}`}>
          {renderView()}
        </main>
      </div>

      {/* Execution Stats Toast */}
      <ExecutionStats />

      {/* MongoDB Shell - Bottom Panel */}
      <MongoShell 
        isExpanded={isShellExpanded} 
        onToggle={() => setIsShellExpanded(!isShellExpanded)}
        onHistoryChange={(history) => {
          setShellHistory(history.map(h => ({
            command: h.command,
            error: h.error,
            result: h.result,
          })));
        }}
      />

      {/* AI Assistant - Floating Chat with Agent Capabilities */}
      <AIAssistant 
        shellHistory={shellHistory}
        onExecuteCode={(code) => {
          // Execute code in shell
          if (connectionString && selectedDatabase) {
            fetch('/api/mongodb/shell', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                connectionString,
                databaseName: selectedDatabase,
                collectionName: selectedCollection,
                command: code,
              }),
            }).then(res => res.json()).then(data => {
              setShellHistory(prev => [...prev, {
                command: code,
                result: data.result,
                error: data.error,
              }]);
            });
          }
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
