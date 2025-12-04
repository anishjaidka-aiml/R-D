# 📋 Environment Variables Template

**Complete `.env.local` configuration guide**

---

## 🎯 **For OpenAI (Recommended)**

If you're using **OpenAI API** for both LLM and embeddings:

```bash
# ============================================
# OpenAI Configuration (LLM + Embeddings)
# ============================================

# OpenAI API Key (Required)
OPENAI_API_KEY=sk-your_openai_api_key_here

# OpenAI Base URL (Optional - only if using custom endpoint/proxy)
# Leave empty to use OpenAI's default: https://api.openai.com/v1
OPENAI_BASE_URL=https://api.openai.com/v1

# OpenAI Model (Optional - defaults to gpt-4o)
# Options: gpt-4o, gpt-4-turbo, gpt-3.5-turbo, gpt-120b, etc.
OPENAI_MODEL=gpt-120b

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

## 🎯 **For AI.ML (Alternative)**

If you're using **AI.ML API**:

```bash
# ============================================
# AI.ML Configuration (LLM)
# ============================================

# AI.ML API Key (Required)
AIML_API_KEY=your_aiml_api_key_here

# AI.ML Base URL (Optional - defaults to https://api.aimlapi.com/v1)
AIML_BASE_URL=https://api.aimlapi.com/v1

# AI.ML Model (Optional - defaults to llama-3.3-70b-instruct)
AIML_MODEL=llama-3.3-70b-instruct

# ============================================
# OpenAI for Embeddings (Recommended)
# ============================================

# OpenAI API Key (for embeddings - recommended)
OPENAI_API_KEY=sk-your_openai_api_key_here

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

## 🎯 **Hybrid Setup (OpenAI + AI.ML)**

Use **OpenAI for embeddings** and **AI.ML for LLM**:

```bash
# ============================================
# OpenAI Configuration (for Embeddings)
# ============================================

OPENAI_API_KEY=sk-your_openai_api_key_here

# ============================================
# AI.ML Configuration (for LLM)
# ============================================

AIML_API_KEY=your_aiml_api_key_here
AIML_BASE_URL=https://api.aimlapi.com/v1
AIML_MODEL=llama-3.3-70b-instruct

# ============================================
# Optional: Other Services
# ============================================

RESEND_API_KEY=
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
OAUTH_ENCRYPTION_KEY=your_random_encryption_key_here
```

---

## 📊 **Priority System**

### **For LLM (Language Model):**
1. **OPENAI_API_KEY** → Uses OpenAI API
2. **AIML_API_KEY** → Falls back to AI.ML API

### **For Embeddings:**
1. **OPENAI_API_KEY** → Uses OpenAI API (best)
2. **AIML_API_KEY** → Falls back to AI.ML API (may not work)
3. **Fallback** → SimpleTextEmbeddings (if both fail)

---

## 🔧 **What Each Variable Does**

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key (for LLM + embeddings) | Yes (if using OpenAI) | - |
| `OPENAI_BASE_URL` | Custom OpenAI endpoint (optional) | No | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | OpenAI model name | No | `gpt-4o` |
| `AIML_API_KEY` | AI.ML API key (for LLM) | Yes (if using AI.ML) | - |
| `AIML_BASE_URL` | AI.ML base URL | No | `https://api.aimlapi.com/v1` |
| `AIML_MODEL` | AI.ML model name | No | `llama-3.3-70b-instruct` |
| `RESEND_API_KEY` | Email service (optional) | No | - |
| `GOOGLE_CLIENT_ID` | Gmail integration (optional) | No | - |
| `GOOGLE_CLIENT_SECRET` | Gmail integration (optional) | No | - |
| `GOOGLE_REDIRECT_URI` | Gmail OAuth redirect | No | `http://localhost:3000/api/auth/gmail/callback` |
| `OAUTH_ENCRYPTION_KEY` | OAuth token encryption | No | - |

---

## ✅ **Recommended Setup (OpenAI)**

Since you mentioned you have OpenAI API key, base URL, and model:

```bash
# Copy this to your .env.local file

# OpenAI Configuration
OPENAI_API_KEY=sk-your_actual_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-120b

# Optional: Other services
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
OAUTH_ENCRYPTION_KEY=
```

---

## 🧪 **After Setting Up**

1. **Restart your server:**
   ```bash
   npm run dev
   ```

2. **Test LLM connection:**
   - Visit: `http://localhost:3000/test-connection`
   - Should show: "Successfully connected to OpenAI!"

3. **Test embeddings:**
   - Visit: `http://localhost:3000/test-embeddings`
   - Should show: "AI.ML Embeddings API is WORKING!" with OpenAI API

---

## 📝 **Notes**

- **No quotes needed** around values in `.env.local`
- **No spaces** around `=` sign
- **Restart server** after changing `.env.local`
- **Keep `.env.local` secret** - never commit it to git

---

**That's it! Your `.env.local` is ready! 🎉**

