# 🤖 Agent Node Configuration Guide

Complete guide for configuring the Agent Node in workflows, specifically for testing the Gmail tool.

---

## 📋 Agent Node Fields Explained

### 1. **System Prompt** (Optional but Recommended)
**Purpose:** Sets the agent's role, behavior, and instructions on how to use tools.

**What it does:**
- Defines the agent's personality and capabilities
- Instructs the agent on when and how to use tools
- Provides context for the agent's responses

### 2. **Prompt** (Required)
**Purpose:** The actual task or question for the agent to complete.

**What it does:**
- Contains the specific instruction or question
- Can reference data from previous nodes using `{{nodeName.field}}`
- This is what the agent will try to accomplish

### 3. **Available Tools** (Required for tool usage)
**Purpose:** Select which tools the agent can use to complete the task.

**What it does:**
- Enables specific tools for the agent
- Agent can only use tools that are checked
- Each tool has a specific purpose (Gmail, Search, Calculator, etc.)

---

## 📧 Example 1: Simple Gmail Test

### **System Prompt:**
```
You are a helpful email assistant. When asked to send emails, use the Gmail tool (send_gmail). Always include a clear subject and body in your emails.
```

### **Prompt:**
```
Send an email to test@example.com with subject "Test Email" and body "This is a test email from the workflow!"
```

### **Available Tools:**
- ✅ **📬 Send Gmail** (Check this!)

---

## 📧 Example 2: Using Trigger Data

**Assuming your Trigger Node has:**
```json
{
  "recipient": "user@example.com",
  "subject": "Workflow Test",
  "body": "This email was sent from a workflow!"
}
```

### **System Prompt:**
```
You are an email automation assistant. Use the Gmail tool to send emails when requested. Always format emails professionally.
```

### **Prompt:**
```
Send an email to {{trigger.recipient}} with subject "{{trigger.subject}}" and body "{{trigger.body}}"
```

### **Available Tools:**
- ✅ **📬 Send Gmail**

---

## 📧 Example 3: Research & Email

### **System Prompt:**
```
You are a research assistant. When asked to research a topic and send results via email, first use the web search tool to gather information, then use the Gmail tool to send a summary email.
```

### **Prompt:**
```
Search the web for "latest AI news" and send a summary email to admin@example.com with subject "AI News Summary" containing the key findings.
```

### **Available Tools:**
- ✅ **📬 Send Gmail**
- ✅ **🔍 Web Search**

---

## 📧 Example 4: Calculate & Email Result

### **System Prompt:**
```
You are a calculation assistant. When asked to perform calculations and email results, use the calculator tool first, then send the result via Gmail.
```

### **Prompt:**
```
Calculate 25 * 17 + 100 and send the result to user@example.com in an email with subject "Calculation Result".
```

### **Available Tools:**
- ✅ **📬 Send Gmail**
- ✅ **🔢 Calculator**

---

## 📧 Example 5: Complete Workflow with Trigger

**Trigger Node Data:**
```json
{
  "to": "customer@example.com",
  "subject": "Order Confirmation",
  "message": "Your order has been confirmed!"
}
```

### **System Prompt:**
```
You are a professional email assistant. Always use the Gmail tool when sending emails. Format emails clearly with proper subject lines and body content.
```

### **Prompt:**
```
Send a professional email to {{trigger.to}} with subject "{{trigger.subject}}" and body "{{trigger.message}}"
```

### **Available Tools:**
- ✅ **📬 Send Gmail**

---

## 🎯 Quick Start Template (Copy-Paste Ready)

### **System Prompt:**
```
You are a helpful email assistant. Use the Gmail tool (send_gmail) to send emails when requested. Always include clear subject and body content.
```

### **Prompt:**
```
Send an email to your-email@gmail.com with subject "Test from Workflow" and body "This is a test email sent from a workflow using the Gmail tool!"
```

### **Available Tools:**
- ✅ **📬 Send Gmail** (Check this box!)

---

## 💡 System Prompt Best Practices

### ✅ Good System Prompts:
- **Clear role definition:** "You are a [role]..."
- **Tool usage instructions:** "Use the Gmail tool when..."
- **Behavior guidelines:** "Always format emails professionally"
- **Specific instructions:** "Include subject and body in all emails"

