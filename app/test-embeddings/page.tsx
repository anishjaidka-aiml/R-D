'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function TestEmbeddingsPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testEmbeddings = async () => {
    setTesting(true);
    setResults(null);

    try {
      const response = await fetch('/api/test-embeddings');
      const data = await response.json();
      setResults(data);
    } catch (error: any) {
      setResults({
        success: false,
        conclusion: 'Failed to test embeddings',
        error: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">🧪 Test AI.ML Embeddings</h1>
          <p className="text-gray-600 mb-6">
            Test if your AI.ML API keys support embeddings endpoint
          </p>

          <button
            onClick={testEmbeddings}
            disabled={testing}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {testing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Testing Embeddings...
              </>
            ) : (
              'Test Embeddings'
            )}
          </button>

          {results && (
            <div className="mt-8 space-y-4">
              {/* Conclusion */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  results.success
                    ? 'bg-green-50 border-green-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}
              >
                <h2 className="text-xl font-semibold mb-2">
                  {results.conclusion}
                </h2>
                {results.embeddingType && (
                  <p className="text-sm text-gray-600">
                    Embedding Type: <strong>{results.embeddingType}</strong>
                  </p>
                )}
              </div>

              {/* Results */}
              {results.results && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-700">Test Results:</h3>
                  {results.results.map((result: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{result.step}</h4>
                          <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                View Details
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {results.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Error:</p>
                  <p className="text-red-600 text-sm mt-1">{results.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 What This Test Does:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Checks if AIML_API_KEY is configured</li>
              <li>Attempts to create an embedding client</li>
              <li>Tries to generate embeddings using AI.ML API</li>
              <li>Reports if embeddings work or fallback is used</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

