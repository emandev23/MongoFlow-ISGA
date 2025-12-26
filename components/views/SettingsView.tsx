'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Database, Save, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useState } from 'react';

export function SettingsView() {
  const settings = useSettingsStore();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    setHasChanges(false);
  };

  const handleReset = () => {
    settings.resetSettings();
    setHasChanges(false);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
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
                  setHasChanges(true);
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
                  setHasChanges(true);
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
              <select
                value={settings.theme}
                onChange={(e) => {
                  settings.updateTheme(e.target.value as 'light' | 'dark' | 'auto');
                  setHasChanges(true);
                }}
                className="px-3 py-1.5 border rounded-md text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
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
                  setHasChanges(true);
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
                  setHasChanges(true);
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
                  setHasChanges(true);
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
              <select
                value={settings.defaultLanguage}
                onChange={(e) => {
                  settings.updateDefaultLanguage(e.target.value as 'nodejs' | 'python' | 'shell');
                  setHasChanges(true);
                }}
                className="w-full px-3 py-1.5 border rounded-md text-sm"
              >
                <option value="nodejs">Node.js</option>
                <option value="python">Python</option>
                <option value="shell">MongoDB Shell</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
