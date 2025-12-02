/**
 * Variable Resolver
 * 
 * Resolves {{variable}} syntax in workflow configurations
 */

/**
 * Resolve variables in a string
 * Replaces {{nodeName.field}} with actual values from context
 * 
 * Example:
 * Input: "Hello {{trigger.name}}, you are {{trigger.age}} years old"
 * Context: { trigger: { name: "John", age: 25 } }
 * Output: "Hello John, you are 25 years old"
 */
export function resolveVariables(text: string, context: Record<string, any>): string {
  if (!text || typeof text !== 'string') return text;

  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    try {
      const keys = path.trim().split('.');
      let value: any = context;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          // Variable not found, return original
          return match;
        }
      }

      // Convert value to string
      if (value === null || value === undefined) {
        return '';
      }

      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      return String(value);
    } catch (error) {
      console.error('Error resolving variable:', path, error);
      return match;
    }
  });
}

/**
 * Resolve variables in an object recursively
 */
export function resolveVariablesInObject(
  obj: any,
  context: Record<string, any>
): any {
  if (typeof obj === 'string') {
    return resolveVariables(obj, context);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => resolveVariablesInObject(item, context));
  }

  if (obj && typeof obj === 'object') {
    const resolved: any = {};
    for (const key in obj) {
      resolved[key] = resolveVariablesInObject(obj[key], context);
    }
    return resolved;
  }

  return obj;
}

/**
 * Check if a string contains variables
 */
export function hasVariables(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text);
}

/**
 * Extract all variable names from text
 */
export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];

  return matches.map(match => {
    const path = match.slice(2, -2).trim();
    return path.split('.')[0]; // Return just the node name
  });
}

