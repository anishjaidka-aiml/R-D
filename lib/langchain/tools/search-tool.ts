/**
 * Web Search Tool
 * 
 * Allows agents to search the web for information
 * Using DuckDuckGo HTML search (free, no API key required)
 * 
 * Note: DuckDuckGo has anti-bot protection, so this uses a simple HTML parsing approach
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const FALLBACK_RESULTS = [
  {
    title: "AI hardware investment remains strong (demo)",
    snippet:
      "Analysts report continued demand for high-performance AI chips, with supply chains scaling up through 2025. (Demo fallback headline)",
    url: "https://news.demo.ai/ai-hardware-trends",
  },
  {
    title: "Multi-agent workflows are powering enterprise automation (demo)",
    snippet:
      "Sample research note summarizing how autonomous agents orchestrate tools for richer insights. Replace with real news API for production.",
    url: "https://news.demo.ai/multi-agent-report",
  },
];

/**
 * Web search tool using DuckDuckGo HTML search
 * Parses DuckDuckGo HTML results directly
 */
export const searchTool = new DynamicStructuredTool({
  name: "search_web",
  description: "Search the web for current information and facts. Use this when you need recent data, news, or information not in your training data. Note: This tool may have limitations due to DuckDuckGo's anti-bot measures. For production use, consider using a paid search API.",
  schema: z.object({
    query: z.string().describe("The search query"),
    numResults: z.number().optional().describe("Number of results to return (default: 5)"),
  }),
  func: async ({ query, numResults = 5 }) => {
    try {
      console.log(`🔍 Search Tool Called:`);
      console.log(`  Query: ${query}`);
      console.log(`  Max Results: ${numResults}`);

      // Use DuckDuckGo HTML search with proper headers
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const results = [];

      // Parse HTML results - DuckDuckGo uses specific class names
      // Look for result links in the HTML
      const resultRegex = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
      const snippetRegex = /<a class="result__snippet"[^>]*>([^<]+)<\/a>/g;
      
      let match;
      const links: Array<{url: string, title: string}> = [];
      const snippets: string[] = [];

      // Extract links
      while ((match = resultRegex.exec(html)) !== null && links.length < numResults) {
        links.push({
          url: match[1],
          title: match[2].trim(),
        });
      }

      // Extract snippets
      while ((match = snippetRegex.exec(html)) !== null && snippets.length < numResults) {
        snippets.push(match[1].trim());
      }

      // Combine links and snippets
      for (let i = 0; i < Math.min(links.length, numResults); i++) {
        results.push({
          title: links[i].title || 'No title',
          snippet: snippets[i] || 'No description available',
          url: links[i].url || '',
        });
      }

      console.log(`✅ Search completed, found ${results.length} results`);

      if (results.length === 0) {
        const fallback = FALLBACK_RESULTS.slice(0, numResults).map((item) => ({
          ...item,
          snippet: `${item.snippet} (fallback for "${query}")`,
        }));

        return JSON.stringify({
          success: true,
          query,
          results: fallback,
          count: fallback.length,
          message:
            'Returned demo fallback headlines. Plug in a real search/news API for production data.',
        });
      }

      return JSON.stringify({
        success: true,
        query: query,
        results: results,
        count: results.length,
      });
    } catch (error: any) {
      console.error("❌ Search tool error:", error);
      console.error("  Error details:", error.stack);
      
      return JSON.stringify({
        success: false,
        error: error.message,
        message: `Search failed: ${error.message}. DuckDuckGo may be blocking automated requests. For reliable search results, consider using the HTTP Request tool with a search API service that requires an API key (like SerpAPI, Google Custom Search, or Bing Search API).`,
        suggestion: "Use HTTP Request tool with a search API for production use.",
      });
    }
  },
});

