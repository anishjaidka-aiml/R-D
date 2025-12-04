# 🧪 Simple Test: Output Parsers

## 🚀 **Easiest Way: Use the Test API**

### **Step 1: Start Dev Server**
```bash
npm run dev
```

### **Step 2: Visit Test Endpoint**

Open in browser:
```
http://localhost:3000/api/test/parsers
```

This runs all 4 tests automatically and shows results!

---

## 🚀 **Method 2: Test via Browser**

### **Test JSON Parser:**

1. Go to: `http://localhost:3000/test-agent`
2. Enter prompt: `Return JSON: {name: "John", age: 30}`
3. In the code, you'd need to add parser config (or use API)

---

## 🚀 **Method 3: Use Test API with curl/PowerShell**

### **Run All Tests:**

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test/parsers" -Method GET | 
  Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### **Test Specific Parser:**

**PowerShell:**
```powershell
$body = @{
    prompt = 'Return JSON: {name: "Test", age: 25}'
    parserConfig = @{
        type = 'json'
        autoFix = $true
    }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3000/api/test/parsers" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body | 
  Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 🚀 **Method 4: TypeScript Test File**

If you have `tsx` installed:

```bash
# Install tsx globally (one time)
npm install -g tsx

# Run test
tsx test-output-parsers.ts
```

Or add to package.json:
```json
{
  "scripts": {
    "test:parsers": "tsx test-output-parsers.ts"
  }
}
```

Then run:
```bash
npm run test:parsers
```

---

## ✅ **Quick Verification**

### **Via Browser:**
1. Start server: `npm run dev`
2. Visit: `http://localhost:3000/api/test/parsers`
3. See all test results!

### **Via PowerShell:**
```powershell
# Quick test
Invoke-WebRequest "http://localhost:3000/api/test/parsers" | 
  Select-Object -ExpandProperty Content
```

---

## 🎯 **What You'll See**

### **Success Response:**
```json
{
  "success": true,
  "tests": {
    "jsonParser": {
      "success": true,
      "parsedOutput": { "name": "John Doe", "age": 30, "city": "New York" }
    },
    "structuredParser": {
      "success": true,
      "parsedOutput": { "name": "Sarah Johnson", "age": 28, ... }
    },
    ...
  },
  "summary": {
    "total": 4,
    "passed": 4,
    "failed": 0
  }
}
```

---

**Easiest: Visit `http://localhost:3000/api/test/parsers` in your browser!** 🚀

