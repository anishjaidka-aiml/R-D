# 🎯 Trigger Node Configuration Examples

The **Trigger Node** is the starting point of your workflow. It provides initial data that can be used by subsequent nodes.

---

## 📋 Trigger Node Fields

When you click on a Trigger node, you'll see:

1. **Label** - Name of the node (e.g., "Start", "Email Request")
2. **Trigger Data (JSON)** - JSON object with initial data for the workflow

---

## 📧 Example 1: Simple Email Request

**Use Case:** Send a basic email

**Trigger Data (JSON):**
```json
{
  "message": "Send a test email to your-email@gmail.com with subject 'Hello' and body 'This is a test email from the workflow!'"
}
```

**Agent Node Prompt:**
```
{{trigger.message}}
```

**Agent Tools:** ✅ Send Gmail

---

## 📧 Example 2: Structured Email Data

**Use Case:** Send email with structured data

**Trigger Data (JSON):**
```json
{
  "recipient": "test@example.com",
  "subject": "Workflow Test Email",
  "body": "This email was sent automatically from a workflow using the Gmail tool!"
}
```

**Agent Node Prompt:**
```
Send an email to {{trigger.recipient}} with subject "{{trigger.subject}}" and body "{{trigger.body}}"
```

**Agent Tools:** ✅ Send Gmail

---

## 📧 Example 3: Email with Multiple Recipients

**Use Case:** Send to multiple people

**Trigger Data (JSON):**
```json
{
  "recipients": ["user1@example.com", "user2@example.com"],
  "subject": "Team Update",
  "body": "Here's the latest update for the team."
}
```

**Agent Node Prompt:**
```
Send an email to {{trigger.recipients}} with subject "{{trigger.subject}}" and body "{{trigger.body}}"
```

**Agent Tools:** ✅ Send Gmail

---

## 🔍 Example 4: Research & Email

**Use Case:** Search web and email results

**Trigger Data (JSON):**
```json
{
  "topic": "latest AI news",
  "recipient": "user@example.com"
}
```

**Agent Node Prompt:**
```
Search the web for "{{trigger.topic}}" and send a summary email to {{trigger.recipient}} with the findings.
```

**Agent Tools:** ✅ Send Gmail, ✅ Web Search

---

## 🔢 Example 5: Calculate & Email

**Use Case:** Perform calculation and email result

**Trigger Data (JSON):**
```json
{
  "calculation": "25 * 17 + 100",
  "recipient": "admin@example.com"
}
```

**Agent Node Prompt:**
```
Calculate {{trigger.calculation}} and send the result to {{trigger.recipient}} in an email with subject "Calculation Result".
```

**Agent Tools:** ✅ Send Gmail, ✅ Calculator

---

## 📊 Example 6: Conditional Email

**Use Case:** Send email based on condition

**Trigger Data (JSON):**
```json
{
  "value": 100,
  "threshold": 50,
  "recipient": "admin@example.com"
}
```

**Agent Node Prompt:**
```
If {{trigger.value}} is greater than {{trigger.threshold}}, send an email to {{trigger.recipient}} saying "Value {{trigger.value}} exceeds threshold {{trigger.threshold}}". Otherwise, send an email saying "Value is within limits."
```

**Agent Tools:** ✅ Send Gmail, ✅ Calculator

---

## 🎯 Example 7: Complete Email Workflow

**Use Case:** Full email workflow with all details

**Trigger Data (JSON):**
```json
{
  "to": "customer@example.com",
  "subject": "Order Confirmation",
  "greeting": "Dear Customer",
  "message": "Your order has been confirmed and will be shipped within 2-3 business days.",
  "closing": "Thank you for your business!"
}
```

**Agent Node Prompt:**
```
Send a professional email to {{trigger.to}} with subject "{{trigger.subject}}". The email body should start with "{{trigger.greeting}}", include the message "{{trigger.message}}", and end with "{{trigger.closing}}".
```

**Agent Tools:** ✅ Send Gmail

---

## 💡 Tips for Trigger Data

1. **Use Valid JSON**
   - Always use double quotes for keys and string values
   - No trailing commas
   - Properly escape special characters

2. **Keep It Simple**
   - Start with simple data structures
   - Add complexity as needed

3. **Use Descriptive Keys**
   - `recipient` instead of `r`
   - `emailSubject` instead of `sub`

4. **Reference in Agent Node**
   - Use `{{trigger.fieldName}}` to access trigger data
   - Nested fields: `{{trigger.user.email}}`

---

## ❌ Common Mistakes

### ❌ Invalid JSON
```json
{
  "message": "Hello",  // ← Trailing comma
}
```

### ✅ Valid JSON
```json
{
  "message": "Hello"
}
```

### ❌ Missing Quotes
```json
{
  message: "Hello"  // ← Keys need quotes
}
```

### ✅ Correct Format
```json
{
  "message": "Hello"
}
```

---

## 🚀 Quick Start Template

Copy this into your Trigger Node's "Trigger Data (JSON)" field:

```json
{
  "recipient": "your-email@gmail.com",
  "subject": "Test Email from Workflow",
  "body": "This is a test email sent from a workflow using the Gmail tool!"
}
```

Then in your Agent Node:
- **Prompt:** `Send an email to {{trigger.recipient}} with subject "{{trigger.subject}}" and body "{{trigger.body}}"`
- **Tools:** ✅ Send Gmail

---

Happy workflow building! 🎉

