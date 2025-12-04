# 📝 Output Parsers - Usage Examples

## Quick Examples

### **Example 1: JSON Parser**

```typescript
import { executeAgent } from '@/lib/langchain/agent-executor';

// Simple JSON extraction
const result = await executeAgent(
  'Return a JSON object with name: "John" and age: 30',
  {
    outputParser: {
      type: 'json',
      autoFix: true,
    },
  }
);

console.log(result.parsedOutput);
// { name: "John", age: 30 }
```

---

### **Example 2: Structured Parser**

```typescript
// Extract structured data
const result = await executeAgent(
  'Extract information about the person mentioned in this text: "John Doe is 30 years old and lives in New York"',
  {
    outputParser: {
      type: 'structured',
      schema: {
        name: 'The person\'s full name',
        age: 'The person\'s age as a number',
        city: 'The city where the person lives',
      },
      autoFix: true,
    },
  }
);

console.log(result.parsedOutput);
// {
//   name: "John Doe",
//   age: 30,
//   city: "New York"
// }
```

---

### **Example 3: Data Analysis**

```typescript
// Analyze text and extract structured insights
const result = await executeAgent(
  'Analyze this product review and extract key information',
  {
    outputParser: {
      type: 'structured',
      schema: {
        sentiment: 'The sentiment: positive, negative, or neutral',
        rating: 'Rating from 1 to 5',
        keywords: 'List of key topics mentioned',
        summary: 'Brief summary of the review',
      },
    },
  }
);
```

---

### **Example 4: API Response Formatting**

```typescript
// Format response as JSON for API
const result = await executeAgent(
  'Get user information and format as JSON',
  {
    outputParser: {
      type: 'json',
      autoFix: true,
    },
  }
);

// Use parsed output in API response
return {
  data: result.parsedOutput,
  raw: result.output,
};
```

---

### **Example 5: Without Parser (Default)**

```typescript
// Works exactly as before - no changes needed
const result = await executeAgent('Tell me a story');
console.log(result.output); // Plain text
// result.parsedOutput is undefined
```

---

## 🎯 Common Patterns

### **Pattern 1: Extract Contact Info**

```typescript
const result = await executeAgent(
  'Extract contact information from this text',
  {
    outputParser: {
      type: 'structured',
      schema: {
        name: 'Full name',
        email: 'Email address',
        phone: 'Phone number',
        address: 'Physical address',
      },
      autoFix: true,
    },
  }
);
```

### **Pattern 2: Sentiment Analysis**

```typescript
const result = await executeAgent(
  'Analyze the sentiment of this text',
  {
    outputParser: {
      type: 'structured',
      schema: {
        sentiment: 'Sentiment: positive, negative, or neutral',
        confidence: 'Confidence score from 0 to 1',
        emotions: 'List of emotions detected',
      },
    },
  }
);
```

### **Pattern 3: Data Extraction**

```typescript
const result = await executeAgent(
  'Extract key data points from this document',
  {
    outputParser: {
      type: 'structured',
      schema: {
        title: 'Document title',
        author: 'Author name',
        date: 'Publication date',
        topics: 'List of main topics',
      },
      autoFix: true,
    },
  }
);
```

---

## ⚠️ Important Notes

1. **Parser is Optional**
   - Works without parser (backward compatible)
   - Raw output always available in `result.output`
   - Parsed output in `result.parsedOutput`

2. **Error Handling**
   - Parsing errors don't stop execution
   - Falls back to raw output if parsing fails
   - Errors logged to console

3. **Format Instructions**
   - Automatically added to system prompt
   - Helps LLM generate correct format
   - Increases parsing success rate

---

## 🔧 Configuration

```typescript
{
  outputParser: {
    type: 'structured',        // 'json' | 'structured' | 'none'
    schema: { ... },           // Required for 'structured'
    autoFix: true,             // Optional, default: false
    maxRetries: 3,             // Optional, default: 3
  }
}
```

---

**See `docs/PHASE9-OUTPUT-PARSERS-COMPLETE.md` for full documentation!**

