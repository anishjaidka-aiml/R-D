/**
 * Document Loaders
 * 
 * Load documents from various sources (PDF, text, markdown, URL)
 */

import { Document } from "@langchain/core/documents";
import * as fs from "fs/promises";
import * as path from "path";
import * as cheerio from "cheerio";

// Lazy load pdf-parse to avoid initialization issues
let pdfParse: any = null;
async function getPdfParser() {
  if (!pdfParse) {
    try {
      pdfParse = (await import("pdf-parse")).default;
    } catch (error) {
      console.warn("pdf-parse not available:", error);
      throw new Error("PDF parsing is not available. Please install pdf-parse: npm install pdf-parse");
    }
  }
  return pdfParse;
}

/**
 * Load document from file path
 */
export async function loadDocumentFromFile(filePath: string): Promise<Document> {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);

    let content: string;

    switch (fileExtension) {
      case ".pdf":
        content = await loadPDF(filePath);
        break;
      case ".txt":
      case ".text":
        content = await loadText(filePath);
        break;
      case ".md":
      case ".markdown":
        content = await loadMarkdown(filePath);
        break;
      default:
        // Try as text file
        content = await loadText(filePath);
    }

    return new Document({
      pageContent: content,
      metadata: {
        source: filePath,
        fileName,
        fileType: fileExtension,
        loadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to load document from ${filePath}: ${error.message}`);
  }
}

/**
 * Load PDF file
 */
async function loadPDF(filePath: string): Promise<string> {
  try {
    const pdf = await getPdfParser();
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error: any) {
    throw new Error(`Failed to load PDF: ${error.message}`);
  }
}

/**
 * Load text file
 */
async function loadText(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error: any) {
    throw new Error(`Failed to load text file: ${error.message}`);
  }
}

/**
 * Load markdown file
 */
async function loadMarkdown(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error: any) {
    throw new Error(`Failed to load markdown file: ${error.message}`);
  }
}

/**
 * Load document from URL
 */
export async function loadDocumentFromURL(url: string): Promise<Document> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    let content: string;

    if (contentType.includes("text/html")) {
      // HTML content
      const html = await response.text();
      const $ = cheerio.load(html);
      // Remove script and style elements
      $("script, style").remove();
      content = $("body").text() || $.text();
    } else {
      // Plain text
      content = await response.text();
    }

    return new Document({
      pageContent: content,
      metadata: {
        source: url,
        url,
        contentType,
        loadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to load document from URL ${url}: ${error.message}`);
  }
}

/**
 * Load multiple documents from file paths
 */
export async function loadDocumentsFromFiles(filePaths: string[]): Promise<Document[]> {
  const documents: Document[] = [];

  for (const filePath of filePaths) {
    try {
      const doc = await loadDocumentFromFile(filePath);
      documents.push(doc);
    } catch (error: any) {
      console.error(`Failed to load ${filePath}:`, error.message);
      // Continue loading other files
    }
  }

  return documents;
}

/**
 * Load document from buffer (for uploaded files)
 */
export async function loadDocumentFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<Document> {
  try {
    const fileExtension = path.extname(fileName).toLowerCase();
    let content: string;

    if (fileExtension === ".pdf" || mimeType === "application/pdf") {
      try {
        const pdf = await getPdfParser();
        const data = await pdf(buffer);
        content = data.text;
      } catch (error: any) {
        throw new Error(`PDF parsing failed: ${error.message}. PDF support requires pdf-parse package.`);
      }
    } else {
      // Assume text file
      content = buffer.toString("utf-8");
    }

    return new Document({
      pageContent: content,
      metadata: {
        source: fileName,
        fileName,
        fileType: fileExtension,
        mimeType,
        loadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to load document from buffer: ${error.message}`);
  }
}

