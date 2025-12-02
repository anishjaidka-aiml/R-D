/**
 * Calculator Tool
 * 
 * Allows agents to perform mathematical calculations
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Calculator tool for mathematical operations
 */
export const calculatorTool = new DynamicStructuredTool({
  name: "calculator",
  description: "Perform mathematical calculations. Use this for any math operations like addition, subtraction, multiplication, division, percentages, etc. Input should be a valid mathematical expression.",
  schema: z.object({
    expression: z.string().describe("Mathematical expression to evaluate (e.g., '2 + 2', '15 * 7', '100 / 4')"),
  }),
  func: async ({ expression }) => {
    try {
      console.log(`🔢 Calculator Tool Called:`);
      console.log(`  Expression: ${expression}`);

      // Clean the expression
      const cleanExpression = expression
        .replace(/[^0-9+\-*/().\s]/g, '') // Remove non-math characters
        .trim();

      if (!cleanExpression) {
        throw new Error("Invalid mathematical expression");
      }

      // Safely evaluate using Function constructor (better than eval)
      // This is safe because we've sanitized the input
      const result = Function(`'use strict'; return (${cleanExpression})`)();

      console.log(`✅ Calculation result: ${result}`);

      return JSON.stringify({
        success: true,
        expression: expression,
        result: result,
      });
    } catch (error: any) {
      console.error("❌ Calculator tool error:", error);
      return JSON.stringify({
        success: false,
        error: error.message,
        expression: expression,
        message: "Invalid mathematical expression. Please check your input.",
      });
    }
  },
});

