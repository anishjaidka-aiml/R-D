'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Loader, Zap, Brain, Clock, Wrench } from 'lucide-react';
import { TOOL_METADATA } from '@/lib/langchain/tools/tool-metadata';

export default function TestAgentPage() {
  const [prompt, setPrompt] = useState('What is 45 * 123? Calculate this for me.');
  const [selectedTools, setSelectedTools] = useState<string[]>(['calculator']);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const availableTools = Object.keys(TOOL_METADATA);

  const toggleTool = (toolName: string) => {
    setSelectedTools(prev =>
      prev.includes(toolName)
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName]
    );
  };

  const executeAgent = async () => {
    setExecuting(true);
    setResult(null);

    try {
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          config: {
            tools: selectedTools,
            temperature: 0.7,
          },
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: `Failed to reach API: ${error.message}`,
        output: '',
        executionTime: 0,
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold mb-2">Test AI Agent</h1>
            <p className="text-muted-foreground">
              Test your LangChain agent with tools - see how it reasons and uses tools to complete tasks
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* Tools Selection */}
              <div className="bg-white rounded-xl shadow-lg border border-border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  Available Tools
                </h3>
                <div className="space-y-2">
                  {availableTools.map((toolName) => {
                    const meta = TOOL_METADATA[toolName as keyof typeof TOOL_METADATA];
                    return (
                      <label
                        key={toolName}
                        className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-purple-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTools.includes(toolName)}
                          onChange={() => toggleTool(toolName)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{meta.icon}</span>
                            <span className="font-medium text-sm">{meta.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {meta.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Example Prompts */}
              <div className="bg-white rounded-xl shadow-lg border border-border p-6">
                <h3 className="font-semibold mb-3 text-sm">Example Prompts:</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setPrompt('What is 25 * 45? Calculate it.')}
                    className="text-xs text-left w-full p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    🔢 Calculate 25 * 45
                  </button>
                  <button
                    onClick={() => setPrompt('Search the web for "latest AI news" and summarize what you find.')}
                    className="text-xs text-left w-full p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    🔍 Search latest AI news
                  </button>
                  <button
                    onClick={() => setPrompt('Make a GET request to https://api.github.com/users/github and tell me about the user.')}
                    className="text-xs text-left w-full p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    🌐 Fetch GitHub API
                  </button>
                </div>
              </div>
            </div>

            {/* Main Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Prompt Input */}
              <div className="bg-white rounded-xl shadow-lg border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Agent Prompt</h3>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Enter your prompt here..."
                />
                <button
                  onClick={executeAgent}
                  disabled={executing || !prompt || selectedTools.length === 0}
                  className="w-full mt-4 py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {executing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Agent is thinking...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Execute Agent
                    </>
                  )}
                </button>
              </div>

              {/* Results */}
              {result && (
                <div className="bg-white rounded-xl shadow-lg border border-border p-6">
                  <div className="flex items-start gap-3 mb-4">
                    {result.success ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                        {result.success ? 'Success!' : 'Failed'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {result.executionTime}ms
                        </span>
                        {result.toolCalls && (
                          <span>
                            {result.toolCalls.length} tool call(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Output */}
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Agent Response:</h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {result.output || result.error}
                      </p>
                    </div>
                  </div>

                  {/* Reasoning Steps */}
                  {result.reasoning && result.reasoning.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">Agent Reasoning:</h4>
                      <div className="space-y-2">
                        {result.reasoning.map((step: string, index: number) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-900">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool Calls */}
                  {result.toolCalls && result.toolCalls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">Tool Calls:</h4>
                      <div className="space-y-2">
                        {result.toolCalls.map((call: any, index: number) => (
                          <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-purple-900">
                                {call.toolName}
                              </span>
                            </div>
                            <pre className="text-xs text-purple-700 overflow-x-auto">
                              {JSON.stringify(call.parameters, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

