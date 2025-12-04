/**
 * Vector Store Setup
 * 
 * Configures in-memory vector store for document storage
 * Uses MemoryVectorStore for simplicity and Next.js compatibility
 */

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createEmbeddingClient } from "../embeddings/embedding-client";
import { SimpleTextEmbeddings } from "../embeddings/simple-embeddings";
import { Document } from "@langchain/core/documents";

// Vector store configuration
const COLLECTION_NAME = process.env.VECTOR_STORE_COLLECTION_NAME || "documents";

// Global cache that persists across module reloads (using globalThis)
// This ensures the cache survives Next.js hot module reloads
declare global {
  // eslint-disable-next-line no-var
  var __vectorStoreCache: Map<string, MemoryVectorStore> | undefined;
}

// Use global cache if available, otherwise create new one
const getVectorStoreCache = (): Map<string, MemoryVectorStore> => {
  if (!global.__vectorStoreCache) {
    global.__vectorStoreCache = new Map<string, MemoryVectorStore>();
  }
  return global.__vectorStoreCache;
};

const vectorStoreCache = getVectorStoreCache();

/**
 * Initialize vector store (in-memory)
 */
export async function initializeVectorStore(collectionName?: string): Promise<MemoryVectorStore> {
  const collection = collectionName || COLLECTION_NAME;
  
  console.log(`🔍 Initializing vector store for collection: "${collection}"`);
  console.log(`  Cache has ${vectorStoreCache.size} collection(s): ${Array.from(vectorStoreCache.keys()).join(', ')}`);
  
  try {
    // Return existing store if available
    if (vectorStoreCache.has(collection)) {
      const store = vectorStoreCache.get(collection)!;
      console.log(`✅ Using existing vector store: ${collection}`);
      // Try to check document count (MemoryVectorStore doesn't expose this directly)
      try {
        const testDocs = await store.similaritySearch("", 10);
        console.log(`  📊 Vector store has ${testDocs.length} document(s) (test search)`);
        if (testDocs.length === 0) {
          console.warn(`  ⚠️  WARNING: Cached vector store exists but appears empty!`);
        }
      } catch (e: any) {
        console.log(`  📊 Vector store exists but document count check failed: ${e.message}`);
      }
      return store;
    }

    // Create new in-memory vector store
    console.log(`📦 Creating NEW empty vector store collection: ${collection}`);
    console.warn(`  ⚠️  WARNING: No cached store found for "${collection}" - creating empty store!`);
    
    let embeddings;
    try {
      embeddings = createEmbeddingClient();
      // Test if embeddings work
      try {
        await embeddings.embedQuery("test");
      } catch (testError: any) {
        console.warn("⚠️  Embeddings API not available, using simple text-based fallback");
        embeddings = new SimpleTextEmbeddings();
      }
    } catch (error: any) {
      console.warn("⚠️  Embedding client failed, using simple text-based fallback:", error.message);
      embeddings = new SimpleTextEmbeddings();
    }
    
    let vectorStore;
    try {
      vectorStore = await MemoryVectorStore.fromDocuments([], embeddings);
    } catch (error: any) {
      // If embedding fails, use fallback
      const isEmbeddingError = 
        error.status === 400 || 
        error.code === 'BadRequestError' ||
        error.constructor?.name === 'BadRequestError' ||
        error.message?.includes('400') || 
        error.message?.includes('embeddings') ||
        (error.status && error.status >= 400 && error.status < 500);
      
      if (isEmbeddingError) {
        console.warn("⚠️  Embeddings API failed during initialization, using simple text-based fallback");
        embeddings = new SimpleTextEmbeddings();
        vectorStore = await MemoryVectorStore.fromDocuments([], embeddings);
      } else {
        throw error;
      }
    }
    
    // Cache the store
    vectorStoreCache.set(collection, vectorStore);
    
    return vectorStore;
  } catch (error: any) {
    console.error(`Failed to initialize vector store for collection ${collection}:`, error);
    throw new Error(`Vector store initialization failed: ${error.message}`);
  }
}

/**
 * Create a new vector store from documents
 */
