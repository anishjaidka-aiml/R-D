/**
 * Simple Text-Based Embeddings (Fallback)
 * 
 * Uses simple text matching when real embeddings aren't available
 * This is a fallback for when AI.ML doesn't support embeddings
 */

import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { Document } from "@langchain/core/documents";

/**
 * Simple text-based "embeddings" using TF-IDF-like approach
 * This is a fallback when real embeddings aren't available
 * 
 * Implements EmbeddingsInterface directly to avoid Next.js bundling issues
 */
export class SimpleTextEmbeddings implements EmbeddingsInterface {
  /**
   * Create a simple text representation (not a real embedding)
   * Returns a normalized text vector for basic similarity
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map(text => this.textToVector(text));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.textToVector(text);
  }

  /**
   * Convert text to a simple vector representation
   * Uses word frequency and basic text features
   */
  private textToVector(text: string): number[] {
    // Simple text normalization
    const normalized = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Create a simple hash-based vector (not a real embedding)
    // This is just for basic similarity matching
    const words = normalized.split(' ');
    const vector: number[] = [];
    
    // Use word frequencies and text length as features
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 2) { // Ignore very short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Create a simple vector from word frequencies
    const uniqueWords = Object.keys(wordFreq).slice(0, 100); // Limit to 100 features
    for (let i = 0; i < 100; i++) {
      if (i < uniqueWords.length) {
        vector.push(wordFreq[uniqueWords[i]] / words.length); // Normalized frequency
      } else {
        vector.push(0);
      }
    }

    // Add text length feature
    vector.push(Math.min(text.length / 1000, 1)); // Normalized length

    return vector;
  }
}

/**
 * Simple similarity search using text matching
 */
export function simpleTextSimilarity(query: string, documents: Document[]): Document[] {
  const queryLower = query.toLowerCase();
  const queryWords = new Set(queryLower.split(/\s+/).filter(w => w.length > 2));

  // Score documents based on word overlap
  const scored = documents.map(doc => {
    const docText = doc.pageContent.toLowerCase();
    const docWords = new Set(docText.split(/\s+/).filter(w => w.length > 2));
    
    // Calculate Jaccard similarity (word overlap)
    const intersection = new Set([...queryWords].filter(w => docWords.has(w)));
    const union = new Set([...queryWords, ...docWords]);
    const score = intersection.size / union.size;

    // Also check for exact phrase matches
    const phraseMatch = docText.includes(queryLower) ? 0.5 : 0;

    return {
      doc,
      score: score + phraseMatch,
    };
  });

  // Sort by score and return top documents
  return scored
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0)
    .map(item => item.doc);
}

