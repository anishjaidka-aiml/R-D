/**
 * Text Splitters
 * 
 * Split documents into chunks for embedding and retrieval
 */

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CharacterTextSplitter } from "langchain/text_splitter";

/**
 * Split document using recursive character splitter (recommended)
 */
export async function splitDocumentRecursive(
  document: Document,
  options?: {
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
  }
): Promise<Document[]> {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separators = ["\n\n", "\n", " ", ""],
  } = options || {};

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators,
  });

  try {
    const chunks = await splitter.splitDocuments([document]);
    
    // Preserve metadata in each chunk
    return chunks.map((chunk) => ({
      ...chunk,
      metadata: {
        ...document.metadata,
        ...chunk.metadata,
        chunkIndex: chunks.indexOf(chunk),
        totalChunks: chunks.length,
      },
    }));
  } catch (error: any) {
    throw new Error(`Failed to split document: ${error.message}`);
  }
}

/**
 * Split document using character-based splitter
 */
export async function splitDocumentCharacter(
  document: Document,
  options?: {
    chunkSize?: number;
    chunkOverlap?: number;
    separator?: string;
  }
): Promise<Document[]> {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separator = "\n\n",
  } = options || {};

  const splitter = new CharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separator,
  });

  try {
    const chunks = await splitter.splitDocuments([document]);
    
    // Preserve metadata in each chunk
    return chunks.map((chunk) => ({
      ...chunk,
      metadata: {
        ...document.metadata,
        ...chunk.metadata,
        chunkIndex: chunks.indexOf(chunk),
        totalChunks: chunks.length,
      },
    }));
  } catch (error: any) {
    throw new Error(`Failed to split document: ${error.message}`);
  }
}

/**
 * Split multiple documents
 */
export async function splitDocuments(
  documents: Document[],
  options?: {
    method?: "recursive" | "character";
    chunkSize?: number;
    chunkOverlap?: number;
  }
): Promise<Document[]> {
  const { method = "recursive", ...splitOptions } = options || {};
  
  const allChunks: Document[] = [];

  for (const document of documents) {
    try {
      const chunks =
        method === "recursive"
          ? await splitDocumentRecursive(document, splitOptions)
          : await splitDocumentCharacter(document, splitOptions);
      
      allChunks.push(...chunks);
    } catch (error: any) {
      console.error(`Failed to split document ${document.metadata.source}:`, error.message);
      // Continue with other documents
    }
  }

  return allChunks;
}

/**
 * Default text splitter configuration
 */
export const DEFAULT_SPLITTER_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 200,
  method: "recursive" as const,
};

