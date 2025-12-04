# 📚 How to Test RAG Querying

## Step-by-Step Guide

### 1️⃣ **Open the RAG Page**
- Go to: **http://localhost:3000/rag**
- You should see the RAG interface with two sections:
  - **Upload Documents** (top)
  - **Query Documents** (below)

### 2️⃣ **Find the Query Section**
Look for the section titled **"Query Documents"** with:
- A text input box (for your question)
- A **"Query Documents"** button
- Results area (will show after querying)

### 3️⃣ **Enter Your Question**
Type a question about your uploaded document in the query box.

**Example Questions:**
- `"What is this document about?"`
- `"Summarize the main points"`
- `"What are the key details?"`
- `"Tell me about [specific topic from your document]"`
- `"What does the document say about [topic]?"`

### 4️⃣ **Click "Query Documents"**
- Click the **"Query Documents"** button
- You'll see a loading spinner while processing
- Wait a few seconds for the AI to:
  1. Search your document
  2. Find relevant chunks
  3. Generate an answer

### 5️⃣ **View Results**
After processing, you'll see:

**✅ Answer Section:**
- The AI's answer based on your document
- Generated using RAG (Retrieval Augmented Generation)

**📄 Sources Section:**
- List of document chunks used
- Each source shows:
  - The relevant text excerpt
  - Metadata (filename, etc.)
  - Relevance score (if available)

---

## 🎯 **What to Expect**

### ✅ **Success Case:**
```
Query: "What is this document about?"

Answer: [AI-generated answer based on your document]

Sources:
1. [Relevant chunk from your document]
2. [Another relevant chunk]
...
```

### ❌ **If No Documents Uploaded:**
```
Error: "I couldn't retrieve information from the documents. 
Make sure documents are uploaded."
```

---

## 💡 **Tips for Testing**

1. **Start Simple:**
   - First try: `"What is this document about?"`
   - Then try more specific questions

2. **Ask About Specific Content:**
   - Reference specific topics from your document
   - Ask follow-up questions

3. **Test Different Query Types:**
   - Summary questions
   - Detail questions
   - Comparison questions
   - Fact-finding questions

4. **Check the Sources:**
   - Verify the answer matches the source chunks
   - See which parts of your document were used

---

## 🔍 **How It Works**

1. **Query Processing:**
   - Your question is converted to a search query
   - Uses text-based similarity matching (fallback mode)

2. **Document Retrieval:**
   - Searches through uploaded document chunks
   - Finds most relevant sections (top 4 by default)

3. **Answer Generation:**
   - AI receives: Your question + Relevant document chunks
   - Generates answer using document context
   - Provides source citations

---

## 🐛 **Troubleshooting**

### **"No documents found"**
- Make sure you uploaded documents first
- Check that upload was successful
- Try uploading again

### **"Query failed"**
- Check browser console for errors
- Check server logs
- Make sure AIML_API_KEY is configured

### **Slow Response**
- Normal for first query (initializes vector store)
- Subsequent queries should be faster
- Large documents may take longer

---

## 📝 **Example Test Flow**

1. ✅ Upload a document (e.g., `test.txt` with some content)
2. ✅ Wait for "Successfully uploaded" message
3. ✅ Enter query: `"What is this document about?"`
4. ✅ Click "Query Documents"
5. ✅ View answer and sources
6. ✅ Try another query: `"What are the main points?"`
7. ✅ Compare answers and sources

---

## 🎉 **Success Indicators**

You'll know it's working when:
- ✅ You get an answer related to your document
- ✅ Sources show relevant chunks from your document
- ✅ The answer makes sense based on your document content
- ✅ You can ask follow-up questions

---

**Ready to test?** Go to **http://localhost:3000/rag** and start querying! 🚀

