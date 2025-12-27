'use client';

import { useState } from 'react';
import { useWorkflowStore, useWorkflowStore as getWorkflowStore } from '@/store/workflowStore';
import { useDocumentStore } from '@/store/documentStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Database, Server, Folder, FileText, CheckCircle2, AlertCircle, Loader2, Download, Sparkles } from 'lucide-react';
import { mockDatabases } from '@/lib/mockDocuments';

export function DatabaseConnection() {
  const { 
    selectedDatabase, 
    selectedCollection, 
    selectDatabase, 
    selectCollection,
    setConnectionString,
    isConnected,
    disconnect,
  } = useWorkflowStore();
  const { databases, setDatabases, createDatabase } = useDocumentStore();
  // Use environment variable as default if available, otherwise localhost
  const defaultConnection = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_MONGODB_URI || 'mongodb://localhost:27017')
    : 'mongodb://localhost:27017';
  const [connectionString, setConnectionStringLocal] = useState(defaultConnection);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showNewDb, setShowNewDb] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);

  const handleConnect = async () => {
    if (!connectionString.trim()) {
      alert('Please enter a connection string');
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch('/api/mongodb/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect');
      }

      // Set connection string in workflow store
      setConnectionString(connectionString);
      
      // Fetch real databases
      const dbResponse = await fetch('/api/mongodb/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionString }),
      });

      const dbData = await dbResponse.json();
      
      if (dbResponse.ok && dbData.databases) {
        // Convert to the format expected by the store
        const formattedDatabases = dbData.databases.map((db: any) => ({
          name: db.name,
          collections: (db.collections || []).map((coll: any) => ({
            name: coll.name,
            documentCount: coll.count || 0,
          })),
        }));
        setDatabases(formattedDatabases);
      } else {
        // Fallback to mock if API fails
        const mockDbs = mockDatabases();
        setDatabases(mockDbs);
      }
    } catch (error: any) {
      alert(`Connection failed: ${error.message}`);
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setDatabases([]);
  };

  const handleCreateDatabase = () => {
    if (newDbName.trim()) {
      createDatabase(newDbName.trim());
      selectDatabase(newDbName.trim());
      setNewDbName('');
      setShowNewDb(false);
    }
  };

  const handleSeedDatabase = async (dbName: string) => {
    const { connectionString: storedConnectionString } = getWorkflowStore.getState();
    const connStr = connectionString || storedConnectionString;
    
    if (!connStr) {
      alert('Please connect to MongoDB first');
      return;
    }

    if (!confirm(`This will replace all data in the "${dbName}" database with sample data. Continue?`)) {
      return;
    }

    setIsSeeding(true);
    setSeedResult(null);
    
    console.log('Starting seed for database:', dbName);
    console.log('Using connection string:', connStr.substring(0, 20) + '...');

    try {
      const response = await fetch('/api/mongodb/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString: connStr,
          databaseName: dbName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Seed API error:', data);
        throw new Error(data.error || 'Failed to seed database');
      }

      console.log('Seed result:', data);
      setSeedResult(data);
      
      // Check if seeding actually worked
      if (data.summary && data.summary.totalDocuments === 0) {
        console.warn('Warning: No documents were inserted');
        alert('Warning: Database was created but no documents were inserted. Check console for errors.');
      }
      
      // Wait a moment for MongoDB to update, then refresh databases list
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dbResponse = await fetch('/api/mongodb/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionString: connStr }),
      });

      const dbData = await dbResponse.json();
      if (dbResponse.ok && dbData.databases) {
        const formattedDatabases = dbData.databases.map((db: any) => ({
          name: db.name,
          collections: (db.collections || []).map((coll: any) => ({
            name: coll.name,
            documentCount: coll.count || 0,
          })),
        }));
        setDatabases(formattedDatabases);
        
        // Log the seeded database info
        const seededDb = formattedDatabases.find((d: any) => d.name === dbName);
        if (seededDb) {
          console.log(`Database ${dbName} now has ${seededDb.collections.length} collections`);
          seededDb.collections.forEach((coll: any) => {
            console.log(`  - ${coll.name}: ${coll.documentCount} documents`);
          });
        }
      } else {
        console.error('Failed to refresh database list:', dbData);
      }
    } catch (error: any) {
      alert(`Failed to seed database: ${error.message}`);
      console.error('Seed error:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  // Step 1: Connection
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Database className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Connect to MongoDB</CardTitle>
            <CardDescription className="text-lg">
              Start by connecting to your MongoDB instance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                Connection String
              </label>
              <Input
                value={connectionString}
                onChange={(e) => setConnectionStringLocal(e.target.value)}
                placeholder="mongodb://localhost:27017"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                For demo purposes, this uses mock data. In production, this would connect to your MongoDB instance.
              </p>
            </div>
            
            <Button 
              onClick={handleConnect} 
              className="w-full" 
              size="lg"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Database Selection
  if (!selectedDatabase) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Database className="h-8 w-8 text-primary" />
                Select Database
              </h1>
              <p className="text-muted-foreground mt-2">
                Choose a database to work with, or create a new one
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  const dbName = 'sample_db';
                  if (!databases.find(db => db.name === dbName)) {
                    createDatabase(dbName);
                  }
                  handleSeedDatabase(dbName);
                }}
                disabled={isSeeding}
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Quick Start
                  </>
                )}
              </Button>
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {databases.map((db) => (
              <Card
                key={db.name}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => selectDatabase(db.name)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Folder className="h-6 w-6 text-primary" />
                    <Badge variant="secondary">{db.collections.length} collections</Badge>
                  </div>
                  <CardTitle className="text-xl">{db.name}</CardTitle>
                  <CardDescription>
                    {db.collections.reduce((sum, col) => sum + col.documentCount, 0).toLocaleString()} documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {db.collections.slice(0, 3).map((col) => (
                      <div key={col.name} className="flex items-center gap-2 text-sm">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>{col.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {col.documentCount}
                        </Badge>
                      </div>
                    ))}
                    {db.collections.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{db.collections.length - 3} more collections
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Create New Database Card */}
            <Card
              className="border-dashed cursor-pointer hover:border-primary transition-colors"
              onClick={() => setShowNewDb(true)}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">Create New Database</CardTitle>
                <CardDescription className="text-center mt-2">
                  Create a new database to get started
                </CardDescription>
              </CardContent>
            </Card>

            {/* Import Sample Data Card */}
            <Card
              className="border-primary/50 bg-primary/5 cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                const dbName = prompt('Enter database name for sample data (or use existing):', 'sample_db');
                if (dbName && dbName.trim()) {
                  if (!databases.find(db => db.name === dbName.trim())) {
                    createDatabase(dbName.trim());
                  }
                  handleSeedDatabase(dbName.trim());
                }
              }}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Import Sample Data</CardTitle>
                <CardDescription className="text-center mt-2">
                  Create a database with comprehensive test data
                </CardDescription>
                <Badge variant="secondary" className="mt-2">
                  7 collections • 2,500+ documents
                </Badge>
                <div className="mt-4 text-xs text-muted-foreground text-center max-w-xs">
                  Includes: users, products, orders, events, sessions, reviews, categories
                </div>
              </CardContent>
            </Card>
          </div>

          {showNewDb && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Create New Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Database name"
                    value={newDbName}
                    onChange={(e) => setNewDbName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateDatabase()}
                    autoFocus
                  />
                  <Button onClick={handleCreateDatabase}>Create</Button>
                  <Button variant="outline" onClick={() => {
                    setShowNewDb(false);
                    setNewDbName('');
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isSeeding && (
            <Card className="border-primary">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium">Seeding database with sample data...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
              </CardContent>
            </Card>
          )}

          {seedResult && !isSeeding && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-900 dark:text-green-100">Database Seeded Successfully!</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {seedResult.message}
                  </p>
                  <div className="mt-4 space-y-1">
                    {seedResult.results?.map((result: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-green-700 dark:text-green-300">{result.collection}</span>
                        {result.success ? (
                          <Badge variant="secondary" className="bg-green-200 text-green-800">
                            {result.inserted} documents
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => setSeedResult(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Collection Selection
  const selectedDb = databases.find(db => db.name === selectedDatabase);
  
  if (!selectedCollection && selectedDb) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Database className="h-4 w-4" />
                <span>{selectedDatabase}</span>
                <span>/</span>
                <FileText className="h-4 w-4" />
                <span>Select Collection</span>
              </div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                Select Collection
              </h1>
              <p className="text-muted-foreground mt-2">
                Choose a collection from <strong>{selectedDatabase}</strong> database
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => selectDatabase('')}>
                Back to Databases
              </Button>
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedDb.collections.map((col) => (
              <Card
                key={col.name}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => selectCollection(col.name)}
              >
                <CardHeader>
                  <FileText className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-lg">{col.name}</CardTitle>
                  <CardDescription>
                    {col.documentCount.toLocaleString()} documents
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
            
            {/* Create New Collection Card */}
            <Card 
              className="border-dashed cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                const collectionName = prompt('Enter collection name:');
                if (collectionName && selectedDatabase) {
                  const { createCollection } = useDocumentStore.getState();
                  createCollection(selectedDatabase, collectionName);
                  selectCollection(collectionName);
                }
              }}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">Create Collection</CardTitle>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null; // Collection selected, show main app
}

