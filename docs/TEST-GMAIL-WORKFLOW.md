# 📬 Testing Gmail Tool in Workflows

This guide will walk you through testing the Gmail tool in a workflow.

---

## ✅ Prerequisites

1. **Gmail Account Connected**
   - Visit: `http://localhost:3000/`
   - Click "Connect Gmail" or visit `/api/auth/gmail`
   - Complete OAuth flow
   - Verify connection status shows your email

2. **Dev Server Running**
   ```bash
   npm run dev
   ```

---

## 🚀 Step-by-Step Testing Guide

### Step 1: Create a New Workflow

1. Go to: `http://localhost:3000/workflows/new`
2. You'll see an empty workflow canvas

### Step 2: Add a Trigger Node

1. Click the **"+"** button (Node Palette) in the bottom-right
2. Select **"Trigger"** node
3. Click on the canvas to place it
4. Click the trigger node to configure it:
   - **Label**: "Start"
   - **Trigger Data**: 
     ```json
     {
       "message": "Send a test email to your-email@gmail.com"
     }
     ```
   - Click **"Save"**

### Step 3: Add an Agent Node

1. Click the **"+"** button again
2. Select **"AI Agent"** node
3. Click on the canvas (to the right of the trigger)
4. Connect the trigger to the agent:
   - Drag from the trigger node's output handle
   - Connect to the agent node's input handle

### Step 4: Configure Agent Node with Gmail Tool

1. **Click the Agent node** to open configuration
2. **System Prompt** (optional):
   ```
   You are a helpful email assistant. When asked to send emails, use the Gmail tool.
   ```
3. **Prompt**:
   ```
   {{trigger.message}}
   ```
   (This will use the message from the trigger node)

4. **Available Tools** section:
   - ✅ Check **"📬 Send Gmail"** tool
   - You can also enable other tools like:
     - 🔍 Web Search
     - 🔢 Calculator
     - etc.

5. **Memory** (optional):
   - Enable if you want conversation memory
   - Leave Conversation ID empty for auto-generation

6. Click **"Save"**

### Step 5: Save the Workflow

1. Enter a **Workflow Name**: "Test Gmail Workflow"
2. Click **"Save"** button (top-right)
3. Wait for confirmation: "Workflow saved successfully!"

### Step 6: Execute the Workflow

1. Click **"Execute"** button (green button, top-right)
2. You'll be redirected to the execution page
3. **Trigger Data** (pre-filled from trigger node):
   ```json
   {
     "message": "Send a test email to your-email@gmail.com"
   }
   ```
4. Click **"Execute Workflow"**

### Step 7: Watch the Execution

1. You'll see real-time execution logs:
   - ✅ Trigger node executes
   - 🤖 Agent node starts
   - 📬 Agent uses `send_gmail` tool
   - ✅ Email sent successfully

2. **Check the Results**:
   - Agent output will show email sent confirmation
   - Tool calls section shows Gmail API call details
   - Check your email inbox for the message!

---

## 📋 Example Workflow Configurations

### Example 1: Simple Email Sending

**Trigger Node:**
- Label: "Email Request"
- Trigger Data:
  ```json
  {
    "recipient": "test@example.com",
    "subject": "Test Email",
    "body": "This is a test email from the workflow!"
  }
  ```

**Agent Node:**
- Prompt:
  ```
  Send an email to {{trigger.recipient}} with subject "{{trigger.subject}}" and body "{{trigger.body}}"
  ```
- Tools: ✅ Send Gmail

### Example 2: Email with Web Search

**Trigger Node:**
- Label: "Research & Email"
- Trigger Data:
  ```json
  {
    "topic": "latest AI news",
    "recipient": "user@example.com"
  }
  ```

**Agent Node:**
- Prompt:
  ```
  Search the web for "{{trigger.topic}}" and send a summary email to {{trigger.recipient}}
  ```
- Tools: ✅ Send Gmail, ✅ Web Search

### Example 3: Conditional Email

**Trigger Node:**
- Label: "Data Input"
- Trigger Data:
  ```json
  {
    "value": 100,
    "recipient": "admin@example.com"
  }
  ```

**Agent Node:**
- Prompt:
  ```
  If the value {{trigger.value}} is greater than 50, send an email to {{trigger.recipient}} saying "Value is high: {{trigger.value}}"
  ```
- Tools: ✅ Send Gmail, ✅ Calculator

---

## 🔍 Troubleshooting

### Issue: "No Gmail account connected"

**Solution:**
1. Go to `http://localhost:3000/`
2. Click "Connect Gmail"
3. Complete OAuth flow
4. Verify connection status

### Issue: "Gmail tool not showing in tools list"

**Solution:**
1. Check that `send_gmail` is in `lib/langchain/tools/tool-metadata.ts`
2. Restart dev server: `npm run dev`
3. Clear browser cache

### Issue: "Email not sending"

**Solution:**
1. Check Gmail connection status: `/api/auth/gmail/status`
2. Verify OAuth tokens are valid
3. Check server logs for errors
4. Ensure recipient email is valid

### Issue: "Agent not using Gmail tool"

**Solution:**
1. Verify tool is checked in Agent node config
2. Make prompt explicit: "Use the Gmail tool to send..."
3. Check agent reasoning logs to see why it chose/didn't choose the tool

---

## 📊 Expected Output

When the workflow executes successfully, you should see:

```json
{
  "output": "I've successfully sent an email to your-email@gmail.com with the subject 'Test Email' and your message.",
  "reasoning": [
    "User wants to send an email",
    "Using send_gmail tool with recipient, subject, and body",
    "Email sent successfully via Gmail API"
  ],
  "toolCalls": [
    {
      "toolName": "send_gmail",
      "parameters": {
        "to": "your-email@gmail.com",
        "subject": "Test Email",
        "body": "This is a test email from the workflow!"
      },
      "result": {
        "success": true,
        "messageId": "18c1234567890abcdef"
      }
    }
  ]
}
```

---

## 🎯 Next Steps

1. **Test with different prompts** - Try various email scenarios
2. **Combine with other tools** - Use Gmail + Web Search, Calculator, etc.
3. **Add more nodes** - Create complex workflows with multiple agents
4. **Use memory** - Enable conversation memory for multi-step email workflows

---

## 💡 Tips

- **Be explicit in prompts**: "Use the Gmail tool to send an email..."
- **Test with your own email first**: Use a real email you can check
- **Check execution logs**: They show detailed tool usage
- **Use variables**: Reference previous node outputs with `{{nodeName.field}}`

---

Happy testing! 🚀

