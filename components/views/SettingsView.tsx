'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Database, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useState, useEffect } from 'react';

export function SettingsView() {
  const settings = useSettingsStore();
  const [showSaved, setShowSaved] = useState(false);

  // Show saved indicator when settings change
  useEffect(() => {
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [
    settings.connectionString,
    settings.defaultDatabase,
    settings.theme,
    settings.showLineNumbers,
    settings.defaultLimit,
    settings.enableQueryHistory,
    settings.defaultLanguage,
  ]);

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      settings.resetSettings();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your MongoDB connection and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showSaved && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Connection</CardTitle>
            </div>
            <CardDescription>MongoDB connection configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Connection String</label>
              <Input
                value={settings.connectionString}
                onChange={(e) => {
                  settings.updateConnectionString(e.target.value);
                }}
                placeholder="mongodb://localhost:27017"
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Default Database</label>
              <Input
                value={settings.defaultDatabase}
                onChange={(e) => {
                  settings.updateDefaultDatabase(e.target.value);
                }}
                placeholder="my_database"
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Display</CardTitle>
            <CardDescription>Interface preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Theme</span>
                <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
              </div>
              <Select
                value={settings.theme}
                onChange={(e) => {
                  settings.updateTheme(e.target.value as 'light' | 'dark' | 'auto');
                }}
                className="w-32"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Show Line Numbers</span>
                <p className="text-xs text-muted-foreground">In code editors</p>
              </div>
              <Button
                variant={settings.showLineNumbers ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  settings.toggleShowLineNumbers();
                }}
              >
                {settings.showLineNumbers ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Query Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Query</CardTitle>
            <CardDescription>Query behavior settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Default Limit</label>
              <Input
                type="number"
                value={settings.defaultLimit}
                onChange={(e) => {
                  settings.updateDefaultLimit(parseInt(e.target.value) || 100);
                }}
                min="1"
                max="10000"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Query History</span>
                <p className="text-xs text-muted-foreground">Save query history</p>
              </div>
              <Button
                variant={settings.enableQueryHistory ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  settings.toggleEnableQueryHistory();
                }}
              >
                {settings.enableQueryHistory ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Code Generation */}
        <Card>
          <CardHeader>
            <CardTitle>Code Generation</CardTitle>
            <CardDescription>Default code output settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Default Language</label>
              <Select
                value={settings.defaultLanguage}
                onChange={(e) => {
                  settings.updateDefaultLanguage(e.target.value as 'nodejs' | 'python' | 'shell');
                }}
              >
                <option value="nodejs">Node.js</option>
                <option value="python">Python</option>
                <option value="shell">MongoDB Shell</option>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
