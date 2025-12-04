# ⚡ Quick Test: Output Parsers

## 🚀 **Fastest Way to Test**

### **Method 1: Run Test Script**

```bash
node test-output-parsers.js
```

This runs 4 tests:
1. ✅ JSON Parser
2. ✅ Structured Parser  
3. ✅ Without Parser (backward compatible)
4. ✅ Auto-Fix functionality

---

## 🚀 **Method 2: Test via API**

### **Start Dev Server:**
```bash
npm run dev
```

### **Test JSON Parser:**

**Using PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/agent/execute" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"prompt":"Return JSON: {name: \"Test\", age: 25}","config":{"outputParser":{"type":"json","autoFix":true}}}' | 
  Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Using curl (if available):**
```bash
curl -X POST http://localhost:3000/api/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Return JSON: {name: \"Test\", age: 25}","config":{"outputParser":{"type":"json","autoFix":true}}}'
```

---

## 🚀 **Method 3: Test in Code**

Create `test-quick.js`:

```javascript
const { executeAgent } = require('./lib/langchain/agent-executor');

async function quickTest() {
  // Test JSON Parser
  const result = await executeAgent(
    'Return JSON: {name: "John", age: 30}',
    { outputParser: { type: 'json', autoFix: true } }
  );
  
  console.log('Parsed:', result.parsedOutput);
  // Expected: { name: "John", age: 30 }
}

quickTest();
```

Run:
```bash
node test-quick.js
```

---

## ✅ **What to Look For**

### **Success Indicators:**
- ✅ `result.parsedOutput` exists
- ✅ `result.parsedOutput` is an object (not string)
- ✅ Contains expected fields
- ✅ Valid JSON structure

### **If It Fails:**
- Check `result.output` (raw text)
- Check console for warnings
- Try enabling `autoFix: true`
- Verify schema is correct

---

## 🎯 **Quick Verification**

```javascript
const result = await executeAgent('Return JSON: {test: true}', {
  outputParser: { type: 'json' }
});

// Should be true
console.log('Has parsed output:', !!result.parsedOutput);
console.log('Is object:', typeof result.parsedOutput === 'object');
console.log('Parsed:', result.parsedOutput);
```

---

**Run `node test-output-parsers.js` to test everything!** 🚀

