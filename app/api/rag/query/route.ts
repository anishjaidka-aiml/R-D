/**
 * RAG Query API
 * 
 * POST /api/rag/query
 * Query documents using RAG
 */

import { NextRequest, NextResponse } from "next/server";
import { queryRAG } from "@/lib/langchain/chains/rag-chain";
import { getVectorStore } from "@/lib/langchain/vector-store/setup";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, collectionName, k, includeSources, systemPrompt } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 RAG Query: "${query}"`);

    // Get vector store
    const vectorStore = await getVectorStore(collectionName || undefined);

    // Execute RAG query
    const result = await queryRAG(query, vectorStore, {
      k: k || 4,
      includeSources: includeSources !== false,
      systemPrompt,
    });

    return NextResponse.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      retrievedDocuments: result.retrievedDocuments?.length || 0,
    });
  } catch (error: any) {
    console.error("❌ RAG query failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to query documents",
        answer: "I couldn't retrieve information from the documents. Make sure documents are uploaded.",
      },
      { status: 500 }
    );
  }
}

