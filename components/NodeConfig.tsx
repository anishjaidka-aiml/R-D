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

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || {});
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
