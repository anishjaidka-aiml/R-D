/**
 * Document Retrievers
 * 
 * Retrieve relevant documents from vector store using similarity search
 */

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { BaseRetriever } from "@langchain/core/retrievers";
import { simpleTextSimilarity } from "../embeddings/simple-embeddings";

/**
 * Create a retriever from vector store
 */
export function createRetriever(
  vectorStore: MemoryVectorStore,
  options?: {
    k?: number; // Number of documents to retrieve
    scoreThreshold?: number; // Minimum similarity score
    filter?: Record<string, any>; // Metadata filter
  }
): BaseRetriever {
  const { k = 4, scoreThreshold, filter } = options || {};

  return vectorStore.asRetriever({
    k,
    scoreThreshold,
    filter,
  });
}

/**
 * Retrieve relevant documents for a query
 */
export async function retrieveDocuments(
  vectorStore: MemoryVectorStore,
  query: string,
  options?: {
    k?: number;
    scoreThreshold?: number;
    filter?: Record<string, any>;
  }
): Promise<Document[]> {
  const { k = 4, scoreThreshold, filter } = options || {};

  // Validate query parameter
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error("Query parameter is required and must be a non-empty string");
  }

  try {
    const retriever = createRetriever(vectorStore, { k, scoreThreshold, filter });
    const documents = await retriever.getRelevantDocuments(query);
    return documents;
  } catch (error: any) {
    console.error("Failed to retrieve documents:", error);
    throw new Error(`Document retrieval failed: ${error.message}`);
  }
}

/**
 * Retrieve documents with similarity scores
 */
export async function retrieveDocumentsWithScores(
  vectorStore: MemoryVectorStore,
  query: string,
  options?: {
    k?: number;
    filter?: Record<string, any>;
  }
): Promise<Array<[Document, number]>> {
  const { k = 4, filter } = options || {};

  // Validate query parameter
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error("Query parameter is required and must be a non-empty string");
  }

  try {
    // Check if vector store has documents
    // MemoryVectorStore doesn't expose a direct count, so we'll try a search first
    console.log(`  🔍 Searching vector store for query: "${query}"`);
    console.log(`  📊 Requesting top ${k} documents`);
    
    // MemoryVectorStore similaritySearchWithScore signature: (query, k, filter?)
    // Filter is optional and may not be fully supported
    const results = filter 
      ? await vectorStore.similaritySearchWithScore(query, k, filter)
      : await vectorStore.similaritySearchWithScore(query, k);
    
    console.log(`  ✅ Found ${results.length} documents with scores`);
    if (results.length === 0) {
      console.warn(`  ⚠️  No documents found via similarity search! Trying fallback...`);
      // Try a broader search to see if store has any documents
      try {
        const allDocs = await vectorStore.similaritySearch("", 10);
        console.log(`  📋 Vector store contains ${allDocs.length} total documents`);
        
        // If store has documents but similarity search failed, use text-based fallback
        if (allDocs.length > 0) {
          console.log(`  🔄 Using text-based similarity fallback...`);
          const textMatched = simpleTextSimilarity(query, allDocs);
          console.log(`  ✅ Text-based matching found ${textMatched.length} documents`);
          
          // Convert to format expected by similaritySearchWithScore: [Document, score][]
          // Use a default score of 0.5 for text matches
          return textMatched.slice(0, k).map(doc => [doc, 0.5] as [Document, number]);
        }
      } catch (e) {
        console.warn(`  ⚠️  Could not check vector store contents: ${e}`);
      }
    }
    
    return results;
  } catch (error: any) {
    console.error("Failed to retrieve documents with scores:", error);
    // Fallback to regular similarity search if withScore fails
    try {
      const docs = await vectorStore.similaritySearch(query, k);
      // Return with dummy scores (1.0) if scores aren't available
      return docs.map(doc => [doc, 1.0] as [Document, number]);
    } catch (fallbackError: any) {
      throw new Error(`Document retrieval failed: ${error.message}`);
    }
  }
}

/**
 * Get top-K most similar documents
 */
export async function getTopKDocuments(
  vectorStore: MemoryVectorStore,
  query: string,
  k: number = 4
): Promise<Document[]> {
  return retrieveDocuments(vectorStore, query, { k });
}

/**
 * Retrieve documents by metadata filter
 */
export async function retrieveDocumentsByFilter(
  vectorStore: MemoryVectorStore,
  query: string,
  filter: Record<string, any>,
  k: number = 4
): Promise<Document[]> {
  return retrieveDocuments(vectorStore, query, { k, filter });
}

