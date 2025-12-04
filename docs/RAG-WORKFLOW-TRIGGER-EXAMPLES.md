# 🎯 RAG Workflow - Trigger Node Examples

## 📋 **What to Write in Trigger Node for RAG Testing**

When testing RAG (Query Documents) in workflows, the trigger node should contain the **question** you want to ask about your uploaded documents.

---

## 🎯 **Simple Example**

### **Trigger Node Configuration:**

**Label:** `RAG Query`

**Trigger Data (JSON):**
```json
{
  "query": "What information is available about AI agents?"
}
```

### **Agent Node Configuration:**

**System Prompt:**
```
You are a helpful assistant that can answer questions using uploaded documents.
Use the query_documents tool to search for relevant information from the uploaded documents.
```

**Prompt:**
```
{{trigger.query}}
```

**Available Tools:** ✅ **Query Documents (RAG)**

---

## 📝 **More Examples**

### **Example 1: General Question**

**Trigger Data (JSON):**
```json
{
  "question": "What is this document about?"
}
```

**Agent Prompt:**
```
{{trigger.question}}
```

---

### **Example 2: Specific Topic Query**

**Trigger Data (JSON):**
```json
{
  "topic": "vector stores",
  "question": "What information is available about {{trigger.topic}}?"
}
```

**Agent Prompt:**
```
{{trigger.question}}
```

**Or directly:**
```
What information is available about {{trigger.topic}}?
```

---

### **Example 3: Multiple Questions**

**Trigger Data (JSON):**
```json
{
  "query": "What are the main features and benefits mentioned in the documents?"
}
```

**Agent Prompt:**
```
{{trigger.query}}
```

---

### **Example 4: Summary Request**

**Trigger Data (JSON):**
```json
{
  "request": "Summarize the key points from the uploaded documents"
}
```

**Agent Prompt:**
```
{{trigger.request}}
```

---

### **Example 5: Detailed Query**

**Trigger Data (JSON):**
```json
{
  "subject": "AI agents",
  "question": "What does the document say about {{trigger.subject}}? Include specific details and examples."
}
```

**Agent Prompt:**
```
{{trigger.question}}
```

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Upload Documents First**
1. Go to: **http://localhost:3000/rag**
2. Upload your documents (`.txt`, `.md`, or `.pdf`)
3. Wait for success message

### **Step 2: Create Workflow**
1. Go to: **http://localhost:3000/workflows/new**
2. Click **"+"** → Add **"Trigger"** node
3. Click **"+"** → Add **"AI Agent"** node
4. Connect trigger → agent (drag from trigger output to agent input)

### **Step 3: Configure Trigger Node**
1. Click on the **Trigger** node
2. **Label:** `RAG Query` (or any name)
3. **Trigger Data (JSON):**
   ```json
   {
     "query": "What is this document about?"
   }
   ```
4. Click **"Save"**

### **Step 4: Configure Agent Node**
1. Click on the **Agent** node
2. **System Prompt:**
   ```
   You are a helpful assistant that can answer questions using uploaded documents.
   Use the query_documents tool to search for relevant information.
   ```
3. **Prompt:**
   ```
   {{trigger.query}}
   ```
4. **Available Tools:** Check ✅ **"Query Documents (RAG)"**
5. Click **"Save"**

### **Step 5: Execute Workflow**
1. Click **"Execute Workflow"** button
2. Watch the agent:
   - Use `query_documents` tool
   - Search your uploaded documents
   - Generate answer based on results
3. View the answer in execution logs

---

## 💡 **Tips**

### **1. Keep It Simple**
Start with a simple question:
```json
{
  "query": "What is this document about?"
}
```

### **2. Be Specific**
For better results, ask specific questions:
```json
{
  "query": "What are the main features of the product mentioned in the documents?"
}
```

### **3. Use Variables**
You can use variables in your prompt:
```json
{
  "topic": "vector stores",
  "query": "Explain {{trigger.topic}} based on the documents"
}
```

### **4. Multiple Questions**
You can ask multiple things:
```json
{
  "query": "What are the key features and benefits mentioned in the documents?"
}
```

---

## 🎯 **Complete Example Workflow**

### **Trigger Node:**
```json
{
  "query": "What information is available about AI agents and their capabilities?"
}
```

### **Agent Node:**
- **System Prompt:**
  ```
  You are a helpful research assistant. Use the query_documents tool to find 
  relevant information from uploaded documents and provide detailed answers 
  with citations.
  ```
- **Prompt:**
  ```
  {{trigger.query}}
  
  Please search the uploaded documents and provide a comprehensive answer 
  based on what you find. Include specific details and cite your sources.
  ```
- **Tools:** ✅ Query Documents (RAG)

---

## 🔍 **What Happens When You Execute**

1. **Trigger Node** provides the query/question
2. **Agent Node** receives: `{{trigger.query}}`
3. **Agent** uses `query_documents` tool with your question
4. **Tool** searches uploaded documents for relevant chunks
5. **Agent** receives relevant document chunks
6. **Agent** generates answer based on document content
7. **Answer** is returned with source citations

---

## ❌ **Common Mistakes**

### **❌ Missing Query Field**
```json
{
  "message": "Hello"
}
```
**Problem:** Agent won't know what to query

### **✅ Correct**
```json
{
  "query": "What is this document about?"
}
```

### **❌ Not Enabling RAG Tool**
**Problem:** Agent can't access documents

### **✅ Solution**
Make sure **"Query Documents (RAG)"** tool is checked in Agent node

### **❌ Forgetting to Upload Documents**
**Problem:** No documents to search

### **✅ Solution**
Upload documents via RAG UI first: http://localhost:3000/rag

---

## 🎉 **Quick Test Template**

Copy this into your Trigger Node:

```json
{
  "query": "What is this document about?"
}
```

Then in Agent Node:
- **Prompt:** `{{trigger.query}}`
- **Tools:** ✅ Query Documents (RAG)

Execute and see the magic! ✨

---

## 📚 **Related Guides**

- **How to Test RAG:** `docs/HOW-TO-TEST-RAG.md`
- **Vector Stores Guide:** `docs/VECTOR-STORES-GUIDE.md`
- **Trigger Node Examples:** `docs/TRIGGER-NODE-EXAMPLES.md`

---

**Ready to test?** Create a workflow and try it out! 🚀


