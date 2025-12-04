# 🧪 Testing Output Parsers

## Quick Test Guide

---

## 🚀 **Test 1: JSON Parser**

### **Step 1: Create Test File**

Create `test-parsers.js` in project root:

```javascript
// test-parsers.js
const { executeAgent } = require('./lib/langchain/agent-executor');

async function testJSONParser() {
  console.log('🧪 Testing JSON Parser...\n');
  
  const result = await executeAgent(
    'Return a JSON object with name: "John Doe", age: 30, and city: "New York"',
    {
      outputParser: {
        type: 'json',
        autoFix: true,
      },
    }
  );

  console.log('✅ Raw Output:');
  console.log(result.output);
  console.log('\n✅ Parsed Output:');
  console.log(JSON.stringify(result.parsedOutput, null, 2));
  console.log('\n✅ Success:', result.success);
}

testJSONParser().catch(console.error);
```

### **Step 2: Run Test**

```bash
node test-parsers.js
```

### **Expected Output:**
```json
✅ Parsed Output:
{
  "name": "John Doe",
  "age": 30,
  "city": "New York"
}
```

---

## 🚀 **Test 2: Structured Parser**

### **Test File:**

```javascript
async function testStructuredParser() {
  console.log('🧪 Testing Structured Parser...\n');
  
  const result = await executeAgent(
    'Extract information from: "Sarah Johnson is 28 years old, lives in San Francisco, and her email is sarah@example.com"',
    {
      outputParser: {
        type: 'structured',
        schema: {
          name: 'The person\'s full name',
          age: 'The person\'s age as a number',
          city: 'The city where the person lives',
          email: 'The person\'s email address',
        },
        autoFix: true,
      },
    }
  );

  console.log('✅ Raw Output:');
  console.log(result.output);
  console.log('\n✅ Parsed Output:');
  console.log(JSON.stringify(result.parsedOutput, null, 2));
}

testStructuredParser().catch(console.error);
```

### **Expected Output:**
```json
✅ Parsed Output:
{
  "name": "Sarah Johnson",
  "age": 28,
  "city": "San Francisco",
  "email": "sarah@example.com"
}
```

---

## 🚀 **Test 3: Via API**

### **Using curl:**

```bash
curl -X POST http://localhost:3000/api/agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Return JSON with name and age",
    "config": {
      "outputParser": {
        "type": "json",
        "autoFix": true
      }
    }
  }'
```

### **Using JavaScript:**

```javascript
const response = await fetch('http://localhost:3000/api/agent/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Return JSON with name: "Test" and age: 25',
    config: {
      outputParser: {
        type: 'json',
        autoFix: true,
      },
    },
  }),
});

const result = await response.json();
console.log('Parsed:', result.parsedOutput);
```

---

## 🚀 **Test 4: Via Conversation Page**

### **Step 1: Start Dev Server**
```bash
npm run dev
```

### **Step 2: Go to Conversation Page**
Visit: `http://localhost:3000/conversation`

### **Step 3: Test with JSON Parser**

**Note:** The conversation API doesn't currently support output parsers directly, but you can test via the agent execute API.

---

## 🚀 **Test 5: Complete Test Suite**

Create `test-parsers-complete.js`:

```javascript
const { executeAgent } = require('./lib/langchain/agent-executor');

async function runAllTests() {
  console.log('🧪 Output Parser Test Suite\n');
  console.log('='.repeat(50));

  // Test 1: JSON Parser
  console.log('\n📋 Test 1: JSON Parser');
  console.log('-'.repeat(50));
  try {
    const result1 = await executeAgent(
      'Return a JSON object with product: "Laptop", price: 999.99, and inStock: true',
      {
        outputParser: { type: 'json', autoFix: true },
      }
    );
    console.log('✅ Success!');
    console.log('Parsed:', JSON.stringify(result1.parsedOutput, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 2: Structured Parser
  console.log('\n📋 Test 2: Structured Parser');
  console.log('-'.repeat(50));
  try {
    const result2 = await executeAgent(
      'Extract info: "Alice Smith, age 32, email alice@test.com, works as Engineer"',
      {
        outputParser: {
          type: 'structured',
          schema: {
            name: 'Full name',
            age: 'Age as number',
            email: 'Email address',
            job: 'Job title',
          },
          autoFix: true,
        },
      }
    );
    console.log('✅ Success!');
    console.log('Parsed:', JSON.stringify(result2.parsedOutput, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 3: Without Parser (Backward Compatibility)
  console.log('\n📋 Test 3: Without Parser (Backward Compatible)');
  console.log('-'.repeat(50));
  try {
    const result3 = await executeAgent('Tell me a short story');
    console.log('✅ Success!');
    console.log('Output:', result3.output.substring(0, 100) + '...');
    console.log('Parsed Output:', result3.parsedOutput); // Should be undefined
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
}

runAllTests().catch(console.error);
```

---

## 🎯 **Test Scenarios**

### **Scenario 1: Simple JSON**
```typescript
const result = await executeAgent(
  'Return JSON: {"status": "success", "code": 200}',
  { outputParser: { type: 'json' } }
);
// Expected: { status: "success", code: 200 }
```

### **Scenario 2: Complex Structured Data**
```typescript
const result = await executeAgent(
  'Analyze this review and extract structured data',
  {
    outputParser: {
      type: 'structured',
      schema: {
        rating: 'Rating from 1 to 5',
        sentiment: 'Sentiment: positive, negative, or neutral',
        keywords: 'List of key topics',
        summary: 'Brief summary',
      },
    },
  }
);
```

### **Scenario 3: Auto-Fix Test**
```typescript
// Test with malformed JSON - should auto-fix
const result = await executeAgent(
  'Return JSON but make a small error',
  {
    outputParser: {
      type: 'json',
      autoFix: true, // Should fix errors
    },
  }
);
```

---

## ✅ **Verification Checklist**

- [ ] JSON parser extracts JSON correctly
- [ ] Structured parser extracts schema fields
- [ ] Auto-fix works for malformed outputs
- [ ] Works without parser (backward compatible)
- [ ] Parsed output is in `result.parsedOutput`
- [ ] Raw output still available in `result.output`
- [ ] Errors are handled gracefully
- [ ] Format instructions appear in prompts

---

## 🐛 **Debugging**

### **If Parsing Fails:**

1. **Check Raw Output:**
```typescript
console.log('Raw:', result.output);
```

2. **Check Parser Config:**
```typescript
console.log('Config:', config.outputParser);
```

3. **Enable Auto-Fix:**
```typescript
{
  outputParser: {
    type: 'json',
    autoFix: true, // Try enabling this
  },
}
```

4. **Check Console Logs:**
- Look for parsing warnings
- Check for format instruction messages

---

## 📝 **Quick Test Commands**

### **Test JSON Parser:**
```bash
node -e "const {executeAgent} = require('./lib/langchain/agent-executor'); executeAgent('Return JSON: {name: \"Test\", age: 25}', {outputParser: {type: 'json'}}).then(r => console.log(r.parsedOutput))"
```

### **Test Structured Parser:**
```bash
node -e "const {executeAgent} = require('./lib/langchain/agent-executor'); executeAgent('Extract: John, 30, john@test.com', {outputParser: {type: 'structured', schema: {name: 'Name', age: 'Age', email: 'Email'}}}).then(r => console.log(r.parsedOutput))"
```

---

**Ready to test! Try the examples above.** 🚀

