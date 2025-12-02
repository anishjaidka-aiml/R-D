# 🔧 Fix: Gmail "Insufficient Permission" - Scope Issue

## Problem

The error shows:
```
"reason": "ACCESS_TOKEN_SCOPE_INSUFFICIENT"
"method": "caribou.api.proto.MailboxService.GetProfile"
```

This means the token doesn't have the required Gmail scopes.

## ✅ Solution

### Step 1: Delete Old Token

The current token was obtained without proper scopes. Delete it:

**Option A: Via API (Recommended)**
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/gmail/disconnect?userId=anish.jaidka@neevcloud.com" -Method DELETE
```

**Option B: Manual Delete**
1. Stop the dev server (Ctrl+C)
2. Delete the file: `data/gmail-tokens.json`
3. Restart dev server: `npm run dev`

### Step 2: Re-authenticate

1. Visit: `http://localhost:3000/api/auth/gmail`
2. Complete OAuth flow
3. **IMPORTANT:** Make sure to grant ALL permissions when Google asks:
   - ✅ Send email on your behalf
   - ✅ View your email address
4. You'll be redirected back with a success message

### Step 3: Verify Connection

Check status:
```
http://localhost:3000/api/auth/gmail/status?userId=anish.jaidka@neevcloud.com
```

Should show:
```json
{
  "connected": true,
  "valid": true,
  "needsReauthentication": false
}
```

### Step 4: Test Again

Run your workflow again - it should work now!

---

## 🔍 What Was Fixed

1. **Removed unnecessary API call**: The code was calling `gmail.users.getProfile()` which requires additional scopes. Now it uses the email address we already have from OAuth.

2. **Better error messages**: More specific error details to help diagnose issues.

---

## ⚠️ Important Notes

- **Always grant all permissions** during OAuth flow
- **Delete old tokens** before re-authenticating if you get scope errors
- The token must have `gmail.send` scope to send emails

---

## 🚀 Quick Fix Command

Run this in PowerShell to disconnect and then re-authenticate:

```powershell
# Disconnect
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/gmail/disconnect?userId=anish.jaidka@neevcloud.com" -Method DELETE

# Then visit in browser:
# http://localhost:3000/api/auth/gmail
```

---

After re-authenticating, your workflow should work! 🎉

