# 📚 Vector Stores - What They Are & How to Test

## 🎯 **What Are Vector Stores?**

Vector stores are databases that store documents as **embeddings** (numerical representations) and allow you to search for similar content using **semantic similarity** rather than exact keyword matching.

### **Think of it like this:**
- **Traditional Search:** "Find documents containing the word 'car'"
- **Vector Store Search:** "Find documents about vehicles, automobiles, or transportation" (even if they don't contain the exact word "car")

---

## 💡 **Why Use Vector Stores?**

### **1. Semantic Search**
- Find documents by **meaning**, not just keywords
- Understands synonyms and related concepts
- More intelligent than keyword matching

### **2. RAG (Retrieval Augmented Generation)**
- **Retrieve** relevant documents
- **Augment** LLM context with those documents
- **Generate** answers based on your documents

### **3. Document Q&A**
- Ask questions about your documents
- Get answers based on actual document content
- See which parts of documents were used

### **4. Knowledge Base**
- Store company documents, manuals, FAQs
- Query them naturally
- Get context-aware answers

---

## 🔍 **How Vector Stores Work**

### **Step 1: Document Processing**
```
Document → Split into chunks → Convert to embeddings → Store in vector DB
```

### **Step 2: Query Processing**
```
Question → Convert to embedding → Find similar document chunks → Return top matches
```

### **Step 3: Answer Generation**
```
Question + Relevant chunks → LLM → Answer with citations
```

---

## 🧪 **How to Test Vector Stores**

### **Method 1: Using the RAG UI (Easiest)**

#### **Step 1: Upload Documents**
1. Go to: **http://localhost:3000/rag**
2. Scroll to **"Upload Documents"** section
3. Click **"Select Files"**
4. Choose a document (`.txt`, `.md`, or `.pdf`)
5. Click **"Upload Documents"**
6. Wait for success message: `"Successfully uploaded X document(s)"`

#### **Step 2: Query Documents**
1. Scroll down to **"Query Documents"** section
2. Enter a question about your document, e.g.:
   - `"What is this document about?"`
   - `"Summarize the main points"`
   - `"What are the key details?"`
3. Click **"Query Documents"**
4. View the answer and sources!

#### **Step 3: Verify Results**
- ✅ Answer should be based on your document
- ✅ Sources should show relevant chunks
- ✅ Each source shows the document excerpt used

---

### **Method 2: Using the RAG Tool in Agents**

#### **Step 1: Upload Documents First**
- Use the RAG UI to upload documents
- Or use the API: `POST /api/rag/upload`

#### **Step 2: Create a Workflow**
1. Go to: **http://localhost:3000/workflows/new**
2. Add a **Trigger** node
3. Add an **AI Agent** node
4. Connect trigger → agent

#### **Step 3: Configure Agent**
1. Click the **Agent** node
2. In **Available Tools**, check **"📚 Query Documents (RAG)"**
3. Set **System Prompt:**
   ```
   You are a helpful assistant that can answer questions using uploaded documents.
   Use the query_documents tool to search for relevant information.
   ```
4. Set **Prompt:**
   ```
   What information is available about [topic from your document]?
   ```

#### **Step 4: Execute Workflow**
1. Click **"Execute Workflow"**
2. Agent will:
   - Use `query_documents` tool
   - Search your documents
   - Generate answer based on results

---

### **Method 3: Direct API Testing**

#### **Upload Documents:**
```bash
curl -X POST http://localhost:3000/api/rag/upload \
  -F "files=@test-document.txt" \
  -F "collectionName=documents"
```

#### **Query Documents:**
```bash
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is this document about?",
    "collectionName": "documents",
    "k": 4
  }'
```

---

## 📝 **Example Test Scenarios**

### **Scenario 1: Company FAQ Document**

**Document Content:**
```
Q: What is your return policy?
A: We accept returns within 30 days of purchase.

Q: How do I contact support?
A: Email support@company.com or call 1-800-123-4567.
```

**Test Queries:**
- `"What is the return policy?"` → Should find return policy info
- `"How can I get help?"` → Should find contact information
- `"What are the support options?"` → Should find support details

---

### **Scenario 2: Product Manual**

**Document Content:**
```
Product: Smart Widget 3000
Features:
- Wireless connectivity
- Battery life: 24 hours
- Water resistant (IP67)
```

**Test Queries:**
- `"What are the features of Smart Widget 3000?"` → Should list features
- `"How long does the battery last?"` → Should mention 24 hours
- `"Is it waterproof?"` → Should mention IP67 rating

---

### **Scenario 3: Research Paper**

**Document Content:**
```
Abstract: This study examines the effects of AI on productivity.
Methodology: We surveyed 1000 companies over 6 months.
Results: 75% reported increased productivity.
```

**Test Queries:**
- `"What was the research methodology?"` → Should mention survey
- `"What were the results?"` → Should mention 75% productivity increase
- `"How many companies were studied?"` → Should mention 1000

---

## 🎯 **What to Look For**

### **✅ Good Results:**
- Answer directly addresses your question
- Sources show relevant document chunks
- Answer is accurate based on document content
- Multiple relevant sources are retrieved

### **❌ Issues to Watch:**
- **No sources found:** Documents might not be uploaded
- **Irrelevant sources:** Query might be too vague
- **Wrong answers:** LLM might be hallucinating (check sources)

---

## 🔧 **Testing Different Query Types**

### **1. Factual Questions**
```
"What is [specific fact]?"
"When did [event] happen?"
"Who is [person]?"
```

### **2. Summary Questions**
```
"What is this document about?"
"Summarize the main points"
"What are the key takeaways?"
```

### **3. Comparison Questions**
```
"What are the differences between X and Y?"
"Compare [concept A] and [concept B]"
```

### **4. Detail Questions**
```
"Explain [concept] in detail"
"What does [term] mean?"
"How does [process] work?"
```

---

## 🐛 **Troubleshooting**

### **"No documents found"**
- ✅ Make sure documents are uploaded first
- ✅ Check collection name matches
- ✅ Verify upload was successful

### **"Query failed"**
- ✅ Check browser console for errors
- ✅ Check server logs
- ✅ Verify AIML_API_KEY is configured

### **"Irrelevant results"**
- ✅ Try more specific queries
- ✅ Upload more relevant documents
- ✅ Check document content quality

### **"Slow queries"**
- ✅ Normal for first query (initializes vector store)
- ✅ Subsequent queries should be faster
- ✅ Large documents may take longer

---

## 💡 **Use Cases**

### **1. Document Q&A**
- Upload company documents
- Ask questions about them
- Get answers with citations

### **2. Knowledge Base**
- Store FAQs, manuals, guides
- Query naturally
- Get context-aware answers

### **3. Research Assistant**
- Upload research papers
- Ask about findings
- Get summaries and details

### **4. Customer Support**
- Upload support documentation
- Answer customer questions
- Provide accurate information

### **5. Content Analysis**
- Upload articles or reports
- Extract key information
- Summarize content

---

## 🎓 **How It Works Internally**

### **1. Document Upload:**
```
File → Load → Split into chunks → Create embeddings → Store in vector DB
```

### **2. Query Processing:**
```
Question → Create embedding → Search similar chunks → Rank by similarity
```

### **3. Answer Generation:**
```
Question + Top chunks → LLM → Answer + Sources
```

---

## 📊 **Current Implementation**

### **Vector Store:** `MemoryVectorStore`
- In-memory storage (resets on server restart)
- Fast for development
- Good for testing

### **Embeddings:** `SimpleTextEmbeddings` (Fallback)
- Text-based similarity matching
- Works without embeddings API
- Good for demos

### **Retrieval:** Top-K similarity search
- Returns top 4 most relevant chunks (default)
- Configurable via `k` parameter
- Ranked by similarity score

---

## 🚀 **Quick Start**

1. **Create a test document:**
   ```
   Create test.txt:
   "This is a test document about AI agents.
   AI agents can use tools to perform tasks.
   They can search the web, send emails, and calculate math."
   ```

2. **Upload it:**
   - Go to http://localhost:3000/rag
   - Upload `test.txt`

3. **Query it:**
   - Ask: `"What can AI agents do?"`
   - Should get answer mentioning tools, web search, emails, math

4. **Verify sources:**
   - Check that sources show relevant chunks
   - Verify answer matches document content

---

## 🎉 **Summary**

**Vector stores enable:**
- ✅ Semantic document search
- ✅ RAG (Retrieval Augmented Generation)
- ✅ Document-based Q&A
- ✅ Knowledge base queries

**Test by:**
- ✅ Uploading documents via RAG UI
- ✅ Querying them with natural language
- ✅ Verifying answers and sources
- ✅ Using RAG tool in workflows

**Ready to test?** Go to **http://localhost:3000/rag** and start uploading! 🚀


