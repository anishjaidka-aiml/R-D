/**
 * Custom Node Component
 * 
 * Visual representation of workflow nodes in React Flow
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Play, Brain, Zap, Wrench, GitBranch, Code, X } from 'lucide-react';
import { NodeData } from '@/types/workflow';

// Icon mapping for different node types
const iconMap = {
  trigger: Play,
  agent: Brain,
  llm: Zap,
  tool: Wrench,
  condition: GitBranch,
  transform: Code,
};

// Color mapping for different node types
const colorMap = {
  trigger: 'bg-green-500',
  agent: 'bg-purple-500',
  llm: 'bg-blue-500',
  tool: 'bg-orange-500',
  condition: 'bg-yellow-500',
  transform: 'bg-pink-500',
};

function CustomNode({ id, data, selected }: NodeProps<NodeData>) {
  const Icon = iconMap[data.type] || Zap;
  const colorClass = colorMap[data.type] || 'bg-gray-500';
  const { deleteElements } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node selection when clicking delete
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div
      className={`group relative px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] transition-all ${
        selected ? 'border-primary ring-2 ring-primary' : 'border-gray-300'
      }`}
    >
      {/* Delete Button - appears on hover */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
        title="Delete node"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{data.description}</div>
          )}
        </div>
      </div>

      {/* Input Handle (top) - not for trigger nodes */}
      {data.type !== 'trigger' && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="w-3 h-3 !bg-primary" 
        />
      )}

      {/* Output Handle (bottom) - condition nodes have two */}
      {data.type === 'condition' ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3 !bg-green-500"
            style={{ left: '30%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3 !bg-red-500"
            style={{ left: '70%' }}
          />
        </>
      ) : (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-3 h-3 !bg-primary" 
        />
      )}
    </div>
  );
}

export default memo(CustomNode);
