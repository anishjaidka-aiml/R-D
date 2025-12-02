# 🚀 Setup Instructions

## Step 1: Create Environment File

Create a `.env.local` file in the project root:

```bash
# Copy and paste this into .env.local

# AI.ML Configuration (Your Company API)
AIML_API_KEY=your_actual_api_key_here
AIML_BASE_URL=https://api.aimlapi.com/v1

# RECOMMENDED: Best for agentic workflows
AIML_MODEL=llama-3.3-70b-instruct

# Alternative Models:
# AIML_MODEL=deepseek-r1-distill-llama-70b  # Fast & efficient
# AIML_MODEL=deepseek-v3-0324-671b          # Maximum reasoning
# AIML_MODEL=llama3-70b-8192                # Large context
# AIML_MODEL=llama-3.1-8b-instruct          # Fast testing

# Email Service - Resend (optional)
RESEND_API_KEY=

# Gmail API Configuration (for Gmail integration)
# Get these from Google Cloud Console after Phase 1 setup
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Encryption key for storing OAuth tokens securely (generate a random string)
# You can generate one with: openssl rand -base64 32
OAUTH_ENCRYPTION_KEY=your_random_encryption_key_here
```

**IMPORTANT:** Replace `your_actual_api_key_here` with your real AI.ML API key!

---

## Step 2: Install Dependencies

```bash
npm install
```

---

## Step 3: Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## Step 4: Test Connection

Go to: http://localhost:3000/test-connection

Click **"Test Connection"** to verify your AI.ML setup works!

---

## ✅ You're Ready!

Once you see ✅ "Connection Successful!", you can proceed to Phase 2!

