# 🔧 Troubleshooting: Gmail "Insufficient Permission" Error

If you're getting an "Insufficient Permission" error when trying to send emails via Gmail, follow these steps:

---

## ❌ Error Message

```
{
  "success": false,
  "error": "Insufficient Permission",
  "message": "Failed to send email via Gmail: Insufficient Permission"
}
```

---

## 🔍 Common Causes

1. **Gmail API not enabled** in Google Cloud Console
2. **OAuth scopes not properly granted** during authentication
3. **Token needs refresh** with correct permissions
4. **OAuth consent screen** not properly configured

---

## ✅ Step-by-Step Fix

### Step 1: Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if needed)
3. Navigate to **APIs & Services** → **Library**
4. Search for **"Gmail API"**
5. Click on **Gmail API**
6. Click **Enable**
7. Wait for it to enable (usually takes a few seconds)

### Step 2: Verify OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Make sure:
   - **User Type** is set (Internal or External)
   - **App name** is filled
   - **User support email** is set
   - **Developer contact information** is set
3. Click **Save and Continue**

### Step 3: Verify OAuth Scopes

1. In **OAuth consent screen**, go to **Scopes** tab
2. Make sure these scopes are added:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/userinfo.email`
3. If not present, click **Add or Remove Scopes**
4. Search and add:
   - `gmail.send`
   - `userinfo.email`
5. Click **Update** → **Save and Continue**

### Step 4: Re-authenticate Gmail

**Important:** You need to disconnect and reconnect to get fresh tokens with proper permissions.

1. **Disconnect existing connection:**
   - Visit: `http://localhost:3000/api/auth/gmail/disconnect?userId=your-email@example.com`
   - Or delete the token file: `data/gmail-tokens.json`

2. **Reconnect Gmail:**
   - Visit: `http://localhost:3000/api/auth/gmail`
   - Complete the OAuth flow
   - **Make sure to grant all requested permissions** in the consent screen

3. **Verify connection:**
   - Visit: `http://localhost:3000/api/auth/gmail/status?userId=your-email@example.com`
   - Should show: `{"connected": true, "valid": true}`

### Step 5: Test Again

1. Run your workflow again
2. The Gmail tool should now work

---

## 🔍 Quick Diagnostic

Run this to check your Gmail connection status:

```bash
# Check if Gmail is connected
curl "http://localhost:3000/api/auth/gmail/status?userId=your-email@example.com"
```

**Expected response:**
```json
{
  "connected": true,
  "valid": true,
  "needsReauthentication": false,
  "email": "your-email@example.com"
}
```

If `needsReauthentication: true`, you need to reconnect.

---

## 📋 Checklist

Before testing, verify:

- [ ] Gmail API is **enabled** in Google Cloud Console
- [ ] OAuth consent screen is **configured**
- [ ] Required scopes are **added**:
  - [ ] `gmail.send`
  - [ ] `userinfo.email`
- [ ] Gmail account is **reconnected** (after enabling API)
- [ ] Environment variables are set:
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GOOGLE_REDIRECT_URI`
  - [ ] `OAUTH_ENCRYPTION_KEY`

---

## 🛠️ Manual Token Reset

If re-authentication doesn't work, manually reset:

1. **Stop the dev server**

2. **Delete token file:**
   ```bash
   # Windows PowerShell
   Remove-Item "data\gmail-tokens.json" -ErrorAction SilentlyContinue
   
   # Or manually delete: data/gmail-tokens.json
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Reconnect Gmail:**
   - Visit: `http://localhost:3000/api/auth/gmail`
   - Complete OAuth flow

---

## 🔐 Verify OAuth Credentials

Make sure your `.env.local` has:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
OAUTH_ENCRYPTION_KEY=your_encryption_key_here
```

**To get credentials:**
1. Go to Google Cloud Console
2. **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Authorized redirect URIs: `http://localhost:3000/api/auth/gmail/callback`
6. Copy **Client ID** and **Client Secret**

---

## 🐛 Still Not Working?

### Check Server Logs

Look for these in your terminal:

```
❌ Gmail tool error: [error details]
```

Common errors:
- `403 Forbidden` → Gmail API not enabled or wrong scopes
- `401 Unauthorized` → Token expired, need to reconnect
- `404 Not Found` → Gmail API not enabled

### Test Gmail API Directly

You can test if Gmail API works by checking the token:

```bash
# Get your access token from data/gmail-tokens.json
# Then test with curl:

curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://gmail.googleapis.com/gmail/v1/users/me/profile"
```

If this fails, the issue is with Gmail API setup, not the code.

---

## 📞 Need More Help?

1. **Check Google Cloud Console:**
   - Verify Gmail API is enabled
   - Check OAuth consent screen status
   - Verify credentials are correct

2. **Check Environment Variables:**
   - All Gmail-related env vars are set
   - No typos in values

3. **Check Token File:**
   - `data/gmail-tokens.json` exists
   - Contains valid encrypted tokens

4. **Re-authenticate:**
   - Disconnect old connection
   - Reconnect with fresh OAuth flow
   - Grant all permissions

---

## ✅ Success Indicators

When everything is working:

1. **Connection Status:**
   ```json
   {
     "connected": true,
     "valid": true,
     "needsReauthentication": false
   }
   ```

2. **Workflow Execution:**
   ```json
   {
     "success": true,
     "message": "Email sent successfully to user@example.com via Gmail",
     "messageId": "18c1234567890abcdef"
   }
   ```

3. **Email Received:**
   - Check your inbox for the test email
   - Email should be from your Gmail account

---

## 🎯 Quick Fix Summary

**Most common fix:**
1. Enable Gmail API in Google Cloud Console
2. Re-authenticate Gmail (disconnect + reconnect)
3. Test workflow again

That's it! 🚀

