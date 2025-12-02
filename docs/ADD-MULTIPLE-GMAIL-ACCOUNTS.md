# 📧 Adding Multiple Gmail Accounts

## Current Situation

✅ **Working:** `anish.jaidka@neevcloud.com`  
❌ **Not Working:** Other email addresses

## Why This Happens

Your OAuth app is in **"Testing"** mode, which means only emails in the **"Test users"** list can connect.

---

## ✅ Solution: Add More Test Users

### Step 1: Go to Google Cloud Console

1. Visit: [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**

### Step 2: Add Additional Emails

1. Scroll to **"Test users"** section
2. Click **"+ ADD USERS"**
3. Add each email address you want to use:
   - `user1@gmail.com`
   - `user2@example.com`
   - `another@email.com`
   - etc.
4. Click **"ADD"** after each email

### Step 3: Test Each Email

1. For each email you added:
   - Visit: `http://localhost:3000/api/auth/gmail`
   - Complete OAuth with that email
   - Should work! ✅

---

## 📋 Test Users List

You can add up to **100 test users** in Testing mode.

**Current Test Users:**
- ✅ `anish.jaidka@neevcloud.com`

**Add More:**
- Click "+ ADD USERS"
- Add email addresses
- Save

---

## 🔄 Alternative Solutions

### Option 1: Publish App (For Public Use)

If you want **anyone** to use your app:

1. Complete Google verification:
   - Privacy policy URL
   - Terms of service URL
   - App verification process
   - Can take days/weeks

2. Change app to **"In production"**

3. Anyone can then connect their Gmail

**Note:** This is for production apps, not recommended for development.

---

### Option 2: Internal Mode (Google Workspace Only)

If all emails are in the **same Google Workspace**:

1. In OAuth consent screen
2. Change **User Type** from **"External"** to **"Internal"**
3. All users in your Google Workspace can access
4. No need to add individual emails

**Note:** Only works if all emails are in the same Google Workspace organization.

---

## 🎯 Recommended Approach

### For Development/Testing:

**Keep in Testing mode** and add emails as needed:

1. Add emails to test users list
2. Up to 100 users allowed
3. Easy to manage
4. No verification needed

### For Production:

**Publish the app** (requires verification):
- Anyone can use it
- No user limit
- Requires Google verification

---

## 📝 Step-by-Step: Adding Test Users

### 1. Navigate to OAuth Consent Screen

```
Google Cloud Console
  → Your Project
  → APIs & Services
  → OAuth consent screen
```

### 2. Find Test Users Section

Scroll down to:
```
Test users
Only users listed here can access your app while it's in testing.
```

### 3. Add Emails

Click **"+ ADD USERS"** and add:
- `user1@gmail.com`
- `user2@example.com`
- `team@company.com`
- etc.

### 4. Save and Test

- Changes save automatically
- Wait 1-2 minutes
- Try OAuth with new emails

---

## 🔍 Verify Test Users

After adding, you should see:

```
Test users (3)
✓ anish.jaidka@neevcloud.com
✓ user1@gmail.com
✓ user2@example.com
```

---

## ⚠️ Important Notes

### Testing Mode Limits

- **Max 100 test users**
- Only listed emails can access
- Must add each email individually

### Email Format

- Use exact email addresses
- Case-sensitive in some cases
- Must be valid email format

### Propagation Time

- Changes take 1-2 minutes
- Try OAuth after waiting
- Clear browser cache if needed

---

## 🚀 Quick Checklist

To add a new email:

- [ ] Go to Google Cloud Console
- [ ] Navigate to OAuth consent screen
- [ ] Find "Test users" section
- [ ] Click "+ ADD USERS"
- [ ] Enter email address
- [ ] Click "ADD"
- [ ] Wait 1-2 minutes
- [ ] Try OAuth with new email
- [ ] Should work! ✅

---

## 💡 Pro Tips

1. **Add emails in bulk:**
   - Add multiple emails at once
   - Separate with commas (if supported)
   - Or add one by one

2. **Keep a list:**
   - Document which emails are added
   - Easier to manage later

3. **For team use:**
   - Add all team member emails
   - Everyone can test the app

---

## 🎯 Summary

**Current:** Only `anish.jaidka@neevcloud.com` works  
**Solution:** Add other emails to "Test users" list  
**Limit:** 100 test users max  
**Alternative:** Publish app (for public use) or use Internal mode (Google Workspace)

---

**Add the emails you need to the test users list, and they'll work!** 🚀


