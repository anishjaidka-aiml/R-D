# 🔧 Baseten GPT-120B Setup Guide

**Using Baseten's OpenAI-compatible API for GPT-120B**

---

## 📋 **Your .env.local Configuration**

Since you're using **Baseten GPT-120B**, your `.env.local` should look like this:

```bash
# ============================================
# Baseten Configuration (GPT-120B)
# ============================================

# Baseten API Key (does NOT start with sk-)
OPENAI_API_KEY=your_baseten_api_key_here

# Baseten Base URL (REQUIRED)
OPENAI_BASE_URL=https://inference.baseten.co/v1

# Baseten Model Name
OPENAI_MODEL=openai/gpt-oss-120b

# ============================================
# Optional: Other Services
# ============================================

# Email Service - Resend (optional)
RESEND_API_KEY=

# Gmail API Configuration (optional)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Encryption key for OAuth tokens (optional)
OAUTH_ENCRYPTION_KEY=your_random_encryption_key_here
```

---

## 🔑 **Important Notes**

### **API Key Format:**
- ✅ Baseten API keys do **NOT** start with `sk-`
- ✅ They're different format (usually alphanumeric)
- ✅ Get it from your Baseten dashboard

### **Base URL:**
- ✅ **REQUIRED** for Baseten: `https://inference.baseten.co/v1`
- ✅ Must include `/v1` at the end
- ✅ This tells the system to use Baseten, not OpenAI

### **Model Name:**
- ✅ Use: `openai/gpt-oss-120b` (or whatever Baseten calls it)
- ✅ Check Baseten docs for exact model name
- ✅ Format is usually: `openai/gpt-oss-120b` or `gpt-oss-120b`

---

## 🧪 **Testing**

### **Step 1: Restart Server**

```bash
# Stop server (Ctrl+C)
npm run dev
```

### **Step 2: Test LLM Connection**

Visit: `http://localhost:3000/test-connection`

**Expected:**
```
✅ Successfully connected to Baseten!
Provider: OpenAI
Model: openai/gpt-oss-120b
```

### **Step 3: Test Embeddings**

Visit: `http://localhost:3000/test-embeddings`

**Expected:**
```
✅ AI.ML Embeddings API is WORKING!
Embedding Type: Baseten API (OpenAI-compatible)

✅ API Key Check - OPENAI_API_KEY found
✅ Create Embedding Client - Success
✅ Test Embedding Query - Successfully created embedding!
```

**Server Logs Should Show:**
```
✅ Using Baseten API for embeddings (OpenAI-compatible)
   Using base URL: https://inference.baseten.co/v1
```

---

## 🔍 **How It Works**

### **Baseten is OpenAI-Compatible:**

1. **Uses OpenAI Client Library**
   - Baseten provides OpenAI-compatible endpoints
   - We use `OpenAIEmbeddings` and `ChatOpenAI` from LangChain
   - Just change the base URL!

2. **Base URL Detection**
   - Code detects `baseten.co` in base URL
   - Logs show "Using Baseten API" instead of "Using OpenAI API"
   - Same functionality, different provider

3. **Model Names**
   - Baseten uses format: `openai/gpt-oss-120b`
   - OpenAI uses format: `gpt-4o`
   - Both work with same client!

---

## 📊 **Configuration Comparison**

| Provider | API Key Format | Base URL | Model Name |
|----------|---------------|----------|------------|
| **OpenAI** | `sk-...` | `https://api.openai.com/v1` (default) | `gpt-4o` |
| **Baseten** | `baseten_...` | `https://inference.baseten.co/v1` | `openai/gpt-oss-120b` |
| **AI.ML** | Various | `https://api.aimlapi.com/v1` | `llama-3.3-70b-instruct` |

---

## ✅ **Verification Checklist**

After setting up:

- [ ] `OPENAI_API_KEY` is set (Baseten key, no `sk-` prefix)
- [ ] `OPENAI_BASE_URL` is set to `https://inference.baseten.co/v1`
- [ ] `OPENAI_MODEL` is set to `openai/gpt-oss-120b` (or correct Baseten model name)
- [ ] Server restarted
- [ ] Test connection shows "Baseten" in logs
- [ ] Embeddings test works

---

## 🐛 **Troubleshooting**

### **Problem: "400 Bad Request" on embeddings**

**Possible Causes:**
1. Baseten might not support embeddings endpoint
2. Wrong base URL
3. Wrong model name for embeddings

**Solution:**
- Check Baseten docs for embeddings support
- Try different embedding model name
- Verify base URL is correct

### **Problem: "Invalid API key"**

**Check:**
- API key is correct (copy from Baseten dashboard)
- No extra spaces or quotes
- Key has proper permissions

### **Problem: "Model not found"**

**Check:**
- Model name is correct (check Baseten dashboard)
- Format: `openai/gpt-oss-120b` or as shown in Baseten docs
- Model is deployed and available

---

## 📝 **Example .env.local**

```bash
# Baseten GPT-120B Configuration
OPENAI_API_KEY=baseten_your_actual_key_here
OPENAI_BASE_URL=https://inference.baseten.co/v1
OPENAI_MODEL=openai/gpt-oss-120b

# Optional services
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
OAUTH_ENCRYPTION_KEY=
```

---

## 🎯 **Summary**

**For Baseten GPT-120B:**

1. ✅ Use `OPENAI_API_KEY` (your Baseten key - no `sk-` prefix)
2. ✅ Set `OPENAI_BASE_URL=https://inference.baseten.co/v1` (**REQUIRED**)
3. ✅ Set `OPENAI_MODEL=openai/gpt-oss-120b` (or correct Baseten model name)
4. ✅ Restart server
5. ✅ Test!

**The system will automatically detect Baseten from the base URL and use it correctly!** 🎉

---

**Your setup should work now! Restart server and test! 🚀**

