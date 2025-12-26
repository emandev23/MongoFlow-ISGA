'use client';

import { usePipelineStore } from '@/store/pipelineStore';
import { Toast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Database, CheckCircle2, XCircle } from 'lucide-react';

export function ExecutionStats() {
  const { executionStats, setExecutionStats } = usePipelineStore();

  if (!executionStats) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Toast
        open={!!executionStats}
        onOpenChange={(open) => !open && setExecutionStats(null)}
        className="bg-card border-2"
      >
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Execution Stats</h3>
                <Badge variant={executionStats.indexUsed ? 'default' : 'destructive'}>
                  {executionStats.indexUsed ? 'Indexed' : 'No Index'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Execution Time</p>
                    <p className="font-semibold">{executionStats.executionTime ?? 0}ms</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Documents Scanned</p>
                    <p className="font-semibold">{(executionStats.documentsScanned ?? 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Documents Returned</p>
                    <p className="font-semibold">{executionStats.documentsReturned ?? 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {executionStats.indexUsed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Index Used</p>
                    <p className="font-semibold">{executionStats.indexUsed ?? false ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Toast>
    </div>
  );
}


