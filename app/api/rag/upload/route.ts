/**
 * RAG Document Upload API
 * 
 * POST /api/rag/upload
 * Upload documents and add them to the vector store
 */

import { NextRequest, NextResponse } from "next/server";

// Lazy load imports to avoid blocking route registration
let loadDocumentFromBuffer: any;
let splitDocuments: any;
let createVectorStore: any;
let addDocumentsToVectorStore: any;
let getVectorStore: any;

async function loadImports() {
  if (!loadDocumentFromBuffer) {
    const loaderModule = await import("@/lib/langchain/loaders/document-loader");
    const splitterModule = await import("@/lib/langchain/splitters/text-splitter");
    const vectorStoreModule = await import("@/lib/langchain/vector-store/setup");
    
    loadDocumentFromBuffer = loaderModule.loadDocumentFromBuffer;
    splitDocuments = splitterModule.splitDocuments;
    createVectorStore = vectorStoreModule.createVectorStore;
    addDocumentsToVectorStore = vectorStoreModule.addDocumentsToVectorStore;
    getVectorStore = vectorStoreModule.getVectorStore;
  }
}

export async function POST(request: NextRequest) {
  // Load imports lazily
  await loadImports();
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const collectionName = formData.get("collectionName") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    console.log(`📤 Uploading ${files.length} file(s)...`);

    // Load documents from uploaded files
    const documents = [];
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const doc = await loadDocumentFromBuffer(buffer, file.name, file.type);
        documents.push(doc);
        console.log(`✅ Loaded: ${file.name}`);
      } catch (error: any) {
        console.error(`❌ Failed to load ${file.name}:`, error.message);
        // Continue with other files
      }
    }

    if (documents.length === 0) {
      return NextResponse.json(
        { error: "Failed to load any documents" },
        { status: 400 }
      );
    }

    // Split documents into chunks
    console.log(`✂️ Splitting documents into chunks...`);
    const chunks = await splitDocuments(documents, {
      method: "recursive",
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    console.log(`✅ Created ${chunks.length} chunks from ${documents.length} documents`);

    // Get or create vector store and add documents
    let vectorStore;
    try {
      vectorStore = await getVectorStore(collectionName || undefined);
      // Add documents to existing store
      vectorStore = await addDocumentsToVectorStore(vectorStore, chunks, collectionName || undefined);
    } catch (error) {
      // Create new vector store
      vectorStore = await createVectorStore(chunks, collectionName || undefined);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${documents.length} document(s)`,
      documentsUploaded: documents.length,
      chunksCreated: chunks.length,
      collectionName: collectionName || "documents",
    });
  } catch (error: any) {
    console.error("❌ Document upload failed:", error);
    console.error("Error stack:", error.stack);
    
    // Ensure we always return JSON, not HTML
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload documents",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

