/**
 * Workflow Types
 * 
 * Type definitions for visual workflows
 */

export type NodeType = 'trigger' | 'agent' | 'llm' | 'tool' | 'condition' | 'transform';

/**
 * Node data stored in each workflow node
 */
export interface NodeData {
  label: string;
  type: NodeType;
  description?: string;
  config: Record<string, any>;
}

/**
 * Workflow node (React Flow node)
 */
export interface WorkflowNode {
  id: string;
  type: string; // Always 'custom' for React Flow
  position: { x: number; y: number };
  data: NodeData;
}

/**
 * Connection between nodes (React Flow edge)
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

/**
 * Complete workflow definition
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Execution log for a single node
 */
export interface ExecutionLog {
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input?: any;
  output?: any;
  error?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  logs: ExecutionLog[];
  startTime: string;
  endTime?: string;
  triggerData?: any;
}
