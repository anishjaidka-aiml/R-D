# 🔧 Fix: OAuth "access_denied" Error

## Problem

You're seeing this error:
```
Error 403: access_denied
NeevCloud Agent has not completed the Google verification process.
The app is currently being tested, and can only be accessed by developer-approved testers.
```

## Cause

Your OAuth consent screen is in **"Testing"** mode, which means only approved test users can access it.

---

## ✅ Solution: Add Test Users

### Step 1: Go to Google Cloud Console

1. Visit: [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**

### Step 2: Add Test Users

1. Scroll down to **"Test users"** section
2. Click **"+ ADD USERS"**
3. Add your email address: `anish.jaidka@neevcloud.com`
4. Add any other emails that need access
5. Click **"ADD"**

### Step 3: Try Again

1. Go back to your app
2. Visit: `http://localhost:3000/api/auth/gmail`
3. Complete OAuth flow
4. Should work now! ✅

---

## 🔄 Alternative: Change to Internal (Google Workspace Only)

If you're using a Google Workspace account and want all users in your organization to access:

1. In **OAuth consent screen**
2. Change **User Type** from **"External"** to **"Internal"**
3. Save
4. All users in your Google Workspace can now access

**Note:** This only works for Google Workspace accounts, not personal Gmail.

---

## 📋 Step-by-Step with Screenshots

### 1. Navigate to OAuth Consent Screen

```
Google Cloud Console
  → Select Project
  → APIs & Services
  → OAuth consent screen
```

### 2. Find Test Users Section

Scroll down until you see:
```
Test users
Only users listed here can access your app while it's in testing.
```

### 3. Add Your Email

- Click **"+ ADD USERS"**
- Enter: `anish.jaidka@neevcloud.com`
- Click **"ADD"**

### 4. Verify

You should see your email in the test users list:
```
Test users (1)
anish.jaidka@neevcloud.com
```

---

## 🚀 Quick Fix Summary

**The Problem:**
- OAuth app is in "Testing" mode
- Your email isn't in the test users list

**The Fix:**
1. Go to Google Cloud Console
2. APIs & Services → OAuth consent screen
3. Add your email to "Test users"
4. Try OAuth again

---

## ⚠️ Important Notes

### Testing Mode Limitations

- **Max 100 test users** can be added
- Only listed users can access
- App must be verified for public use

### For Production

If you want anyone to use your app:
1. Complete Google verification process
2. Change app to "In production"
3. This requires:
   - Privacy policy URL
   - Terms of service URL
   - App verification by Google
   - Can take several days/weeks

### For Development/Testing

**Recommended:** Keep in "Testing" mode and add test users as needed.

---

## 🎯 After Adding Test Users

1. **Clear browser cache** (optional but recommended)
2. **Try OAuth again:**
   - Visit: `http://localhost:3000/api/auth/gmail`
   - Should work now! ✅

---

## 📞 Still Having Issues?

### Check These:

1. **Email matches exactly:**
   - Use the exact email you'll use for OAuth
   - Case-sensitive in some cases

2. **Wait a few minutes:**
   - Changes can take 1-2 minutes to propagate

3. **Try incognito/private window:**
   - Clears any cached OAuth state

4. **Check OAuth consent screen status:**
   - Should show "Testing" mode
   - Test users list should include your email

---

## ✅ Success Indicators

After adding your email, you should:
- ✅ See consent screen (not error)
- ✅ Be able to grant permissions
- ✅ Complete OAuth flow
- ✅ Gmail connection works

---

**That's it! Add your email to test users and try again.** 🚀