### ❌ Avoid:
- Vague instructions: "Be helpful"
- No tool mention: Doesn't tell agent to use Gmail tool
- Too long: Keep it concise and focused

### Examples:

**✅ Good:**
```
You are an email automation assistant. When asked to send emails, use the Gmail tool (send_gmail). Always include a clear subject and body.
```

**❌ Bad:**
```
Help with emails
```

---

## 💡 Prompt Best Practices

### ✅ Good Prompts:
- **Explicit instructions:** "Send an email to..."
- **Clear parameters:** Include recipient, subject, body
- **Use variables:** `{{trigger.field}}` to reference previous nodes
- **Specific tasks:** "Send email with subject X and body Y"

### ❌ Avoid:
- Vague requests: "Send something"
- Missing details: "Email someone"
- No tool mention: Doesn't explicitly ask to use Gmail

### Examples:

**✅ Good:**
```
Send an email to {{trigger.recipient}} with subject "{{trigger.subject}}" and body "{{trigger.body}}"
```

**✅ Also Good:**
```
Send a test email to user@example.com with subject "Hello" and body "This is a test!"
```

**❌ Bad:**
```
Email someone
```

---

## 🛠️ Available Tools Guide

### **📬 Send Gmail**
- **When to use:** Always check this when you want to send emails
- **Requires:** Gmail account connected via OAuth
- **What it does:** Sends emails using Gmail API

### **📧 Send Email (Resend)**
- **When to use:** Alternative to Gmail (uses Resend API)
- **Requires:** Resend API key configured
- **What it does:** Sends emails via Resend service

### **🔍 Web Search**
- **When to use:** Need to search the web for information
- **Requires:** Nothing (free)
- **What it does:** Searches DuckDuckGo and returns results

### **🔢 Calculator**
- **When to use:** Need to perform calculations
- **Requires:** Nothing
- **What it does:** Evaluates mathematical expressions

### **🌐 HTTP Request**
- **When to use:** Need to call external APIs
- **Requires:** Nothing
- **What it does:** Makes HTTP requests (GET, POST, etc.)

---

## 🎯 Common Patterns

### Pattern 1: Simple Email
**System Prompt:** Email assistant instructions  
**Prompt:** Direct email instruction  
**Tools:** ✅ Send Gmail

### Pattern 2: Email with Data
**System Prompt:** Email assistant instructions  
**Prompt:** Use `{{trigger.field}}` variables  
**Tools:** ✅ Send Gmail

### Pattern 3: Research & Email
**System Prompt:** Research assistant instructions  
**Prompt:** Search and email results  
**Tools:** ✅ Send Gmail, ✅ Web Search

### Pattern 4: Calculate & Email
**System Prompt:** Calculation assistant instructions  
**Prompt:** Calculate and email result  
**Tools:** ✅ Send Gmail, ✅ Calculator

---

## ❓ FAQ

### Q: Is System Prompt required?
**A:** No, but highly recommended. It helps the agent understand its role and how to use tools.

### Q: Can I leave System Prompt empty?
**A:** Yes, but the agent may not know to use the Gmail tool without explicit instructions.

### Q: What if I don't check any tools?
**A:** The agent will try to complete the task without tools, which may not work for email sending.

### Q: Can I use multiple tools?
**A:** Yes! Check multiple tools if your task requires them (e.g., Search + Gmail).

### Q: How do I reference trigger data?
**A:** Use `{{trigger.fieldName}}` in your prompt. For example: `{{trigger.recipient}}`

---

## 🚀 Quick Test Configuration

Copy this exact configuration to test Gmail:

**System Prompt:**
```
You are a helpful email assistant. When asked to send emails, use the Gmail tool (send_gmail). Always include a clear subject and body.
```

**Prompt:**
```
Send an email to your-email@gmail.com with subject "Test Email" and body "This is a test email from the workflow!"
```

**Available Tools:**
- ✅ **📬 Send Gmail** (Check this!)

Then save and execute the workflow!

---

Happy workflow building! 🎉

