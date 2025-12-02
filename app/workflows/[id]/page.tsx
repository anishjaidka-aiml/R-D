'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, ArrowLeft, Play, Download, Upload } from 'lucide-react';
import axios from 'axios';

import CustomNode from '@/components/nodes/CustomNode';
import NodePalette from '@/components/NodePalette';
import NodeConfig from '@/components/NodeConfig';
import { Workflow, NodeType, NodeData } from '@/types/workflow';
import { generateId } from '@/lib/utils';

const nodeTypes = {
  custom: CustomNode,
};

export default function WorkflowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const isNewWorkflow = workflowId === 'new';

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: NodeData } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNewWorkflow);
  const actualWorkflowId = useRef(isNewWorkflow ? generateId() : workflowId);

  useEffect(() => {
    if (!isNewWorkflow) {
      loadWorkflow();
    }
  }, [workflowId, isNewWorkflow]);

  const loadWorkflow = async () => {
    try {
      const response = await axios.get('/api/workflows');
      const workflows: Workflow[] = response.data;
      const workflow = workflows.find(w => w.id === workflowId);

      if (workflow) {
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || '');
        setNodes(workflow.nodes.map(node => ({
          ...node,
          type: 'custom',
        })));
        setEdges(workflow.edges);
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      alert('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onAddNode = (type: NodeType) => {
    const nodeCount = nodes.filter(n => n.data.type === type).length;
    const newNode: Node<NodeData> = {
      id: generateId(),
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodeCount + 1}`,
        type,
        config: {},
        description: `${type} node`,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode({ id: node.id, data: node.data });
  }, []);

  const onNodeConfigSave = (nodeId: string, config: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config,
            },
          };
        }
        return node;
      })
    );
  };

  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    setSaving(true);
    try {
      const workflow: Workflow = {
        id: actualWorkflowId.current,
        name: workflowName,
        description: workflowDescription,
        nodes: nodes.map(node => ({
          id: node.id,
          type: 'custom',
          position: node.position,
          data: node.data,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle ?? undefined,
          targetHandle: edge.targetHandle ?? undefined,
          label: typeof edge.label === 'string' ? edge.label : undefined,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await axios.post('/api/workflows', workflow);
      alert('Workflow saved successfully!');
      
      if (isNewWorkflow) {
        router.push(`/workflows/${actualWorkflowId.current}`);
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const exportWorkflow = () => {
    const workflow: Workflow = {
      id: actualWorkflowId.current,
      name: workflowName,
      description: workflowDescription,
      nodes: nodes.map(node => ({
        id: node.id,
        type: 'custom',
        position: node.position,
        data: node.data,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? undefined,
        targetHandle: edge.targetHandle ?? undefined,
        label: typeof edge.label === 'string' ? edge.label : undefined,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = (workflowName || 'workflow').replace(/\s+/g, '-').toLowerCase();
    link.download = `${fileName}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importWorkflow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const workflow: Workflow = JSON.parse(text);
        
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || '');
        setNodes(workflow.nodes.map(node => ({
          ...node,
          type: 'custom',
        })));
        setEdges(workflow.edges);
        
        alert('Workflow imported successfully! Click Save to store it.');
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import workflow. Make sure the file is valid.');
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => router.push('/workflows')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 max-w-xl">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full px-3 py-2 text-lg font-semibold border border-transparent hover:border-border focus:border-primary rounded-lg focus:outline-none transition-colors"
              placeholder="Workflow Name"
            />
            <input
              type="text"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="w-full px-3 py-1 text-sm text-muted-foreground border border-transparent hover:border-border focus:border-primary rounded-lg focus:outline-none mt-1 transition-colors"
              placeholder="Description (optional)"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={importWorkflow}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            title="Import workflow from JSON"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={exportWorkflow}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            title="Export workflow as JSON"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => router.push(`/workflows/${workflowId}/execute`)}
            disabled={isNewWorkflow}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 font-medium shadow-md"
            title={isNewWorkflow ? 'Save workflow first' : 'Execute workflow'}
          >
            <Play className="w-4 h-4" />
            Execute
          </button>
          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium shadow-md"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Workflow Builder */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
          <Controls className="bg-white border border-border rounded-lg shadow-lg" />
          <MiniMap className="bg-white border border-border rounded-lg shadow-lg" />
        </ReactFlow>

        <NodePalette onAddNode={onAddNode} />
        
        {selectedNode && (
          <NodeConfig
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onSave={onNodeConfigSave}
          />
        )}
      </div>
    </div>
  );
}