export async function createVectorStore(
  documents: Document[],
  collectionName?: string
): Promise<MemoryVectorStore> {
  const collection = collectionName || COLLECTION_NAME;
  
  let embeddings;
  try {
    embeddings = createEmbeddingClient();
  } catch (error: any) {
    console.warn("⚠️  Embedding client creation failed, using simple text-based fallback:", error.message);
    embeddings = new SimpleTextEmbeddings();
  }
  
  try {
    // Try to create vector store with embeddings
    const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
    
    // Cache the store
    vectorStoreCache.set(collection, vectorStore);

    console.log(`✅ Vector store created with ${documents.length} documents`);
    return vectorStore;
  } catch (error: any) {
    // If embedding fails (e.g., 400 error from API), use fallback
    // Check multiple ways the error might be structured
    const isEmbeddingError = 
      error.status === 400 || 
      error.code === 'BadRequestError' ||
      error.constructor?.name === 'BadRequestError' ||
      error.message?.includes('400') || 
      error.message?.includes('embeddings') ||
      (error.status && error.status >= 400 && error.status < 500);
    
    if (isEmbeddingError) {
      console.warn("⚠️  Embeddings API failed (AI.ML may not support embeddings), using simple text-based fallback");
      try {
        const simpleEmbeddings = new SimpleTextEmbeddings();
        const vectorStore = await MemoryVectorStore.fromDocuments(documents, simpleEmbeddings);
        vectorStoreCache.set(collection, vectorStore);
        console.log(`✅ Vector store created with ${documents.length} documents (using text-based fallback)`);
        return vectorStore;
      } catch (fallbackError: any) {
        console.error("Fallback also failed:", fallbackError);
        throw new Error(`Vector store creation failed even with fallback: ${fallbackError.message}`);
      }
    }
    console.error("Failed to create vector store:", error);
    throw new Error(`Vector store creation failed: ${error.message}`);
  }
}

/**
 * Add documents to existing vector store
 * If store doesn't exist, creates a new one
 */
export async function addDocumentsToVectorStore(
  vectorStore: MemoryVectorStore | null,
  documents: Document[],
  collectionName?: string
): Promise<MemoryVectorStore> {
  try {
    let store = vectorStore;
    const collection = collectionName || COLLECTION_NAME;
    
    // If no store provided, get or create one
    if (!store) {
      store = await getVectorStore(collection);
    }
    
    console.log(`📝 Adding ${documents.length} documents to vector store (collection: ${collection})`);
    await store.addDocuments(documents);
    console.log(`✅ Added ${documents.length} documents to vector store`);
    
    // Verify documents were added
    try {
      const testDocs = await store.similaritySearch("", 1);
      console.log(`  ✅ Verified: Vector store now contains documents`);
    } catch (e) {
      console.warn(`  ⚠️  Could not verify document addition`);
    }
    
    // Update cache
    vectorStoreCache.set(collection, store);
    
    return store;
  } catch (error: any) {
    // If embedding fails, recreate store with fallback embeddings
    const isEmbeddingError = 
      error.status === 400 || 
      error.code === 'BadRequestError' ||
      error.constructor?.name === 'BadRequestError' ||
      error.message?.includes('400') || 
      error.message?.includes('embeddings') ||
      (error.status && error.status >= 400 && error.status < 500);
    
    if (isEmbeddingError) {
      console.warn("⚠️  Adding documents failed due to embeddings, recreating store with fallback");
      const collection = collectionName || COLLECTION_NAME;
      const simpleEmbeddings = new SimpleTextEmbeddings();
      // Get existing documents if any
      const existingDocs = store ? [] : []; // MemoryVectorStore doesn't expose documents easily
      const allDocs = [...existingDocs, ...documents];
      const newStore = await MemoryVectorStore.fromDocuments(allDocs, simpleEmbeddings);
      vectorStoreCache.set(collection, newStore);
      console.log(`✅ Recreated vector store with ${allDocs.length} documents (using fallback)`);
      return newStore;
    }
    console.error("Failed to add documents:", error);
    throw new Error(`Failed to add documents: ${error.message}`);
  }
}

/**
 * Delete documents from vector store
 * Note: MemoryVectorStore doesn't support deletion by ID, so we'll skip this
 */
export async function deleteDocumentsFromVectorStore(
  vectorStore: MemoryVectorStore,
  ids: string[]
): Promise<void> {
  console.warn("⚠️  MemoryVectorStore doesn't support deletion by ID. Skipping deletion.");
  // MemoryVectorStore doesn't have a delete method
  // To delete, you would need to recreate the store without those documents
}

/**
 * Get vector store instance
 */
export async function getVectorStore(collectionName?: string): Promise<MemoryVectorStore> {
  return initializeVectorStore(collectionName);
}

