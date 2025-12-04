# 📧 How Gmail API Configuration Was Implemented

This document explains the complete Gmail API integration, including OAuth 2.0 flow, token management, and secure storage.

---

## 🏗️ Architecture Overview

The Gmail API integration consists of **5 main components**:

1. **OAuth Client** (`lib/gmail/oauth-client.ts`) - Handles OAuth 2.0 flow
2. **Token Storage** (`lib/gmail/token-storage.ts`) - Encrypted token storage
3. **Token Refresh** (`lib/gmail/token-refresh.ts`) - Automatic token refresh
4. **API Routes** (`app/api/auth/gmail/*`) - OAuth endpoints
5. **Gmail Tool** (`lib/langchain/tools/gmail-tool.ts`) - LangChain tool for agents

---

## 🔐 Step 1: Environment Configuration

### Required Environment Variables

Add these to your `.env.local` file:

```env
# Gmail API Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Encryption key for storing OAuth tokens securely
# Generate with: openssl rand -base64 32
OAUTH_ENCRYPTION_KEY=your_random_encryption_key_here
```

### How to Get Google Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**
3. **Enable Gmail API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/gmail/callback`
   - Copy `Client ID` and `Client Secret`

---

## 🔄 Step 2: OAuth 2.0 Flow Implementation

### 2.1 OAuth Client (`lib/gmail/oauth-client.ts`)

**Purpose**: Manages OAuth 2.0 authentication flow

**Key Functions**:

```typescript
// 1. Get OAuth2 client instance
getOAuth2Client() {
  // Creates Google OAuth2 client with credentials from env
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

// 2. Generate authorization URL
getAuthUrl(state?: string): string {
  // Returns Google consent screen URL
  // Scopes requested:
  // - gmail.send (send emails)
  // - userinfo.email (get user email)
}

// 3. Exchange code for tokens
exchangeCodeForTokens(code: string) {
  // Converts authorization code → access token + refresh token
  // Returns: { accessToken, refreshToken, expiresAt }
}

// 4. Refresh access token
refreshAccessToken(refreshToken: string) {
  // Uses refresh token to get new access token
  // Returns: { accessToken, expiresAt }
}

// 5. Get user info
getUserInfo(accessToken: string) {
  // Gets user email from Google OAuth2 API
  // Returns: { email, name? }
}
```

**How It Works**:
- Uses `googleapis` library for OAuth
- Requests `offline` access to get refresh token
- Forces `consent` screen to ensure refresh token is granted
- Handles token expiration (1 hour default)

---

### 2.2 API Routes

#### **Initiate OAuth** (`app/api/auth/gmail/route.ts`)

**Endpoint**: `GET /api/auth/gmail`

**What It Does**:
1. Generates OAuth authorization URL
2. Redirects user to Google consent screen
3. User grants permissions
4. Google redirects back with authorization code

**Flow**:
```
User clicks "Connect Gmail"
  ↓
GET /api/auth/gmail
  ↓
Redirects to Google consent screen
  ↓
User grants permissions
  ↓
Google redirects to /api/auth/gmail/callback?code=...
```

#### **OAuth Callback** (`app/api/auth/gmail/callback/route.ts`)

**Endpoint**: `GET /api/auth/gmail/callback`

**What It Does**:
1. Receives authorization code from Google
2. Exchanges code for access token + refresh token
3. Gets user email from Google
4. Encrypts and stores tokens securely
5. Redirects user to success page

**Flow**:
```
Google redirects with code
  ↓
GET /api/auth/gmail/callback?code=...
  ↓
Exchange code → tokens
  ↓
Get user email
  ↓
Encrypt & save tokens
  ↓
Redirect to success page
```

---

## 🔒 Step 3: Secure Token Storage

### 3.1 Token Storage (`lib/gmail/token-storage.ts`)

**Purpose**: Securely store OAuth tokens with encryption

**Storage Location**: `data/gmail-tokens.json`

**Security Features**:
- ✅ **Encryption**: Tokens encrypted using AES (CryptoJS)
- ✅ **Encryption Key**: From `OAUTH_ENCRYPTION_KEY` env variable
- ✅ **File-based**: JSON file in `data/` directory (gitignored)

**Data Structure**:

```typescript
interface GmailTokenData {
  userId: string;           // Email address
  accessToken: string;      // Encrypted
  refreshToken: string;     // Encrypted
  expiresAt: number;        // Unix timestamp
  createdAt: number;        // Unix timestamp
  updatedAt: number;        // Unix timestamp
}
```

**Key Functions**:

```typescript
// Save token (encrypts before storing)
saveToken(tokenData: GmailTokenData)

// Get token (decrypts when reading)
getToken(userId: string): Promise<GmailTokenData | null>

// Delete token
deleteToken(userId: string)

// Check if token is valid
hasValidToken(userId: string): Promise<boolean>

// Get all user IDs
getAllUserIds(): Promise<string[]>
```

**How Encryption Works**:
1. **Saving**: `encrypt(token)` → stores encrypted string
2. **Reading**: `decrypt(encryptedString)` → returns original token
3. **Key**: Uses `OAUTH_ENCRYPTION_KEY` from environment

---

### 3.2 Token Refresh (`lib/gmail/token-refresh.ts`)

**Purpose**: Automatically refresh expired access tokens

**How It Works**:

```typescript
getValidAccessToken(userId: string) {
  1. Get stored token
  2. Check if expired
  3. If expired:
     - Use refresh token to get new access token
     - Update stored token
     - Return new access token
  4. If valid:
     - Return existing access token
}
```

**Token Expiration**:
- **Access Token**: Expires in ~1 hour
- **Refresh Token**: Never expires (unless revoked)
- **Buffer**: 5-minute buffer before expiration

**Automatic Refresh**:
- Happens automatically when token is used
- No user action required
- Seamless experience

---

## 🛠️ Step 4: Gmail Tool Integration

### 4.1 Gmail Tool (`lib/langchain/tools/gmail-tool.ts`)

**Purpose**: LangChain tool that allows agents to send emails via Gmail

**Tool Schema**:

```typescript
{
  name: "send_gmail",
  description: "Send an email using Gmail...",
  schema: {
    to: string (email),
    subject: string,
    body: string,
    userId?: string (optional email)
  }
}
```

**How It Works**:

1. **Get Access Token**:
   ```typescript
   const accessToken = await getValidAccessToken(userId);
   // Auto-refreshes if expired
   ```

2. **Create Gmail Client**:
   ```typescript
   const oauth2Client = getOAuth2Client();
   oauth2Client.setCredentials({ access_token: accessToken });
   const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
   ```

3. **Format Email**:
   - Converts plain text → HTML
   - Creates RFC 2822 message
   - Encodes to base64url (Gmail API requirement)

4. **Send Email**:
   ```typescript
   await gmail.users.messages.send({
     userId: 'me',
     requestBody: { raw: rawMessage }
   });
   ```

**Error Handling**:
- ✅ Checks if Gmail is connected
- ✅ Handles token expiration
- ✅ Provides helpful error messages
- ✅ Handles permission errors (403)
- ✅ Handles authentication errors (401)

---

## 🎨 Step 5: UI Components

### 5.1 Gmail Status Component (`components/GmailStatus.tsx`)

**Purpose**: Display Gmail connection status

**Features**:
- ✅ Shows connection status (Connected/Expired/Not Connected)
- ✅ Displays email address
- ✅ Shows token expiration time
- ✅ Connect/Reconnect/Disconnect buttons
- ✅ Auto-refresh capability

**Usage**:
```tsx
// Full mode with actions
<GmailStatus showActions={true} />

// Compact mode (badge)
<GmailStatus compact={true} />

// Check specific account
<GmailStatus userId="user@example.com" />
```

### 5.2 Gmail Settings Page (`app/settings/gmail/page.tsx`)

**Purpose**: Central place to manage Gmail connections

**Features**:
- ✅ Full Gmail status display
- ✅ Connect/Reconnect/Disconnect actions
- ✅ Check specific account by email
- ✅ Troubleshooting guide
- ✅ Information about Gmail integration

**Access**: `http://localhost:3000/settings/gmail`

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INITIATES CONNECTION                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  GET /api/auth/gmail                                        │
│  - Generates OAuth URL                                      │
│  - Redirects to Google consent screen                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  GOOGLE CONSENT SCREEN                                      │
│  - User grants permissions                                  │
│  - Google redirects with authorization code                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  GET /api/auth/gmail/callback?code=...                      │
│  - Exchanges code → tokens                                  │
│  - Gets user email                                          │
│  - Encrypts tokens                                          │
│  - Saves to data/gmail-tokens.json                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  TOKEN STORAGE (Encrypted)                                  │
│  data/gmail-tokens.json:                                    │
│  {                                                           │
│    userId: "user@example.com",                              │
│    encryptedAccessToken: "...",                             │
│    encryptedRefreshToken: "...",                            │
│    expiresAt: 1234567890                                    │
│  }                                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT USES GMAIL TOOL                                      │
│  send_gmail({ to, subject, body })                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  TOKEN REFRESH (if expired)                                 │
│  - Checks if token expired                                  │
│  - Uses refresh token to get new access token              │
│  - Updates stored token                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  GMAIL API CALL                                             │
│  - Creates Gmail client with access token                   │
│  - Formats email (RFC 2822, base64url)                      │
│  - Sends via gmail.users.messages.send()                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  EMAIL SENT ✅                                              │
│  Returns: { success: true, messageId: "..." }               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Key Implementation Details

### 1. **OAuth Scopes**

```typescript
const scopes = [
  'https://www.googleapis.com/auth/gmail.send',  // Send emails
  'https://www.googleapis.com/auth/userinfo.email', // Get user email
];
```

### 2. **Token Expiration**

- **Access Token**: 1 hour (3600 seconds)
- **Refresh Token**: Never expires (unless revoked)
- **Buffer**: 5 minutes before expiration

### 3. **Encryption**

- **Algorithm**: AES (CryptoJS)
- **Key**: `OAUTH_ENCRYPTION_KEY` from environment
- **Storage**: Encrypted tokens in JSON file

### 4. **Email Format**

- **Format**: RFC 2822
- **Encoding**: base64url (Gmail API requirement)
- **Body**: HTML formatted (plain text converted)

### 5. **Error Handling**

- ✅ Checks Gmail connection status
- ✅ Handles token expiration
- ✅ Provides helpful error messages
- ✅ Handles permission errors (403)
- ✅ Handles authentication errors (401)

---

## 🚀 Usage in Workflows

### Example: Agent Node Configuration

```json
{
  "type": "agent",
  "config": {
    "prompt": "You are an email assistant. Use the Gmail tool to send emails.",
    "tools": ["send_gmail"]
  }
}
```

### Example: Workflow Execution

```typescript
// Agent calls send_gmail tool
{
  tool: "send_gmail",
  parameters: {
    to: "recipient@example.com",
    subject: "Hello",
    body: "This is a test email"
  }
}
```

---

## 📝 Summary

**What Was Built**:

1. ✅ **OAuth 2.0 Flow**: Complete Google OAuth integration
2. ✅ **Token Storage**: Encrypted, secure token storage
3. ✅ **Token Refresh**: Automatic token refresh mechanism
4. ✅ **Gmail Tool**: LangChain tool for sending emails
5. ✅ **UI Components**: Status display and settings page
6. ✅ **API Routes**: OAuth initiation and callback endpoints
7. ✅ **Error Handling**: Comprehensive error handling

**Security Features**:

- ✅ Tokens encrypted at rest
- ✅ OAuth 2.0 secure flow
- ✅ Refresh token rotation
- ✅ Token expiration handling
- ✅ Secure file storage (gitignored)

**User Experience**:

- ✅ One-click Gmail connection
- ✅ Automatic token refresh
- ✅ Clear status indicators
- ✅ Easy disconnect option
- ✅ Helpful error messages

---

## 🔗 Related Files

- `lib/gmail/oauth-client.ts` - OAuth client
- `lib/gmail/token-storage.ts` - Token storage
- `lib/gmail/token-refresh.ts` - Token refresh
- `app/api/auth/gmail/route.ts` - OAuth initiation
- `app/api/auth/gmail/callback/route.ts` - OAuth callback
- `lib/langchain/tools/gmail-tool.ts` - Gmail tool
- `components/GmailStatus.tsx` - Status component
- `app/settings/gmail/page.tsx` - Settings page

---

## 📚 Additional Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Troubleshooting Guide](./TROUBLESHOOTING-GMAIL-PERMISSIONS.md)
- [Gmail Phase 6 Complete](./GMAIL-PHASE6-COMPLETE.md)

