'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Loader, Zap } from 'lucide-react';

export default function TestConnectionPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        message: `Failed to reach API: ${error.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold mb-2">Test AI.ML Connection</h1>
            <p className="text-muted-foreground">
              Verify that LangChain can connect to your AI.ML API
            </p>
          </div>

          {/* Test Card */}
          <div className="bg-white rounded-xl shadow-lg border border-border p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Connection Test</h2>
              <p className="text-sm text-muted-foreground">
                Click the button below to test your AI.ML configuration
              </p>
            </div>

            {/* Test Button */}
            <button
              onClick={testConnection}
              disabled={testing}
              className="w-full py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Test Connection
                </>
              )}
            </button>

            {/* Results */}
            {result && (
              <div className="mt-6">
                <div
                  className={`p-4 rounded-lg border-2 ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3
                        className={`font-semibold mb-1 ${
                          result.success ? 'text-green-900' : 'text-red-900'
                        }`}
                      >
                        {result.success ? 'Connection Successful!' : 'Connection Failed'}
                      </h3>
                      <p
                        className={`text-sm ${
                          result.success ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {result.message}
                      </p>

                      {result.success && result.model && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-sm text-green-800 mb-1">
                            <strong>Model:</strong> {result.model}
                          </p>
                          {result.response && (
                            <div className="mt-2 p-3 bg-white rounded border border-green-200">
                              <p className="text-sm text-gray-700">
                                <strong>AI Response:</strong>
                              </p>
                              <p className="text-sm text-gray-600 mt-1 italic">
                                &quot;{result.response}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {result.success && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/workflows"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      Continue to Workflows →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configuration Info */}
          <div className="mt-8 p-6 bg-white rounded-lg border border-border">
            <h3 className="font-semibold mb-3">Configuration Required</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Make sure you have created a <code className="px-2 py-1 bg-gray-100 rounded text-xs">.env.local</code> file with:
            </p>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
{`AIML_API_KEY=your_aiml_api_key_here
AIML_BASE_URL=https://api.aimlapi.com/v1
AIML_MODEL=gpt-4o`}
            </pre>
            <p className="text-xs text-muted-foreground mt-3">
              💡 Copy <code className="px-1 bg-gray-100 rounded">.env.local.example</code> to <code className="px-1 bg-gray-100 rounded">.env.local</code> and add your credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

