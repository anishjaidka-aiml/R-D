/**
 * Node Configuration Panel
 * 
 * Modal for configuring individual nodes
 */

'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { NodeData } from '@/types/workflow';
import { getAllToolNames, TOOL_METADATA } from '@/lib/langchain/tools/tool-metadata';

interface NodeConfigProps {
  node: { id: string; data: NodeData } | null;
  onClose: () => void;
  onSave: (nodeId: string, config: Record<string, any>) => void;
}

export default function NodeConfig({ node, onClose, onSave }: NodeConfigProps) {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [gmailStatus, setGmailStatus] = useState<{
    connected: boolean;
    valid: boolean;
    needsReauthentication: boolean;
  } | null>(null);
  // Store raw JSON strings for textareas to allow free typing
  const [jsonInputs, setJsonInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (node) {
      const nodeConfig = node.data.config || {};
      setConfig(nodeConfig);
      // Initialize JSON input strings
      const initialJsonInputs: Record<string, string> = {
        'sequential_initialInput': JSON.stringify(nodeConfig.initialInput || {}, null, 2),
        'llm_chain_variables': JSON.stringify(nodeConfig.variables || {}, null, 2),
        'router_chain_input': JSON.stringify(nodeConfig.input || {}, null, 2),
        'multi_agent_sharedContext': JSON.stringify(nodeConfig.sharedContext || {}, null, 2),
      };
      // Initialize router destination chainConfig values
      if (nodeConfig.destinations && Array.isArray(nodeConfig.destinations)) {
        nodeConfig.destinations.forEach((dest: any, idx: number) => {
          initialJsonInputs[`router_dest_${idx}_chainConfig`] = JSON.stringify(dest.chainConfig || {}, null, 2);
        });
      }
      setJsonInputs(initialJsonInputs);
    }
  }, [node]);

  // Check Gmail status when configuring agent node
  useEffect(() => {
    if (node?.data.type === 'agent') {
      const checkGmailStatus = async () => {
        try {
          const response = await fetch('/api/auth/gmail/status?userId=default');
          if (response.ok) {
            const data = await response.json();
            setGmailStatus(data);
          }
        } catch (error) {
          // Ignore errors, just don't show status
        }
      };
      checkGmailStatus();
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    onSave(node.id, config);
    onClose();
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTool = (toolName: string) => {
    const currentTools = config.tools || [];
    const newTools = currentTools.includes(toolName)
      ? currentTools.filter((t: string) => t !== toolName)
      : [...currentTools, toolName];
    updateConfig('tools', newTools);
  };

  const renderConfigForm = () => {
    switch (node.data.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This is the starting point of your workflow. Configure initial trigger data.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Trigger Data (JSON)</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows={5}
                value={config.triggerData || ''}
                onChange={(e) => updateConfig('triggerData', e.target.value)}
                placeholder='{\n  "message": "Hello, workflow!"\n}'
              />
            </div>
          </div>
        );

      case 'agent':
        const availableTools = getAllToolNames();
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">System Prompt</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                rows={3}
                value={config.systemPrompt || ''}
                onChange={(e) => updateConfig('systemPrompt', e.target.value)}
                placeholder="You are a helpful AI assistant..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                rows={4}
                value={config.prompt || ''}
                onChange={(e) => updateConfig('prompt', e.target.value)}
                placeholder="Use {{trigger.message}} to reference previous node data"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {`{{nodeName.field}}`} to reference data from previous nodes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Available Tools</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                {availableTools.map((toolName) => {
                  const metadata = TOOL_METADATA[toolName as keyof typeof TOOL_METADATA];
                  const isGmailTool = toolName === 'send_gmail';
                  const isGmailSelected = (config.tools || []).includes(toolName);
                  const gmailNotConnected = isGmailTool && gmailStatus && !gmailStatus.connected;
                  const gmailNeedsReauth = isGmailTool && gmailStatus && gmailStatus.needsReauthentication;
                  
                  return (
                    <div key={toolName}>
                      <label className={`flex items-start gap-3 p-2 rounded hover:bg-gray-50 ${
                        gmailNotConnected ? 'opacity-60' : 'cursor-pointer'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isGmailSelected}
                          onChange={() => toggleTool(toolName)}
                          disabled={gmailNotConnected}
                          className="mt-1 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{metadata?.icon || '🔧'}</span>
                            <span className="text-sm font-medium">{metadata?.name || toolName}</span>
                          </div>
                          {metadata?.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {metadata.description}
                            </p>
                          )}
                        </div>
                      </label>
                      
                      {/* Gmail Warning */}
                      {isGmailTool && isGmailSelected && (gmailNotConnected || gmailNeedsReauth) && (
                        <div className="ml-8 mt-1 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-yellow-800 font-medium mb-1">
                                {gmailNotConnected ? 'Gmail not connected' : 'Gmail token expired'}
                              </p>
                              <p className="text-yellow-700 mb-2">
                                {gmailNotConnected 
                                  ? 'Connect your Gmail account to use this tool.'
                                  : 'Reconnect your Gmail account to refresh the token.'}
                              </p>
                              <Link
                                href="/settings/gmail"
                                className="text-yellow-900 underline hover:no-underline font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose(); // Close config modal when navigating
                                }}
                              >
                                Go to Gmail Settings →
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableMemory || false}
                  onChange={(e) => updateConfig('enableMemory', e.target.checked)}
                  className="rounded w-4 h-4"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">🧠 Enable Memory</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agent will remember conversation history within the workflow execution
                  </p>
                </div>
              </label>
              
              {config.enableMemory && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    Conversation ID (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    value={config.conversationId || ''}
                    onChange={(e) => updateConfig('conversationId', e.target.value)}
                    placeholder="Leave empty for auto-generated ID"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use same ID across workflow runs to maintain memory
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={config.temperature || 0.7}
                  onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Tokens</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={config.maxTokens || 1000}
                  onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        );

      case 'llm':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                rows={5}
                value={config.prompt || ''}
                onChange={(e) => updateConfig('prompt', e.target.value)}
                placeholder="Enter your prompt here..."
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Left Value</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={config.leftValue || ''}
                onChange={(e) => updateConfig('leftValue', e.target.value)}
                placeholder="{{agent.result}}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Operator</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={config.operator || '=='}
                onChange={(e) => updateConfig('operator', e.target.value)}
              >
                <option value="==">Equals (==)</option>
                <option value="!=">Not Equals (!=)</option>
                <option value=">">Greater Than (&gt;)</option>
                <option value="<">Less Than (&lt;)</option>
                <option value="contains">Contains</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Right Value</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={config.rightValue || ''}
                onChange={(e) => updateConfig('rightValue', e.target.value)}
                placeholder="success"
              />
            </div>
          </div>
        );

      case 'llm_chain':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prompt Template</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                rows={5}
                value={config.promptTemplate || ''}
                onChange={(e) => updateConfig('promptTemplate', e.target.value)}
                placeholder="Write a {tone} email about {topic}"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {`{variableName}`} for variables. Variables can come from previous nodes or be set here.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Variables (JSON)</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                rows={3}
                value={jsonInputs['llm_chain_variables'] || JSON.stringify(config.variables || {}, null, 2)}
                onChange={(e) => {
                  const value = e.target.value;
                  // Update raw string immediately
                  setJsonInputs(prev => ({ ...prev, 'llm_chain_variables': value }));
                  // Try to parse and update config if valid JSON
                  try {
                    const parsed = JSON.parse(value);
                    updateConfig('variables', parsed);
                  } catch {
                    // Invalid JSON, but keep the raw string for user to continue typing
                  }
                }}
                placeholder='{"tone": "professional", "topic": "meeting"}'
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Set default variable values. Can reference previous nodes: {`{{nodeName.field}}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={config.temperature ?? 0.7}
                  onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Model (optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  value={config.modelName || ''}
                  onChange={(e) => updateConfig('modelName', e.target.value)}
                  placeholder="llama-3.3-70b-instruct"
                />
              </div>
            </div>
          </div>
        );

      case 'sequential_chain':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Initial Input Variables (JSON)</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                rows={3}
                value={jsonInputs['sequential_initialInput'] || JSON.stringify(config.initialInput || {}, null, 2)}
                onChange={(e) => {
                  const value = e.target.value;
                  // Update raw string immediately
                  setJsonInputs(prev => ({ ...prev, 'sequential_initialInput': value }));
                  // Try to parse and update config if valid JSON
                  try {
                    const parsed = JSON.parse(value);
                    updateConfig('initialInput', parsed);
                  } catch {
                    // Invalid JSON, but keep the raw string for user to continue typing
                  }
                }}
                placeholder='{"topic": "AI agents"}'
              />
              <p className="text-xs text-muted-foreground mt-1">
                Variables available to all steps. Can reference previous nodes: {`{{nodeName.field}}`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Steps</label>
              <div className="space-y-3 border border-border rounded-lg p-3 max-h-64 overflow-y-auto">
                {(config.steps || []).map((step: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Step {idx + 1}</span>
                      <button
                        onClick={() => {
                          const newSteps = [...(config.steps || [])];
                          newSteps.splice(idx, 1);
                          updateConfig('steps', newSteps);
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                      placeholder="Step name"
                      value={step.name || ''}
                      onChange={(e) => {
                        const newSteps = [...(config.steps || [])];
                        newSteps[idx] = { ...step, name: e.target.value };
                        updateConfig('steps', newSteps);
                      }}
                    />
                    <textarea
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2 font-mono"
                      rows={2}
                      placeholder="Prompt template with {variables}"
                      value={step.prompt || ''}
                      onChange={(e) => {
                        const newSteps = [...(config.steps || [])];
                        newSteps[idx] = { ...step, prompt: e.target.value };
                        updateConfig('steps', newSteps);
                      }}
                    />
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Input variables (comma-separated)"
                      value={step.inputVariables?.join(', ') || ''}
                      onChange={(e) => {
                        const newSteps = [...(config.steps || [])];
                        newSteps[idx] = {
                          ...step,
                          inputVariables: e.target.value.split(',').map(v => v.trim()).filter(Boolean),
                        };
                        updateConfig('steps', newSteps);
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newSteps = [...(config.steps || []), { name: '', prompt: '', inputVariables: [] }];
                    updateConfig('steps', newSteps);
                  }}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  + Add Step
                </button>
              </div>
            </div>
          </div>
        );

      case 'router_chain':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Routing Prompt</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                rows={4}
                value={config.routingPrompt || ''}
                onChange={(e) => updateConfig('routingPrompt', e.target.value)}
                placeholder="Based on this query: {query}, which destination should we use?"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Prompt that determines which chain to route to. Use {`{variables}`} for input.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Input Variables (JSON)</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                rows={2}
                value={jsonInputs['router_chain_input'] || JSON.stringify(config.input || {}, null, 2)}
                onChange={(e) => {
                  const value = e.target.value;
                  // Update raw string immediately
                  setJsonInputs(prev => ({ ...prev, 'router_chain_input': value }));
                  // Try to parse and update config if valid JSON
                  try {
                    const parsed = JSON.parse(value);
                    updateConfig('input', parsed);
                  } catch {
                    // Invalid JSON, but keep the raw string for user to continue typing
                  }
                }}
                placeholder='{"query": "Write an email"}'
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Destinations</label>
              <div className="space-y-3 border border-border rounded-lg p-3 max-h-64 overflow-y-auto">
                {(config.destinations || []).map((dest: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Destination {idx + 1}</span>
                      <button
                        onClick={() => {
                          const newDests = [...(config.destinations || [])];
                          newDests.splice(idx, 1);
                          updateConfig('destinations', newDests);
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                      placeholder="Destination name (e.g., 'email')"
                      value={dest.name || ''}
                      onChange={(e) => {
                        const newDests = [...(config.destinations || [])];
                        newDests[idx] = { ...dest, name: e.target.value };
                        updateConfig('destinations', newDests);
                      }}
                    />
                    <textarea
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                      rows={1}
                      placeholder="Description (when to route here)"
                      value={dest.description || ''}
                      onChange={(e) => {
                        const newDests = [...(config.destinations || [])];
                        newDests[idx] = { ...dest, description: e.target.value };
                        updateConfig('destinations', newDests);
                      }}
                    />
                    <select
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                      value={dest.chainType || 'llm'}
                      onChange={(e) => {
                        const newDests = [...(config.destinations || [])];
                        newDests[idx] = { ...dest, chainType: e.target.value };
                        updateConfig('destinations', newDests);
                      }}
                    >
                      <option value="llm">LLM Chain</option>
                      <option value="sequential">Sequential Chain</option>
                    </select>
                    <textarea
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                      rows={2}
                      placeholder='Chain config JSON: {"promptTemplate": "...", "variables": {...}}'
                      value={jsonInputs[`router_dest_${idx}_chainConfig`] || JSON.stringify(dest.chainConfig || {}, null, 2)}
                      onChange={(e) => {
                        const value = e.target.value;
                        const key = `router_dest_${idx}_chainConfig`;
                        // Update raw string immediately
                        setJsonInputs(prev => ({ ...prev, [key]: value }));
                        // Try to parse and update config if valid JSON
                        try {
                          const parsed = JSON.parse(value);
                          const newDests = [...(config.destinations || [])];
                          newDests[idx] = { ...dest, chainConfig: parsed };
                          updateConfig('destinations', newDests);
                        } catch {
                          // Invalid JSON, but keep the raw string for user to continue typing
                        }
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newDests = [...(config.destinations || []), { name: '', description: '', chainType: 'llm', chainConfig: {} }];
                    updateConfig('destinations', newDests);
                  }}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  + Add Destination
                </button>
              </div>
            </div>
          </div>
        );

      case 'multi_agent':
        // Get available agents from registry (we'll need to import this)
        const availableAgentIds = [
          'research-agent',
          'writing-agent',
          'code-agent',
          'analysis-agent',
          'creative-agent',
          'generalist-agent',
        ];
        
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Task</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                rows={3}
                value={config.task || ''}
                onChange={(e) => updateConfig('task', e.target.value)}
                placeholder="Enter the task for the agents to complete. Use {{trigger.field}} to reference previous nodes."
              />
              <p className="text-xs text-muted-foreground mt-1">
                The task that will be distributed to agents. Use {`{{nodeName.field}}`} to reference data from previous nodes.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Execution Mode</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={config.mode || 'supervised'}
                onChange={(e) => updateConfig('mode', e.target.value)}
              >
                <option value="supervised">Supervised (Supervisor routes tasks)</option>
                <option value="parallel">Parallel (All agents run simultaneously)</option>
                <option value="sequential">Sequential (Agents run one after another)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Supervised: Supervisor agent analyzes task and routes to appropriate agents.
                Parallel: All selected agents run at the same time.
                Sequential: Agents run one after another, passing results.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Agents</label>
              <div className="space-y-2 border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
                {availableAgentIds.map((agentId) => {
                  const agentNames: Record<string, string> = {
                    'research-agent': 'Research Agent',
                    'writing-agent': 'Writing Agent',
                    'code-agent': 'Code Agent',
                    'analysis-agent': 'Analysis Agent',
                    'creative-agent': 'Creative Agent',
                    'generalist-agent': 'Generalist Agent',
                  };
                  const isSelected = (config.agentIds || []).includes(agentId);
                  return (
                    <label
                      key={agentId}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentIds = config.agentIds || [];
                          const newIds = e.target.checked
                            ? [...currentIds, agentId]
                            : currentIds.filter((id: string) => id !== agentId);
                          updateConfig('agentIds', newIds);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{agentNames[agentId] || agentId}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {config.mode === 'supervised'
                  ? 'Leave empty to let supervisor choose agents automatically.'
                  : 'Select which agents should participate in this execution.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Shared Context (JSON, optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                rows={3}
                value={jsonInputs['multi_agent_sharedContext'] || JSON.stringify(config.sharedContext || {}, null, 2)}
                onChange={(e) => {
                  const value = e.target.value;
                  setJsonInputs(prev => ({ ...prev, 'multi_agent_sharedContext': value }));
                  try {
                    const parsed = JSON.parse(value);
                    updateConfig('sharedContext', parsed);
                  } catch {
                    // Invalid JSON, but keep the raw string for user to continue typing
                  }
                }}
                placeholder='{"key": "value"}'
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Shared data available to all agents. Can reference previous nodes: {`{{nodeName.field}}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Temperature (optional)</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={config.temperature ?? ''}
                  onChange={(e) => updateConfig('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0.7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Model (optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  value={config.model || ''}
                  onChange={(e) => updateConfig('model', e.target.value || undefined)}
                  placeholder="llama-3.3-70b-instruct"
                />
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">No configuration needed for this node type.</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Configure {node.data.label}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {renderConfigForm()}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm border border-border rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
