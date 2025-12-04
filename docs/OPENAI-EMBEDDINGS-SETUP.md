# 🔧 OpenAI Embeddings Setup Guide

**Updated:** After adding OpenAI support

---

## ✅ **Yes, Embeddings Should Work Now!**

If you've switched to **OpenAI GPT 120B** and added **OPENAI_API_KEY**, embeddings should work perfectly!

---

## 📋 **Configuration**

### **Step 1: Add OpenAI API Key**

Add to your `.env.local` file:

```bash
# OpenAI Configuration (for embeddings and LLM)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Optional: If you still want to use AI.ML for LLM
AIML_API_KEY=your_aiml_key_here
AIML_BASE_URL=https://api.aimlapi.com/v1
AIML_MODEL=gpt-120b  # or whatever model name OpenAI uses
```

### **Step 2: Priority System**

The system now uses this priority:

1. **OPENAI_API_KEY** → Uses OpenAI API (best for embeddings)
2. **AIML_API_KEY** → Falls back to AI.ML API (if OpenAI not available)

---

## 🎯 **What Changed**

### **Embedding Client Updates:**

- ✅ **OpenAI Support:** Now checks for `OPENAI_API_KEY` first
- ✅ **Model:** Uses `text-embedding-3-small` (OpenAI's latest)
- ✅ **Fallback:** Still supports AI.ML if OpenAI not available
- ✅ **Better Error Messages:** Clear indication of which API is being used

---

## 🧪 **How to Test**

### **Option 1: Use Test Page**

1. Make sure server is running:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3000/test-embeddings`

3. Click "Test Embeddings"

4. **Expected Result:**
   ```
   ✅ AI.ML Embeddings API is WORKING!
   Embedding Type: OpenAI API (Real Embeddings)
   ```

### **Option 2: Upload Document**

1. Go to: `http://localhost:3000/rag`

2. Upload a document (PDF, TXT, or MD)

3. **Check Server Logs:**
   ```
   ✅ Using OpenAI API for embeddings
   ✅ Vector store created with embeddings
   ```

4. **If you see fallback messages:**
   ```
   ⚠️  Using simple text-based fallback
   ```
   → Check your API key configuration

---

## ✅ **Expected Behavior**

### **With OpenAI API:**

- ✅ **Real embeddings:** 1536-dimensional vectors (text-embedding-3-small)
- ✅ **Semantic search:** Much better than text-based fallback
- ✅ **Reliable:** OpenAI has robust embeddings API
- ✅ **Fast:** Quick response times

### **Server Logs Should Show:**

```
✅ Using OpenAI API for embeddings
✅ Vector store created with embeddings
✅ Document embeddings generated successfully
```

---

## 🔍 **Verification Checklist**

After setting up OpenAI API key:

- [ ] `OPENAI_API_KEY` is set in `.env.local`
- [ ] Server restarted (to load new env vars)
- [ ] Test page shows "OpenAI API" in results
- [ ] No fallback warnings in logs
- [ ] Documents upload successfully
- [ ] RAG queries work with semantic search

---

## 🐛 **Troubleshooting**

### **Problem: Still seeing fallback**

**Check:**
1. Is `OPENAI_API_KEY` in `.env.local`?
2. Did you restart the server?
3. Is the API key valid?
4. Check server logs for errors

**Solution:**
```bash
# Restart server after adding API key
npm run dev
```

### **Problem: "No API key configured"**

**Check:**
- `.env.local` file exists
- `OPENAI_API_KEY=sk-...` is set (no quotes)
- File is in project root

### **Problem: "Invalid API key"**

**Check:**
- API key starts with `sk-`
- Key is complete (not truncated)
- Key has proper permissions

---

## 📊 **Comparison**

| Feature | OpenAI API | AI.ML API | Fallback |
|---------|-----------|-----------|----------|
| **Embeddings** | ✅ Yes | ⚠️ Maybe | ✅ Yes (text-based) |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Speed** | Fast | Fast | Very Fast |
| **Cost** | Paid | Paid | Free |
| **Reliability** | High | Medium | High |

---

## 🎯 **Summary**

**With OpenAI API keys:**
- ✅ **Embeddings WILL work**
- ✅ **Better quality** than fallback
- ✅ **Semantic search** enabled
- ✅ **Production-ready**

**Next Steps:**
1. Add `OPENAI_API_KEY` to `.env.local`
2. Restart server
3. Test at `http://localhost:3000/test-embeddings`
4. Upload documents and verify embeddings work!

---

**You're all set! Embeddings should work perfectly with OpenAI API! 🎉**

