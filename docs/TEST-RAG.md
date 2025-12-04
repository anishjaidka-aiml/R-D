# 🧪 Testing RAG (Retrieval Augmented Generation)

## Quick Start Guide

### **Step 1: Access RAG Page**

1. Start your dev server (if not running):
   ```bash
   npm run dev
   ```

2. Navigate to: **http://localhost:3000/rag**

---

### **Step 2: Upload Documents**

1. **Select Files:**
   - Click "Select Files" button
   - Choose one or more files:
     - `.txt` files (recommended for testing)
     - `.md` or `.markdown` files
     - `.pdf` files (may require additional setup)

2. **Optional: Set Collection Name:**
   - Leave default "documents" or enter a custom name
   - Collections help organize different document sets

3. **Click "Upload Documents"**
   - Wait for upload to complete
   - You should see: "Successfully uploaded X document(s)"

---

### **Step 3: Query Documents**

1. **Enter Your Question:**
   - Type a question about the uploaded documents
   - Example: "What is this document about?"
   - Example: "Summarize the key points"
   - Example: "What are the main topics?"

2. **Click "Query Documents"**
   - Wait for the AI to process
   - You'll see the answer with sources

---

## 📋 Example Test Scenarios

### **Test 1: Simple Text File**

1. **Create a test file** (`test.txt`):
   ```
   This is a test document about artificial intelligence.
   AI is transforming many industries including healthcare, finance, and education.
   Machine learning is a subset of AI that enables computers to learn from data.
   ```

2. **Upload** `test.txt`

3. **Query:** "What is this document about?"

4. **Expected:** Answer mentioning AI, machine learning, industries

---

### **Test 2: Multiple Documents**

1. **Create two files:**

   `doc1.txt`:
   ```
   Python is a popular programming language.
   It's used for web development, data science, and AI.
   ```

   `doc2.txt`:
   ```
   JavaScript is essential for web development.
   It runs in browsers and on servers with Node.js.
   ```

2. **Upload both files**

3. **Query:** "What programming languages are mentioned?"

4. **Expected:** Answer mentioning both Python and JavaScript

---

### **Test 3: Specific Information**

1. **Upload a document** with specific information

2. **Query:** Ask a specific question from the document

3. **Check Sources:**
   - Verify sources are shown
   - Check similarity scores
   - Verify source content matches

---

## 🔍 Testing via API

### **Test Upload API**

```bash
# Using PowerShell
$formData = @{
    files = Get-Item "path/to/your/file.txt"
    collectionName = "test"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/rag/upload" `
    -Method POST `
    -Form $formData
```

### **Test Query API**

```bash
# Using PowerShell
$body = @{
    query = "What is this document about?"
    collectionName = "test"
    k = 4
    includeSources = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/rag/query" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

---

## ✅ Success Criteria

### **Upload Should:**
- ✅ Accept files without errors
- ✅ Show success message
- ✅ Display number of documents and chunks created
- ✅ Handle multiple files

### **Query Should:**
- ✅ Return relevant answers
- ✅ Include source citations
- ✅ Show similarity scores
- ✅ Handle empty queries gracefully

---

## 🐛 Troubleshooting

### **Issue: Upload Fails**

**Check:**
1. Server console for errors
2. File format is supported (.txt, .md, .pdf)
3. File size isn't too large
4. `AIML_API_KEY` is configured

**Solutions:**
- Try a simple `.txt` file first
- Check server console for error messages
- Verify environment variables

---

### **Issue: Query Returns "No documents found"**

**Check:**
1. Documents were uploaded successfully
2. Collection name matches
3. Vector store was created

**Solutions:**
- Upload documents again
- Use default collection name "documents"
- Check server console for errors

---

### **Issue: Answers Are Not Relevant**

**Check:**
1. Documents contain relevant information
2. Query is clear and specific
3. Enough documents were uploaded

**Solutions:**
- Upload more relevant documents
- Try different query phrasings
- Increase `k` parameter (number of documents retrieved)

---

## 🎯 Testing Checklist

- [ ] Can access `/rag` page
- [ ] Can upload `.txt` file
- [ ] Can upload `.md` file
- [ ] Can upload multiple files
- [ ] Upload shows success message
- [ ] Can query uploaded documents
- [ ] Query returns relevant answers
- [ ] Sources are displayed
- [ ] Similarity scores are shown
- [ ] Error handling works

---

## 📊 Expected Behavior

### **Upload Response:**
```json
{
  "success": true,
  "message": "Successfully uploaded 1 document(s)",
  "documentsUploaded": 1,
  "chunksCreated": 3,
  "collectionName": "documents"
}
```

### **Query Response:**
```json
{
  "success": true,
  "answer": "The document discusses...",
  "sources": [
    {
      "content": "Document excerpt...",
      "metadata": {
        "source": "test.txt",
        "fileName": "test.txt"
      },
      "score": 0.85
    }
  ],
  "retrievedDocuments": 4
}
```

---

## 🚀 Next Steps After Testing

1. **Test in Workflows:**
   - Add `query_documents` tool to agent
   - Create workflow with RAG tool
   - Test end-to-end

2. **Test Different File Types:**
   - PDF documents
   - Markdown files
   - Large documents

3. **Test Performance:**
   - Multiple documents
   - Large files
   - Complex queries

---

**Happy Testing!** 🎉

