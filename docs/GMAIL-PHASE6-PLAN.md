# 📬 Phase 6: Gmail Credential Management UI

## Overview

Build a user-friendly interface for managing Gmail connections, so users don't need to manually visit API endpoints or delete token files.

---

## 🎯 Goals

1. **Settings Page** - Central place to manage Gmail connections
2. **Status Display** - Show connection status clearly
3. **Easy Re-authentication** - One-click reconnect
4. **Error Handling** - Clear messages when tokens expire
5. **Integration** - Show Gmail status in Email Assistant and Workflow Builder

---

## 📋 What to Build

### 1. **Gmail Settings Page** (`/settings/gmail`)

**Features:**
- ✅ Connection status indicator
- ✅ Connected email address display
- ✅ Token validity status
- ✅ "Connect Gmail" button (if not connected)
- ✅ "Reconnect" button (if connected but expired)
- ✅ "Disconnect" button (if connected)
- ✅ Last connected/updated timestamp
- ✅ Error messages with helpful links

**UI Components:**
```
┌─────────────────────────────────────┐
│  Gmail Settings                     │
├─────────────────────────────────────┤
│                                     │
│  Status: ✅ Connected              │
│  Email: user@example.com            │
│  Token: Valid (expires in 1 hour)  │
│                                     │
│  [Reconnect] [Disconnect]           │
│                                     │
│  Last updated: 2 hours ago         │
└─────────────────────────────────────┘
```

### 2. **Homepage Integration**

Add Gmail connection status to homepage:
- Show "Connect Gmail" button if not connected
- Show "Gmail Connected" badge if connected
- Link to settings page

### 3. **Email Assistant Integration**

In `/email-assistant`:
- Show Gmail connection status
- Disable Gmail tool if not connected
- Show "Connect Gmail" prompt if needed
- Display which email account will be used

### 4. **Workflow Builder Integration**

In Agent Node configuration:
- Show Gmail tool availability
- Display warning if Gmail not connected
- Link to connect Gmail
- Show which account will be used

---

## 🛠️ Implementation Steps

### Step 1: Create Settings Page

**File:** `app/settings/gmail/page.tsx`

**Features:**
- Fetch Gmail status from API
- Display connection info
- Handle connect/disconnect actions
- Show error states
- Auto-refresh status

### Step 2: Update Homepage

**File:** `app/page.tsx`

**Changes:**
- Add Gmail connection status check
- Show connection badge/button
- Link to settings page

### Step 3: Update Email Assistant

**File:** `app/email-assistant/page.tsx`

**Changes:**
- Check Gmail status on load
- Show connection prompt if needed
- Disable Gmail option if not connected
- Show connected email address

### Step 4: Update Workflow Builder

**File:** `components/NodeConfig.tsx`

**Changes:**
- Check Gmail status when showing tools
- Show warning for Gmail tool if not connected
- Add "Connect Gmail" link
- Disable Gmail tool checkbox if not connected

### Step 5: Create Status Component

**File:** `components/GmailStatus.tsx`

**Reusable component:**
- Shows Gmail connection status
- Can be used in multiple places
- Handles loading/error states

---

## 📊 API Endpoints Needed

All endpoints already exist:
- ✅ `GET /api/auth/gmail/status?userId=...` - Check status
- ✅ `GET /api/auth/gmail` - Start OAuth flow
- ✅ `DELETE /api/auth/gmail/disconnect?userId=...` - Disconnect

---

## 🎨 UI Mockups

### Settings Page

```
┌─────────────────────────────────────────────┐
│  ← Back to Home    Gmail Settings           │
├─────────────────────────────────────────────┤
│                                             │
│  📬 Gmail Connection                        │
│                                             │
│  Status: ✅ Connected                       │
│  Email: anish.jaidka@neevcloud.com         │
│  Token: Valid (expires in 45 minutes)       │
│                                             │
│  Last updated: 2 hours ago                 │
│                                             │
│  [Reconnect Gmail]  [Disconnect]           │
│                                             │
│  ────────────────────────────────────────  │
│                                             │
│  ℹ️  Gmail allows you to send emails       │
│     directly from your Gmail account        │
│     using the Gmail API.                    │
│                                             │
└─────────────────────────────────────────────┘
```

### Not Connected State

```
┌─────────────────────────────────────────────┐
│  📬 Gmail Connection                        │
├─────────────────────────────────────────────┤
│                                             │
│  Status: ❌ Not Connected                   │
│                                             │
│  To use Gmail in workflows, you need to    │
│  connect your Gmail account.                │
│                                             │
│  [Connect Gmail]                           │
│                                             │
│  ────────────────────────────────────────  │
│                                             │
│  What this does:                           │
│  • Grants permission to send emails        │
│  • Stores encrypted OAuth tokens           │
│  • Enables Gmail tool in workflows         │
│                                             │
└─────────────────────────────────────────────┘
```

### Expired Token State

```
┌─────────────────────────────────────────────┐
│  📬 Gmail Connection                        │
├─────────────────────────────────────────────┤
│                                             │
│  Status: ⚠️  Token Expired                  │
│  Email: anish.jaidka@neevcloud.com         │
│                                             │
│  Your Gmail connection has expired.        │
│  Please reconnect to continue using Gmail. │
│                                             │
│  [Reconnect Gmail]  [Disconnect]           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### Status Component Props

```typescript
interface GmailStatusProps {
  userId?: string; // Optional, auto-detects if not provided
  showActions?: boolean; // Show connect/disconnect buttons
  compact?: boolean; // Compact display mode
}
```

### Status API Response

```typescript
{
  connected: boolean;
  valid: boolean;
  needsReauthentication: boolean;
  email: string;
  expiresAt: number | null;
}
```

---

## ✅ Success Criteria

1. ✅ Users can see Gmail connection status
2. ✅ Users can connect Gmail from UI
3. ✅ Users can disconnect Gmail from UI
4. ✅ Users see clear error messages
5. ✅ Gmail status shown in relevant places
6. ✅ No need to manually visit API endpoints

---

## 🚀 Benefits

1. **Better UX** - No more manual API calls
2. **Clear Status** - Users know connection state
3. **Easy Management** - One place to manage Gmail
4. **Error Prevention** - Clear warnings before errors
5. **Professional** - Polished, production-ready feature

---

## 📝 Implementation Checklist

- [ ] Create `/settings/gmail` page
- [ ] Create `GmailStatus` component
- [ ] Update homepage with Gmail status
- [ ] Update Email Assistant with Gmail status
- [ ] Update Workflow Builder with Gmail warnings
- [ ] Add error handling and messages
- [ ] Test connect/disconnect flows
- [ ] Test error states
- [ ] Add loading states
- [ ] Polish UI/UX

---

## 🎯 Next Steps After Phase 6

- **Phase 7**: Multiple Gmail accounts support
- **Phase 8**: Gmail read capabilities (inbox, search)
- **Phase 9**: Email templates
- **Phase 10**: Scheduled email sending

---

**Phase 6 will make Gmail integration user-friendly and production-ready!** 🚀


