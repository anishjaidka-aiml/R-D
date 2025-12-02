'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bug, Play } from 'lucide-react';

export default function DebugAgentPage() {
  const [results, setResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const runTest = async (testType: string, testName: string) => {
    setTesting(true);
    setCurrentTest(testName);
    setResults(null);

    try {
      const response = await fetch('/api/debug-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error: any) {
      setResults({
        success: false,
        error: error.message,
      });
    } finally {
      setTesting(false);
      setCurrentTest('');
    }
  };

  const tests = [
    {
      id: 'direct-llm',
      name: 'Direct LLM Call',
      description: 'Test basic LLM without tools (should always work)',
    },
    {
      id: 'check-capabilities',
      name: 'Check Function Calling Support',
      description: 'Check if AI.ML supports OpenAI function calling format',
    },
    {
      id: 'tool-binding',
      name: 'LLM with Tool Binding',
      description: 'Test if model can receive tool definitions',
    },
    {
      id: 'full-agent',
      name: 'Full LangChain Agent',
      description: 'Test complete agent with tools',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Bug className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Debug Agent Tool Calling</h1>
          </div>
          <p className="text-muted-foreground">
            Run diagnostic tests to debug tool calling with AI.ML
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Test Buttons */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg mb-4">Run Diagnostic Tests</h2>
            {tests.map((test) => (
              <button
                key={test.id}
                onClick={() => runTest(test.id, test.name)}
                disabled={testing}
                className="w-full p-4 bg-white border border-border rounded-lg hover:shadow-lg transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{test.name}</h3>
                  {testing && currentTest === test.name ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  ) : (
                    <Play className="w-5 h-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{test.description}</p>
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="bg-white border border-border rounded-lg p-6">
            <h2 className="font-semibold text-lg mb-4">Test Results</h2>
            
            {!results ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bug className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Run a test to see results</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="font-semibold text-sm mb-1">
                    {results.success ? '✅ Test Passed' : '❌ Test Failed'}
                  </div>
                </div>

                {/* Show all result data */}
                <div className="space-y-3">
                  {Object.entries(results).map(([key, value]) => (
                    <div key={key} className="border-b border-border pb-2">
                      <div className="text-xs font-semibold text-gray-600 mb-1">{key}:</div>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-3">How to Use</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Run tests in order from top to bottom</li>
            <li>2. Check which tests pass/fail</li>
            <li>3. Look at the raw responses to understand the format</li>
            <li>4. This helps us fix the tool calling integration</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

