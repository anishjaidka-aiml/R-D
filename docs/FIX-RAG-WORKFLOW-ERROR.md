# 🔧 Fix: RAG Workflow Error - "Cannot read properties of undefined"

## ❌ **Problem**

When using RAG tool in workflows, you get this error:
```
"Cannot read properties of undefined (reading 'toLowerCase')"
```

The agent is calling `query_documents` with wrong parameters:
```json
{
  "document_id": "1"  // ❌ Wrong!
}
```

Instead of:
```json
{
  "query": "What is this document about?"  // ✅ Correct!
}
```

---

## ✅ **Solution**

### **1. Fix the Agent Prompt**

The issue is that the agent doesn't understand how to use the RAG tool. Update your **Agent Node** configuration:

#### **System Prompt:**
```
You are a helpful assistant that can answer questions using uploaded documents.
When you need to search documents, use the query_documents tool with a "query" parameter containing your question.

IMPORTANT: The query_documents tool requires a "query" parameter (your question), NOT a "document_id".
Example: {"query": "What is this document about?"}
```

#### **Prompt:**
```
{{trigger.query}}
```

Make sure your **Trigger Node** has:
```json
{
  "query": "What is this document about?"
}
```

---

## 🎯 **Correct Workflow Setup**

### **Step 1: Trigger Node**
```json
{
  "query": "What is this document about?"
}
```

### **Step 2: Agent Node**

**System Prompt:**
```
You are a helpful assistant that answers questions using uploaded documents.
Use the query_documents tool to search for relevant information.

The query_documents tool takes a "query" parameter with your question.
Example: Use query_documents with {"query": "your question here"}
```

**Prompt:**
```
{{trigger.query}}
```

**Tools:** ✅ Query Documents (RAG)

---

## 🔍 **Why This Happens**

The agent is trying to use `document_id` because:
1. It doesn't understand the tool schema correctly
2. The prompt doesn't explicitly tell it to use `query` parameter
3. It's guessing the parameter name

---

## ✅ **Fixed Code**

I've updated the RAG tool to:
1. ✅ Better description explaining the `query` parameter
2. ✅ Validation to catch missing `query` parameter
3. ✅ Clearer error messages

---

## 🧪 **Test Again**

1. **Update your Agent Node System Prompt** (use the one above)
2. **Make sure Trigger has:** `{"query": "Your question"}`
3. **Execute workflow again**

It should work now! ✅

---

## 📝 **Example: Complete Setup**

### **Trigger Node:**
```json
{
  "query": "What information is available about AI agents?"
}
```

### **Agent Node:**
- **System Prompt:**
  ```
  You are a helpful assistant that answers questions using uploaded documents.
  Use the query_documents tool with a "query" parameter containing your question.
  Example: {"query": "What is this document about?"}
  ```
- **Prompt:** `{{trigger.query}}`
- **Tools:** ✅ Query Documents (RAG)

---

## 🐛 **If Still Not Working**

1. **Check documents are uploaded:**
   - Go to http://localhost:3000/rag
   - Verify documents are uploaded successfully

2. **Check the tool is enabled:**
   - Make sure "Query Documents (RAG)" is checked in Agent node

3. **Check the prompt:**
   - Make sure you're using `{{trigger.query}}` in the prompt
   - Make sure trigger has `{"query": "..."}`

4. **Check server logs:**
   - Look for error messages in the console
   - Check if vector store is initialized

---

**The fix is now in place!** Try again with the updated prompts. 🚀


