/**
 * RAG Status API
 * 
 * GET /api/rag/status
 * Check vector store status and document count
 */

import { NextResponse } from "next/server";
import { getVectorStore } from "@/lib/langchain/vector-store/setup";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const vectorStore = await getVectorStore();
    
    // Try to get documents by doing a broad search
    let documentCount = 0;
    let sampleDocuments: any[] = [];
    
    try {
      // Try to get all documents with a very broad query
      const allDocs = await vectorStore.similaritySearch("", 100);
      documentCount = allDocs.length;
      sampleDocuments = allDocs.slice(0, 5).map(doc => ({
        content: doc.pageContent.substring(0, 100) + "...",
        metadata: doc.metadata,
      }));
    } catch (error: any) {
      console.error("Error checking vector store:", error);
    }
    
    return NextResponse.json({
      success: true,
      hasVectorStore: !!vectorStore,
      documentCount,
      sampleDocuments,
      message: documentCount > 0 
        ? `Vector store contains ${documentCount} document(s)`
        : "Vector store is empty. Please upload documents first.",
    });
  } catch (error: any) {
    console.error("❌ RAG status check failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        hasVectorStore: false,
        documentCount: 0,
      },
      { status: 500 }
    );
  }
}


