"use client";

/**
 * RAG (Retrieval Augmented Generation) Page
 * 
 * Upload documents and query them using RAG
 */

import { useState } from "react";
import { FileUp, Search, FileText, Loader2, X, CheckCircle2 } from "lucide-react";

interface UploadResult {
  success: boolean;
  message?: string;
  documentsUploaded?: number;
  chunksCreated?: number;
  error?: string;
}

interface QueryResult {
  success: boolean;
  answer?: string;
  sources?: Array<{
    content: string;
    metadata: Record<string, any>;
    score?: number;
  }>;
  error?: string;
}

export default function RAGPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [query, setQuery] = useState("");
  const [querying, setQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [collectionName, setCollectionName] = useState("documents");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select files to upload");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      if (collectionName) {
        formData.append("collectionName", collectionName);
      }

      const response = await fetch("/api/rag/upload", {
        method: "POST",
        body: formData,
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 500));
        throw new Error(`Server returned non-JSON response (${response.status}). Check server console for details.`);
      }

      const result: UploadResult = await response.json();
      setUploadResult(result);

      if (result.success) {
        setFiles([]);
        // Reset file input
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      let errorMessage = "Failed to upload documents";
      
      // Try to parse error response if it's JSON
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setUploadResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      alert("Please enter a query");
      return;
    }

    setQuerying(true);
    setQueryResult(null);

    try {
      const response = await fetch("/api/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          collectionName: collectionName || undefined,
          k: 4,
          includeSources: true,
        }),
      });

      const result: QueryResult = await response.json();
      setQueryResult(result);
    } catch (error: any) {
      setQueryResult({
        success: false,
        error: error.message || "Failed to query documents",
      });
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">📚 RAG - Document Query</h1>
        <p className="text-gray-600 mb-8">
          Upload documents and query them using Retrieval Augmented Generation
        </p>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Upload Documents
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection Name (optional)
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="documents"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files (PDF, TXT, MD)
            </label>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.txt,.md,.text,.markdown"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {files.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Selected files:</p>
              <ul className="list-disc list-inside">
                {files.map((file, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4" />
                Upload Documents
              </>
            )}
          </button>

          {uploadResult && (
            <div
              className={`mt-4 p-4 rounded-md ${
                uploadResult.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-2">
                {uploadResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      uploadResult.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {uploadResult.success ? "Success!" : "Error"}
                  </p>
                  <p
                    className={`text-sm ${
                      uploadResult.success ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {uploadResult.message || uploadResult.error}
                  </p>
                  {uploadResult.success && (
                    <p className="text-sm text-green-700 mt-1">
                      Uploaded {uploadResult.documentsUploaded} document(s), created{" "}
                      {uploadResult.chunksCreated} chunks
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Query Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Query Documents
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your question
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What information are you looking for?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleQuery}
            disabled={querying || !query.trim()}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {querying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Querying...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Query Documents
              </>
            )}
          </button>

          {queryResult && (
            <div className="mt-6">
              <div
                className={`p-4 rounded-md mb-4 ${
                  queryResult.success
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Answer
                </h3>
                {queryResult.success ? (
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {queryResult.answer}
                  </p>
                ) : (
                  <p className="text-red-800">{queryResult.error}</p>
                )}
              </div>

              {queryResult.success && queryResult.sources && queryResult.sources.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Sources</h3>
                  <div className="space-y-2">
                    {queryResult.sources.map((source, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-md border border-gray-200"
                      >
                        <p className="text-sm font-medium text-gray-700">
                          {source.metadata.source || source.metadata.fileName || "Unknown"}
                        </p>
                        {source.score !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            Similarity: {source.score.toFixed(3)}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {source.content}
                        </p>
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
  );
}

