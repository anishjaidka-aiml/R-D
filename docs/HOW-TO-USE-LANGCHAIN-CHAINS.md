# 📖 How to Use LangChain Chains - Complete Guide

**Step-by-step instructions for using LLM Chain, Sequential Chain, and Router Chain in workflows.**

---

## 🎯 **Overview**

LangChain Chains allow you to:
- **LLM Chain**: Use prompt templates with variables
- **Sequential Chain**: Chain multiple LLM calls together
- **Router Chain**: Route to different chains based on conditions

---

## 📋 **Step 1: Open Workflow Builder**

1. **Start your development server** (if not running):
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3000/workflows/new
   ```

3. You should see the **Workflow Builder** interface with:
   - Left sidebar: Node Palette (Add Nodes panel)
   - Center: Canvas (where you build workflows)
   - Right: Configuration panel (appears when you select a node)

---

## 🔗 **Step 2: Add Chain Nodes**

### **Finding Chain Nodes in Palette**

Look at the **"Add Nodes"** panel on the left side. You'll see these chain options:

1. **🔗 LLM Chain** (Indigo/Purple color)
   - Description: "Prompt template → LLM"
   - Use for: Simple prompt templates with variables

2. **🌐 Sequential Chain** (Teal/Green color)
   - Description: "Chain multiple LLM calls"
   - Use for: Multi-step LLM workflows

3. **🛣️ Router Chain** (Cyan/Blue color)
   - Description: "Route to different chains"
   - Use for: Conditional routing based on input

### **Adding a Node**

1. **Click** on any chain node type in the palette
2. The node will appear on the canvas
3. **Drag** it to position it where you want
4. **Click** on the node to select it (configuration panel will appear)

---

## 🔧 **Step 3: Configure Chain Nodes**

### **Example 1: LLM Chain**

**Use Case:** Generate a professional email based on a topic.

#### **Setup:**

1. **Add a Trigger node** first:
   - Click "Trigger" in the palette
   - This will be your input source

2. **Add an LLM Chain node**:
   - Click "LLM Chain" in the palette
   - Connect Trigger → LLM Chain (drag from Trigger output to LLM Chain input)

3. **Configure Trigger**:
   - Click on Trigger node
   - In the configuration panel, set:
     - **Label**: "Email Request"
     - **Trigger Data** (JSON):
       ```json
       {
         "topic": "Team meeting",
         "tone": "professional"
       }
       ```

4. **Configure LLM Chain**:
   - Click on LLM Chain node
   - In the configuration panel, set:

   **Prompt Template:**
   ```
   Write a {tone} email about {topic}. 
   Make it concise and clear. Include:
   - Subject line
   - Greeting
   - Main content
   - Closing
   ```

   **Variables (JSON):**
   ```json
   {
     "tone": "{{trigger.tone}}",
     "topic": "{{trigger.topic}}"
   }
   ```

   **Temperature:** `0.7` (default)

   **Model:** Leave empty (uses default) or set to `llama-3.3-70b-instruct`

5. **Save Configuration**:
   - Click "Save Changes" button

#### **Understanding Variables:**

- `{tone}` and `{topic}` in the prompt template are placeholders
- Variables JSON maps these placeholders to values
- `{{trigger.tone}}` references data from the Trigger node
- You can also use static values like `"tone": "professional"`

#### **Execute:**

1. Click **"Execute Workflow"** button (usually top-right)
2. Watch the execution logs
3. See the generated email in the output

---

### **Example 2: Sequential Chain**

**Use Case:** Create an article outline, then write a draft based on that outline.

#### **Setup:**

1. **Add Trigger node**:
   - Set trigger data:
     ```json
     {
       "topic": "AI Agents in Business"
     }
     ```

2. **Add Sequential Chain node**:
   - Connect Trigger → Sequential Chain

3. **Configure Sequential Chain**:

   **Initial Input Variables (JSON):**
   ```json
   {
     "topic": "{{trigger.topic}}"
   }
   ```

   **Step 1 - Create Outline:**
   - Click **"+ Add Step"** button
   - **Name**: `outline`
   - **Prompt**: 
     ```
     Create a detailed outline for an article about {topic}.
     Include:
     - Introduction
     - 3-5 main sections with subsections
     - Conclusion
     Format as a numbered list.
     ```
   - **Input Variables**: `topic`

   **Step 2 - Write Draft:**
   - Click **"+ Add Step"** again
   - **Name**: `draft`
   - **Prompt**:
     ```
     Write a comprehensive article draft based on this outline:
     
     {outline}
     
     Make it engaging and informative. Each section should be well-developed.
     ```
   - **Input Variables**: `outline`

4. **Save Configuration**

#### **How It Works:**

1. **Step 1** receives `topic` from initial input
2. **Step 1** generates an outline
3. **Step 2** receives `outline` (output from Step 1)
4. **Step 2** generates the draft article

#### **Execute:**

1. Execute workflow
2. Check logs to see:
   - Step 1 output (outline)
   - Step 2 output (draft)
3. Final output will be the draft article

---

### **Example 3: Router Chain**

**Use Case:** Route to different chains based on query type (email vs code).

#### **Setup:**

1. **Add Trigger node**:
   - Set trigger data:
     ```json
     {
       "query": "Write a professional email to schedule a meeting"
     }
     ```

2. **Add Router Chain node**:
   - Connect Trigger → Router Chain

3. **Configure Router Chain**:

   **Routing Prompt:**
   ```
   Based on this query: {query}, determine which destination to use.
   - Use "email" if the query is about writing emails, messages, or communication
   - Use "code" if the query is about generating code, programming, or technical implementation
   Respond with ONLY the destination name: "email" or "code"
   ```

   **Input Variables (JSON):**
   ```json
   {
     "query": "{{trigger.query}}"
   }
   ```

   **Destination 1 - Email Chain:**
   - Click **"+ Add Destination"** button
   - **Name**: `email`
   - **Description**: `For email-related tasks`
   - **Chain Type**: Select `LLM Chain`
   - **Chain Config (JSON)**:
     ```json
     {
       "promptTemplate": "Write a professional email based on this request: {query}. Include subject line, greeting, body, and closing.",
       "variables": {
         "query": "{query}"
       }
     }
     ```

   **Destination 2 - Code Chain:**
   - Click **"+ Add Destination"** again
   - **Name**: `code`
   - **Description**: `For code generation tasks`
   - **Chain Type**: Select `LLM Chain`
   - **Chain Config (JSON)**:
     ```json
     {
       "promptTemplate": "Generate code based on this request: {query}. Include comments and best practices.",
       "variables": {
         "query": "{query}"
       }
     }
     ```

4. **Save Configuration**

#### **How It Works:**

1. Router Chain receives the query
2. LLM analyzes the query using the routing prompt
3. LLM decides: "email" or "code"
4. Router executes the matching destination chain
5. Result is returned

#### **Execute:**

1. Execute workflow with email query → Should route to email chain
2. Change trigger data to code query:
   ```json
   {
     "query": "Generate a Python function to calculate factorial"
   }
   ```
3. Execute again → Should route to code chain

---

## 🎨 **Visual Guide**

### **Workflow Canvas Layout:**

```
┌─────────────────────────────────────────────────┐
│  [Add Nodes Panel]    │    [Canvas]            │
│                       │                         │
│  🔗 LLM Chain         │    [Trigger]           │
│  🌐 Sequential Chain  │       ↓                │
│  🛣️ Router Chain      │    [Chain Node]        │
│                       │                         │
└─────────────────────────────────────────────────┘
```

### **Node Connection:**

1. **Hover** over a node
2. **Drag** from the output handle (bottom) to the input handle (top) of another node
3. A connection line will appear
4. **Click** the connection to delete it if needed

---

## 📝 **Configuration Tips**

### **Variable Reference Syntax:**

- **From previous nodes**: `{{nodeName.field}}`
  - Example: `{{trigger.message}}`
  - Example: `{{agent.output}}`
  
- **In prompt templates**: `{variableName}`
  - Example: `Write about {topic}`
  
- **In Variables JSON**: Use `{{nodeName.field}}` to reference, or static values
  ```json
  {
    "topic": "{{trigger.topic}}",  // From previous node
    "tone": "professional"          // Static value
  }
  ```

### **Common Patterns:**

#### **Pattern 1: Simple Template**
```
Prompt Template: "Write a {tone} email about {topic}"
Variables: {"tone": "professional", "topic": "meeting"}
```

#### **Pattern 2: Using Previous Node Data**
```
Prompt Template: "Summarize this: {content}"
Variables: {"content": "{{trigger.message}}"}
```

#### **Pattern 3: Sequential Processing**
```
Step 1: Generate outline from {topic}
Step 2: Write article from {outline}
```

---

## 🧪 **Testing Your Chains**

### **Step-by-Step Testing:**

1. **Start Simple**:
   - Create a basic LLM Chain first
   - Test with simple variables
   - Verify output

2. **Add Complexity**:
   - Add more variables
   - Connect multiple nodes
   - Test variable passing

3. **Test Sequential Chain**:
   - Start with 2 steps
   - Verify Step 1 output feeds Step 2
   - Add more steps gradually

4. **Test Router Chain**:
   - Test with different inputs
   - Verify routing decisions
   - Check logs for routing reasoning

### **Debugging Tips:**

1. **Check Execution Logs**:
   - Look for variable values
   - Check prompt formatting
   - Verify routing decisions

2. **Common Issues**:
   - **Variable not found**: Check spelling and node references
   - **Empty output**: Verify prompt template syntax
   - **Wrong routing**: Improve routing prompt clarity

3. **Use Console Logs**:
   - Server logs show detailed execution
   - Check terminal/console for errors

---

## 🎯 **Real-World Examples**

### **Example A: Email Generator Workflow**

```
[Trigger] → [LLM Chain]
```

**Trigger Data:**
```json
{
  "recipient": "john@example.com",
  "subject": "Meeting Request",
  "message": "Can we schedule a meeting next week?"
}
```

**LLM Chain Config:**
- **Prompt Template:**
  ```
  Write a professional email:
  To: {recipient}
  Subject: {subject}
  Message: {message}
  
  Include proper greeting and closing.
  ```
- **Variables:**
  ```json
  {
    "recipient": "{{trigger.recipient}}",
    "subject": "{{trigger.subject}}",
    "message": "{{trigger.message}}"
  }
  ```

---

### **Example B: Content Creation Pipeline**

```
[Trigger] → [Sequential Chain]
```

**Sequential Chain Steps:**

1. **Research Step**:
   - Prompt: `Research and summarize key points about {topic}`
   - Input: `topic`

2. **Outline Step**:
   - Prompt: `Create an outline based on these key points:\n{research}`
   - Input: `research`

3. **Draft Step**:
   - Prompt: `Write a comprehensive article based on this outline:\n{outline}`
   - Input: `outline`

4. **Edit Step**:
   - Prompt: `Edit and improve this article:\n{draft}`
   - Input: `draft`

---

### **Example C: Smart Assistant Router**

```
[Trigger] → [Router Chain]
```

**Router Destinations:**

1. **Email Writer** (for email requests)
2. **Code Generator** (for code requests)
3. **Content Writer** (for article/blog requests)
4. **Summarizer** (for summarization requests)

**Routing Prompt:**
```
Analyze this request: {query}
Route to:
- "email" if about writing emails
- "code" if about generating code
- "content" if about writing articles/blogs
- "summarize" if about summarizing content
Respond with ONLY the destination name.
```

---

## ✅ **Quick Checklist**

Before executing your workflow:

- [ ] All nodes are connected properly
- [ ] Trigger node has data configured
- [ ] Chain nodes have prompts configured
- [ ] Variables are correctly referenced
- [ ] Sequential Chain has steps defined
- [ ] Router Chain has destinations configured
- [ ] All configurations are saved

---

## 🚨 **Troubleshooting**

### **Problem: "Variable not found"**

**Solution:**
- Check variable spelling in prompt template
- Verify variable exists in Variables JSON
- Ensure node reference syntax is correct: `{{nodeName.field}}`

### **Problem: "Empty output"**

**Solution:**
- Check prompt template syntax
- Verify LLM is responding (check server logs)
- Try simpler prompt first

### **Problem: "Router not routing correctly"**

**Solution:**
- Make routing prompt more explicit
- Add examples in routing prompt
- Check destination names match exactly

### **Problem: "Sequential Chain step fails"**

**Solution:**
- Verify previous step output exists
- Check input variables match step output keys
- Ensure step names are unique

---

## 📚 **Additional Resources**

- **Phase 11 Documentation**: `docs/PHASE11-LANGCHAIN-CHAINS-COMPLETE.md`
- **API Reference**: Check chain implementation files
- **Examples**: See workflow examples in documentation

---

## 🎓 **Next Steps**

1. **Practice**: Start with simple LLM Chain
2. **Experiment**: Try different prompt templates
3. **Combine**: Use chains with other node types (agents, tools)
4. **Optimize**: Refine prompts for better results
5. **Scale**: Build complex multi-chain workflows

---

**Happy Building! 🚀**

If you encounter any issues, check the server logs and execution output for detailed error messages.


