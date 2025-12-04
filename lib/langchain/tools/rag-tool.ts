/**
 * RAG Tool
 * 
 * Tool for agents to query documents using RAG
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { queryRAG } from "../chains/rag-chain";
import { getVectorStore } from "../vector-store/setup";

/**
 * RAG Tool for querying documents
 */
export const ragTool = new DynamicStructuredTool({
  name: "query_documents",
  description: `Query documents using RAG (Retrieval Augmented Generation). 
Use this tool to search through uploaded documents and get answers based on their content.
The tool will find relevant information from the documents and provide an answer with sources.

IMPORTANT: You MUST provide a "query" parameter with the question you want to ask about the documents.
Example: {"query": "What is this document about?"}
DO NOT use "document_id" - just provide your question as the "query" parameter.`,
  schema: z.object({
    query: z
      .string()
      .describe("REQUIRED: The question or query to search for in the documents. This is the question you want to ask about the uploaded documents. Example: 'What is this document about?' or 'What information is available about AI agents?'"),
    collectionName: z
      .string()
      .optional()
      .describe("Optional: Name of the document collection to search (default: 'documents')"),
    k: z
      .number()
      .optional()
      .default(4)
      .describe("Number of documents to retrieve (default: 4)"),
    includeSources: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to include source citations in the response"),
  }),
  func: async ({ query, collectionName, k, includeSources }) => {
    try {
      // Validate query parameter
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return JSON.stringify({
          success: false,
          error: "Query parameter is required",
          message: "You must provide a 'query' parameter with your question. Example: {'query': 'What is this document about?'}",
        });
      }

      console.log(`📚 RAG Tool Called:`);
      console.log(`  Query: ${query}`);
      console.log(`  Collection: ${collectionName || "documents"}`);
      console.log(`  K: ${k}`);

      // Get vector store
      const collection = collectionName || "documents";
      console.log(`📚 Getting vector store for collection: "${collection}"`);
      const vectorStore = await getVectorStore(collectionName);
      
      // Check if vector store has documents
      try {
        const testDocs = await vectorStore.similaritySearch("", 10);
        console.log(`  ✅ Vector store has ${testDocs.length} document(s) (test search)`);
        if (testDocs.length === 0) {
          console.error(`  ❌ ERROR: Vector store is EMPTY! Documents may have been lost.`);
          return JSON.stringify({
            success: false,
            error: "Vector store is empty",
            message: "There are no documents uploaded to the vector store. Please upload documents first using the RAG upload page.",
          });
        }
      } catch (testError: any) {
        console.warn(`  ⚠️  Could not verify vector store contents: ${testError.message}`);
      }

      // Query RAG
      const result = await queryRAG(query, vectorStore, {
        k,
        includeSources,
      });

      // Format response
      let response = result.answer;

      if (includeSources && result.sources && result.sources.length > 0) {
        response += "\n\nSources:\n";
        result.sources.forEach((source, index) => {
          const sourceName = source.metadata.source || source.metadata.fileName || "Unknown";
          response += `${index + 1}. ${sourceName}`;
          if (source.score !== undefined) {
            response += ` (similarity: ${source.score.toFixed(3)})`;
          }
          response += "\n";
        });
      }

      console.log(`✅ RAG query completed`);
      return response;
    } catch (error: any) {
      console.error("❌ RAG tool error:", error);
      return JSON.stringify({
        success: false,
        error: error.message,
        message: `Failed to query documents: ${error.message}. Make sure documents are uploaded and the vector store is initialized.`,
      });
    }
  },
});

