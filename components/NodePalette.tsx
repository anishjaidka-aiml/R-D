/**
 * Node Palette Component
 * 
 * Sidebar with available node types that can be added to workflow
 */

'use client';

import { Play, Brain, Zap, Wrench, GitBranch, Code, Link2, Network, Route, Users } from 'lucide-react';
import { NodeType } from '@/types/workflow';

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void;
}

const nodeTypes = [
  {
    type: 'trigger' as NodeType,
    label: 'Trigger',
    icon: Play,
    color: 'bg-green-500',
    description: 'Start workflow',
  },
  {
    type: 'agent' as NodeType,
    label: 'AI Agent',
    icon: Brain,
    color: 'bg-purple-500',
    description: 'LangChain agent with tools',
  },
  {
    type: 'llm' as NodeType,
    label: 'LLM',
    icon: Zap,
    color: 'bg-blue-500',
    description: 'Simple LLM call',
  },
  {
    type: 'tool' as NodeType,
    label: 'Tool',
    icon: Wrench,
    color: 'bg-orange-500',
    description: 'Execute a specific tool',
  },
  {
    type: 'condition' as NodeType,
    label: 'Condition',
    icon: GitBranch,
    color: 'bg-yellow-500',
    description: 'If/else logic',
  },
  {
    type: 'transform' as NodeType,
    label: 'Transform',
    icon: Code,
    color: 'bg-pink-500',
    description: 'Transform data',
  },
  {
    type: 'llm_chain' as NodeType,
    label: 'LLM Chain',
    icon: Link2,
    color: 'bg-indigo-500',
    description: 'Prompt template → LLM',
  },
  {
    type: 'sequential_chain' as NodeType,
    label: 'Sequential Chain',
    icon: Network,
    color: 'bg-teal-500',
    description: 'Chain multiple LLM calls',
  },
  {
    type: 'router_chain' as NodeType,
    label: 'Router Chain',
    icon: Route,
    color: 'bg-cyan-500',
    description: 'Route to different chains',
  },
  {
    type: 'multi_agent' as NodeType,
    label: 'Multi-Agent',
    icon: Users,
    color: 'bg-violet-500',
    description: 'Multiple agents working together',
  },
];

export default function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="absolute left-4 top-4 bg-white rounded-xl shadow-xl border border-border p-4 z-10 w-64">
      <h3 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
        <Wrench className="w-4 h-4" />
        Add Nodes
      </h3>
      <div className="space-y-2">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          return (
            <button
              key={node.type}
              onClick={() => onAddNode(node.type)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-purple-50 hover:border-primary transition-all text-left group"
            >
              <div className={`p-2 rounded-lg ${node.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                <Icon className={`w-4 h-4 ${node.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{node.label}</div>
                <div className="text-xs text-gray-500 truncate">{node.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
