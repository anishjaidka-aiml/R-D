# 🐛 Debug: Agent No Output - Check Server Logs

## ❌ **Problem**

Agent completes but shows:
```json
{
  "output": "Agent completed but no output generated",
  "reasoning": [],
  "toolCalls": [],
  "executionTime": 5172
}
```

---

## 🔍 **Debugging Steps**

### **Step 1: Check Server Console Logs**

Look for these messages in your server console (where you ran `npm run dev`):

```
🤖 Manual Agent Executor
   Prompt: [your actual prompt]
   Tools: query_documents
🔄 Starting agent reasoning loop...
   System Prompt: [system prompt preview]
   User Prompt: [user prompt]
📍 Iteration 1/10
💬 Agent response (full): [what agent actually said]
```

**What to look for:**
- ✅ Is the prompt correct? (not empty, not `{{trigger.query}}`)
- ✅ Are tools listed? (`Tools: query_documents`)
- ✅ What is the agent actually saying? (`Agent response (full): ...`)

---

### **Step 2: Common Issues**

#### **Issue 1: Empty Prompt**
```
Agent prompt: ...
```
If prompt is empty or shows `{{trigger.query}}`, the variable isn't resolving.

**Fix:** Make sure Trigger Node has:
```json
{
  "query": "What is this document about?"
}
```

#### **Issue 2: Agent Not Using Tools**
```
Agent response (full): I understand you want to search documents...
```
Agent is talking about using tools but not actually calling them.

**Fix:** Use more explicit system prompt (see below)

#### **Issue 3: Agent Response Format**
```
Agent response (full): Based on the documents...
```
Agent is answering directly without using tools.

**Fix:** System prompt needs to emphasize using tools FIRST

---

## ✅ **Recommended System Prompt**

Use this **exact** system prompt in your Agent Node:

```
You are a helpful assistant that answers questions using uploaded documents.

CRITICAL INSTRUCTIONS:
1. When asked a question, you MUST use the query_documents tool FIRST
2. Use this EXACT format:
   USE_TOOL: query_documents
   PARAMETERS: {"query": "the exact question asked"}
3. Wait for the tool result
4. Then provide FINAL_ANSWER: based on what you found

DO NOT answer directly without using the tool first!
DO NOT describe what you would do - actually call the tool!

Example:
User: "What is this document about?"
You MUST respond with:
USE_TOOL: query_documents
PARAMETERS: {"query": "What is this document about?"}
```

---

## 📝 **Recommended Prompt**

Use this in your Agent Node **Prompt** field:

```
The user is asking: {{trigger.query}}

You MUST use the query_documents tool to search the uploaded documents first, then provide an answer based on the results.
```

---

## 🧪 **Test Configuration**

### **Trigger Node:**
```json
{
  "query": "What is this document about?"
}
```

### **Agent Node:**

**System Prompt:**
```
You are a helpful assistant that answers questions using uploaded documents.

CRITICAL: You MUST use query_documents tool FIRST before answering.

Format:
USE_TOOL: query_documents
PARAMETERS: {"query": "the question"}

Then provide FINAL_ANSWER: based on results.
```

**Prompt:**
```
User question: {{trigger.query}}

Use query_documents tool to search documents and answer.
```

**Tools:** ✅ Query Documents (RAG)

---

## 📊 **What the Logs Should Show**

### **✅ Good Execution:**
```
🤖 Manual Agent Executor
   Prompt: User question: What is this document about?
   Tools: query_documents
🔄 Starting agent reasoning loop...
📍 Iteration 1/10
💬 Agent response (full): USE_TOOL: query_documents
PARAMETERS: {"query": "What is this document about?"}
🛠️  Agent requesting tool...
✅ Tool: query_documents
📝 Params: { query: 'What is this document about?' }
📚 RAG Tool Called:
  Query: What is this document about?
✅ RAG query completed
📍 Iteration 2/10
💬 Agent response (full): FINAL_ANSWER: [answer based on documents]
🎯 Final answer: [answer]
```

### **❌ Bad Execution (No Output):**
```
🤖 Manual Agent Executor
   Prompt: [empty or wrong]
   Tools: query_documents
📍 Iteration 1/10
💬 Agent response (full): [empty or wrong format]
```

---

## 🔧 **Quick Fixes**

### **Fix 1: Verify Trigger Data**
Make sure Trigger Node has valid JSON:
```json
{
  "query": "What is this document about?"
}
```

### **Fix 2: Check Prompt Resolution**
After saving Agent Node, the prompt should show the actual question, not `{{trigger.query}}`

### **Fix 3: Use Explicit System Prompt**
Copy the system prompt from above - it's very explicit about using tools

### **Fix 4: Check Tool is Enabled**
Make sure "Query Documents (RAG)" is checked ✅

---

## 📋 **Checklist**

- [ ] Trigger Node has `{"query": "..."}`
- [ ] Agent Node prompt resolves correctly (not `{{trigger.query}}`)
- [ ] System Prompt explicitly tells agent to use tools
- [ ] Query Documents (RAG) tool is enabled ✅
- [ ] Documents are uploaded via RAG UI
- [ ] Server logs show agent responses

---

## 🆘 **If Still Not Working**

1. **Copy the full server log output** - especially the "Agent response (full)" lines
2. **Check if prompt is empty** - look for "Agent prompt: ..."
3. **Verify tool is in the list** - look for "Tools: query_documents"
4. **Try a simpler test** - Use calculator tool first to verify agent works

---

**The enhanced logging will help us see exactly what's happening!** Check your server console. 🔍


