# 🤖 Available AI.ML Models

This document explains which models are available in your AI.ML API and which to use for different scenarios.

---

## 🎯 **RECOMMENDED MODELS FOR AGENTIC WORKFLOWS**

### **Best for Agent Workflows: `llama-3.3-70b-instruct`** ⭐

```env
AIML_MODEL=llama-3.3-70b-instruct
```

**Why this model?**
- ✅ High-accuracy reasoning
- ✅ Excellent for tool calling
- ✅ Detailed responses
- ✅ Enterprise-grade performance
- ✅ Best balance of speed and quality

**Use for:**
- Complex agent workflows
- Multi-step reasoning
- Tool calling with multiple tools
- Production use cases

---

### **Fastest & Efficient: `deepseek-r1-distill-llama-70b`** ⚡

```env
AIML_MODEL=deepseek-r1-distill-llama-70b
```

**Why this model?**
- ✅ Fast responses
- ✅ Optimized efficiency
- ✅ Still powerful reasoning
- ✅ Good for rapid development

**Use for:**
- Quick prototyping
- Testing workflows
- Cost-sensitive applications
- High-throughput scenarios

---

### **Maximum Power: `deepseek-v3-0324-671b`** 💪

```env
AIML_MODEL=deepseek-v3-0324-671b
```

**Why this model?**
- ✅ Best reasoning capabilities
- ✅ Excellent for complex tasks
- ✅ Superior code understanding
- ⚠️ Slower responses
- ⚠️ Higher cost

**Use for:**
- Complex reasoning tasks
- Code generation/analysis
- Research applications
- When quality > speed

---

## 📊 **ALL AVAILABLE MODELS**

| Model | Size | Best For | Speed | Quality |
|-------|------|----------|-------|---------|
| `llama-3.3-70b-instruct` ⭐ | 70B | **Agents, tool calling** | Fast | ⭐⭐⭐⭐⭐ |
| `deepseek-r1-distill-llama-70b` | 70B | **Fast agents** | Very Fast | ⭐⭐⭐⭐ |
| `deepseek-v3-0324-671b` | 671B | Complex reasoning | Slow | ⭐⭐⭐⭐⭐ |
| `deepseek-r1-671b` | 671B | Premium tasks | Slowest | ⭐⭐⭐⭐⭐ |
| `llama3-70b-8192` | 70B | Long documents | Fast | ⭐⭐⭐⭐ |
| `llama-3.1-8b-instruct` | 8B | Quick tasks | Fastest | ⭐⭐⭐ |
| `llama3-8b-8192` | 8B | Lightweight | Fastest | ⭐⭐⭐ |
| `qwen3-32b` | 32B | Multilingual | Fast | ⭐⭐⭐⭐ |
| `qwq-32b` | 32B | Dialogue | Fast | ⭐⭐⭐⭐ |
| `gemma2-9b-it` | 9B | Task-oriented | Fast | ⭐⭐⭐ |
| `gpt-oss-120b` | 120B | Balanced | Medium | ⭐⭐⭐⭐ |
| `gpt-oss-20b` | 20B | Mid-scale | Fast | ⭐⭐⭐ |
| `llma-4-maverick-17b-128e-instruct` | 17B | OCR/Images | Fast | ⭐⭐⭐ |

---

## 🎯 **CHOOSING THE RIGHT MODEL**

### **For Production Agents**
```
Primary: llama-3.3-70b-instruct
Fallback: deepseek-r1-distill-llama-70b
```

### **For Development/Testing**
```
Use: llama-3.1-8b-instruct (fastest, cheapest)
```

### **For Complex Reasoning**
```
Use: deepseek-v3-0324-671b (best quality)
```

### **For OCR/Image Tasks**
```
Use: llma-4-maverick-17b-128e-instruct
```

---

## 🔄 **HOW TO SWITCH MODELS**

### **Method 1: Environment Variable**

Edit `.env.local`:

```env
# Change this line to use different model
AIML_MODEL=llama-3.3-70b-instruct
```

### **Method 2: Runtime Configuration**

```typescript
import { createAIMLClient } from '@/lib/langchain/client';

// Use specific model for this agent
const agent = createAIMLClient({
  modelName: 'deepseek-r1-distill-llama-70b',
  temperature: 0.7,
});
```

---

## ⚠️ **IMPORTANT NOTES**

### **Tool Calling Support**

Not all models support function/tool calling equally well. Best for agents:

1. ✅ `llama-3.3-70b-instruct` - Excellent
2. ✅ `deepseek-r1-distill-llama-70b` - Very Good
3. ✅ `deepseek-v3-0324-671b` - Excellent
4. ⚠️ Smaller models (8B) - May struggle with complex tool calling

### **Context Window**

- `llama3-70b-8192` - 8192 tokens (best for long docs)
- Most others - Standard context window
- Consider context length for your use case

### **Cost vs Performance**

```
Fastest/Cheapest:  llama-3.1-8b-instruct
Balanced:          llama-3.3-70b-instruct  ⭐ RECOMMENDED
Most Powerful:     deepseek-v3-0324-671b
```

---

## 🧪 **TESTING MODELS**

Test connection with any model:

```bash
# Visit in browser
http://localhost:3000/test-connection

# Or via API
curl http://localhost:3000/api/test-connection
```

---

## 📝 **RECOMMENDATIONS SUMMARY**

```
Default (POC):     llama-3.3-70b-instruct
Fast Testing:      llama-3.1-8b-instruct  
Production:        llama-3.3-70b-instruct
Premium Quality:   deepseek-v3-0324-671b
Fast Production:   deepseek-r1-distill-llama-70b
```

---

**Need help choosing? Start with `llama-3.3-70b-instruct` - it's the best all-around choice!** ⭐

