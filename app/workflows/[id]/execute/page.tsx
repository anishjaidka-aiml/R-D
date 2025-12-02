'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, Loader, AlertCircle } from 'lucide-react';
import axios from 'axios';

import { Workflow, WorkflowExecution, ExecutionLog } from '@/types/workflow';
import { formatDuration } from '@/lib/utils';

export default function ExecuteWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [triggerData, setTriggerData] = useState('{\n  "message": "Hello, workflow!"\n}');
  const [executing, setExecuting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      const response = await axios.get('/api/workflows');
      const workflows: Workflow[] = response.data;
      const wf = workflows.find(w => w.id === workflowId);

      if (wf) {
        setWorkflow(wf);
        
        // Auto-load trigger data from trigger node
        const triggerNode = wf.nodes.find(n => n.data.type === 'trigger');
        if (triggerNode && triggerNode.data.config.triggerData) {
          const data = triggerNode.data.config.triggerData;
          // If it's already a string, use it; otherwise stringify it
          const triggerDataString = typeof data === 'string' 
            ? data 
            : JSON.stringify(data, null, 2);
          setTriggerData(triggerDataString);
          console.log('✅ Auto-loaded trigger data from trigger node');
        }
      } else {
        alert('Workflow not found');
        router.push('/workflows');
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      alert('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async () => {
    if (!workflow) return;

    setExecuting(true);
    setExecution(null);

    try {
      let parsedTriggerData = null;
      if (triggerData.trim()) {
        try {
          parsedTriggerData = JSON.parse(triggerData);
        } catch (e) {
          alert('Invalid JSON in trigger data');
          setExecuting(false);
          return;
        }
      }

      const response = await axios.post('/api/workflows/execute', {
        workflow,
        triggerData: parsedTriggerData,
      });

      setExecution(response.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to execute workflow');
      console.error('Execution error:', error);
    } finally {
      setExecuting(false);
    }
  };

  const getStatusIcon = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/workflows/${workflowId}`)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workflow.name}</h1>
            <p className="text-muted-foreground mt-1">Execute and monitor workflow</p>
          </div>
        </div>

        {/* Workflow Info */}
        <div className="bg-white rounded-xl border border-border p-4 mb-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{workflow.nodes.length} nodes</span>
            </div>
            <div>{workflow.edges.length} connections</div>
            {workflow.description && <div className="flex-1 text-right">{workflow.description}</div>}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Execution Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-border p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Trigger Data</h2>
              <textarea
                value={triggerData}
                onChange={(e) => setTriggerData(e.target.value)}
                className="w-full h-48 px-4 py-3 font-mono text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder='{"key": "value"}'
              />
              <p className="text-xs text-muted-foreground mt-3">
                Provide input data for the workflow trigger (JSON format)
              </p>
            </div>

            <button
              onClick={executeWorkflow}
              disabled={executing}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
            >
              {executing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Executing Workflow...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Execute Workflow
                </>
              )}
            </button>

            {execution && (
              <div className="bg-white rounded-xl border border-border p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Execution Summary</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      execution.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : execution.status === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {execution.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Execution ID:</span>
                    <span className="font-mono text-xs">{execution.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nodes Executed:</span>
                    <span>{execution.logs.length}</span>
                  </div>
                  {execution.endTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>
                        {formatDuration(
                          new Date(execution.endTime).getTime() -
                            new Date(execution.startTime).getTime()
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Execution Logs */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Execution Logs</h2>
            
            {!execution ? (
              <div className="text-center py-16 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Execute the workflow to see logs</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {execution.logs.map((log, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="font-semibold text-sm">{log.nodeName}</div>
                          {log.duration && (
                            <div className="text-xs text-muted-foreground">
                              {formatDuration(log.duration)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {log.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-xs font-semibold text-red-700 mb-1">
                          Error
                        </div>
                        <div className="text-xs text-red-600">{log.error}</div>
                      </div>
                    )}

                    {log.output && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-semibold text-gray-700 mb-2">
                          Output
                        </div>
                        <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {JSON.stringify(log.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

