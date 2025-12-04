/**
 * RAG Chain
 * 
 * Retrieval Augmented Generation chain that combines document retrieval with LLM generation
 */

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { createAIMLClient } from "../client";
import { retrieveDocuments, retrieveDocumentsWithScores } from "../retrievers/document-retriever";
import { PromptTemplate } from "@langchain/core/prompts";

export interface RAGChainConfig {
  vectorStore: MemoryVectorStore;
  k?: number; // Number of documents to retrieve
  scoreThreshold?: number; // Minimum similarity score
  systemPrompt?: string;
  temperature?: number;
  modelName?: string;
  includeSources?: boolean; // Include source citations in response
}

export interface RAGResult {
  answer: string;
  sources?: Array<{
    content: string;
    metadata: Record<string, any>;
    score?: number;
  }>;
  retrievedDocuments?: Document[];
}

/**
 * Execute RAG chain: retrieve relevant context and generate answer
 */
export async function executeRAGChain(
  query: string,
  config: RAGChainConfig
): Promise<RAGResult> {
  const {
    vectorStore,
    k = 4,
    scoreThreshold,
    systemPrompt,
    temperature = 0.7,
    modelName,
    includeSources = true,
  } = config;

  try {
    // Step 1: Retrieve relevant documents
    console.log(`🔍 Retrieving documents for query: "${query}"`);
    const documentsWithScores = await retrieveDocumentsWithScores(vectorStore, query, {
      k,
      filter: scoreThreshold ? undefined : undefined, // Filter by score if threshold provided
    });

    // Filter by score threshold if provided
    const filteredDocuments = scoreThreshold
      ? documentsWithScores.filter(([_, score]) => score >= scoreThreshold)
      : documentsWithScores;

    if (filteredDocuments.length === 0) {
      // Check if vector store is empty by trying a very broad search
      let isEmpty = false;
      try {
        const testDocs = await vectorStore.similaritySearch("", 1);
        isEmpty = testDocs.length === 0;
        if (isEmpty) {
          console.warn(`⚠️  Vector store appears to be empty (no documents found)`);
        } else {
          console.warn(`⚠️  No documents matched query "${query}" but store has ${testDocs.length} document(s)`);
        }
      } catch (e) {
        console.warn(`⚠️  Could not verify vector store contents`);
      }
      
      return {
        answer: isEmpty 
          ? "There are no documents uploaded to the vector store. Please upload documents first using the RAG upload page."
          : `I couldn't find any relevant information in the uploaded documents to answer your question about "${query}". Try rephrasing your question or uploading more relevant documents.`,
        sources: [],
        retrievedDocuments: [],
      };
    }

    const documents = filteredDocuments.map(([doc]) => doc);
    const scores = filteredDocuments.map(([_, score]) => score);

    console.log(`✅ Retrieved ${documents.length} relevant documents`);

    // Step 2: Build context from retrieved documents
    const context = documents
      .map((doc, index) => {
        const source = doc.metadata.source || "Unknown";
        return `[Source ${index + 1}: ${source}]\n${doc.pageContent}`;
      })
      .join("\n\n---\n\n");

    // Step 3: Create prompt with context
    const defaultSystemPrompt = `You are a helpful assistant that answers questions based on the provided context.
Use only the information from the context to answer the question.
If the context doesn't contain enough information to answer the question, say so.
Cite your sources when providing information.`;

    const promptTemplate = PromptTemplate.fromTemplate(`
${systemPrompt || defaultSystemPrompt}

Context:
{context}

Question: {question}

Answer:`);

    const formattedPrompt = await promptTemplate.format({
      context,
      question: query,
    });

    // Step 4: Generate answer using LLM
    console.log(`🤖 Generating answer...`);
    const llm = createAIMLClient({ temperature, modelName });
    const response = await llm.invoke(formattedPrompt);
    const answer = String(response.content);

    // Step 5: Prepare sources
    const sources = includeSources
      ? documents.map((doc, index) => ({
          content: doc.pageContent.substring(0, 200) + "...", // Preview
          metadata: doc.metadata,
          score: scores[index],
        }))
      : undefined;

    console.log(`✅ Generated answer (${answer.length} characters)`);

    return {
      answer,
      sources,
      retrievedDocuments: documents,
    };
  } catch (error: any) {
    console.error("RAG chain execution failed:", error);
    throw new Error(`RAG chain failed: ${error.message}`);
  }
}

/**
 * Simple RAG query (convenience function)
 */
export async function queryRAG(
  query: string,
  vectorStore: MemoryVectorStore,
  options?: {
    k?: number;
    scoreThreshold?: number;
    systemPrompt?: string;
    includeSources?: boolean;
  }
): Promise<RAGResult> {
  return executeRAGChain(query, {
    vectorStore,
    ...options,
  });
}

