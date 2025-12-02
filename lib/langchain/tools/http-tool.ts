/**
 * HTTP Request Tool
 * 
 * Allows agents to make HTTP requests to any API
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

/**
 * HTTP request tool for making API calls
 */
export const httpTool = new DynamicStructuredTool({
  name: "http_request",
  description: "Make an HTTP request to any API endpoint. Use this to fetch data from external services or APIs.",
  schema: z.object({
    url: z.string().url().describe("The URL to make the request to"),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).describe("HTTP method"),
    headers: z.record(z.string()).optional().describe("HTTP headers as key-value pairs"),
    body: z.any().optional().describe("Request body (for POST, PUT, PATCH)"),
  }),
  func: async ({ url, method, headers, body }) => {
    try {
      console.log(`🌐 HTTP Tool Called:`);
      console.log(`  Method: ${method}`);
      console.log(`  URL: ${url}`);

      const response = await axios({
        method: method,
        url: url,
        headers: headers || {},
        data: body,
        timeout: 30000, // 30 second timeout
      });

      console.log(`✅ HTTP request successful (${response.status})`);

      return JSON.stringify({
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
      });
    } catch (error: any) {
      console.error("❌ HTTP tool error:", error);
      
      if (error.response) {
        return JSON.stringify({
          success: false,
          status: error.response.status,
          statusText: error.response.statusText,
          error: error.message,
          data: error.response.data,
        });
      }
      
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

