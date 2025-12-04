# 🧪 How to Test Multi-Agent System - Step-by-Step Guide

**Complete guide for testing Phase 12: Multi-Agent System**

---

## 🎯 **Prerequisites**

1. **Server Running**: Make sure your dev server is running
   ```bash
   npm run dev
   ```

2. **Access Workflow Builder**: Open `http://localhost:3000/workflows/new`

---

## 📋 **Test Scenario 1: Supervised Mode (Recommended First Test)**

**What it does:** Supervisor analyzes the task and automatically routes to appropriate agents.

### **Step 1: Create New Workflow**

1. Go to `http://localhost:3000/workflows/new`
2. You should see the workflow canvas with "Add Nodes" panel on the left

### **Step 2: Add Trigger Node**

1. **Click** on "Trigger" in the Add Nodes panel
2. The trigger node appears on the canvas
3. **Click** on the trigger node to configure it
4. In the configuration panel, set:
   - **Label**: "Task Input"
   - **Trigger Data (JSON)**:
     ```json
     {
       "task": "Write an article about AI agents in business. First research the topic, then write a comprehensive article."
     }
     ```
5. **Click** "Save Changes"

### **Step 3: Add Multi-Agent Node**

1. **Scroll down** in the Add Nodes panel
2. **Click** on "Multi-Agent" (purple/violet icon with Users symbol)
3. The multi-agent node appears on the canvas
4. **Drag** it to position it below the trigger node

### **Step 4: Connect Nodes**

1. **Hover** over the trigger node
2. **Drag** from the bottom handle (output) to the top handle (input) of the multi-agent node
3. A connection line should appear

### **Step 5: Configure Multi-Agent Node**

1. **Click** on the multi-agent node to open configuration
2. Set the following:

   **Task:**
   ```
   {{trigger.task}}
   ```
   (This references the task from the trigger node)

   **Execution Mode:**
   ```
   Supervised (Supervisor routes tasks)
   ```

   **Select Agents:**
   - Leave **empty** (supervisor will choose automatically)
   - OR select specific agents:
     - ✅ Research Agent
     - ✅ Writing Agent

   **Shared Context (JSON, optional):**
   ```json
   {}
   ```
   (Leave empty for first test)

   **Temperature:** Leave default (or set to 0.7)

   **Model:** Leave empty (uses default)

3. **Click** "Save Changes"

### **Step 6: Execute Workflow**

1. **Click** "Execute Workflow" button (usually top-right)
2. Watch the execution logs in the console/terminal
3. You should see:
   ```
   🤖 Supervisor analyzing task...
   ✅ Supervisor decision:
      Selected agents: research-agent, writing-agent
      Execution mode: sequential
   ```
4. Agents will execute one after another
5. Check the output panel for results

### **Step 7: Check Results**

1. Look at the execution output
2. You should see:
   - Research agent output (research summary)
   - Writing agent output (article)
   - Aggregated output combining both

---

## 📋 **Test Scenario 2: Parallel Mode**

**What it does:** Multiple agents run simultaneously on the same task.

### **Steps:**

1. **Create** a new workflow (or modify existing)
2. **Add Trigger** node with:
   ```json
   {
     "task": "Analyze this code and suggest improvements"
   }
   ```
3. **Add Multi-Agent** node
4. **Configure Multi-Agent:**
   - **Task:** `{{trigger.task}}`
   - **Execution Mode:** `Parallel (All agents run simultaneously)`
   - **Select Agents:**
     - ✅ Code Agent
     - ✅ Analysis Agent
   - **Shared Context:** `{}`
5. **Connect** Trigger → Multi-Agent
6. **Execute** workflow
7. **Observe:** Both agents run at the same time (check timestamps in logs)

---

## 📋 **Test Scenario 3: Sequential Mode**

**What it does:** Agents run one after another, each receiving previous results.

### **Steps:**

1. **Create** a new workflow
2. **Add Trigger** node with:
   ```json
   {
     "topic": "Climate Change",
     "request": "Create a marketing campaign"
   }
   ```
3. **Add Multi-Agent** node
4. **Configure Multi-Agent:**
   - **Task:** `Create a marketing campaign about {{trigger.topic}}. First research the topic, then generate creative ideas, then write the content.`
   - **Execution Mode:** `Sequential (Agents run one after another)`
   - **Select Agents:**
     - ✅ Research Agent
     - ✅ Creative Agent
     - ✅ Writing Agent
   - **Shared Context:** `{}`
5. **Connect** Trigger → Multi-Agent
6. **Execute** workflow
7. **Observe:** 
   - Research agent runs first
   - Creative agent receives research results
   - Writing agent receives both previous results

---

## 📋 **Test Scenario 4: With Shared Context**

**What it does:** Agents share common data throughout execution.

### **Steps:**

1. **Create** a new workflow
2. **Add Trigger** node with:
   ```json
   {
     "company": "TechCorp",
     "product": "AI Assistant"
   }
   ```
3. **Add Multi-Agent** node
4. **Configure Multi-Agent:**
   - **Task:** `Create marketing content for {{trigger.product}}`
   - **Execution Mode:** `Supervised`
   - **Select Agents:** Leave empty
   - **Shared Context (JSON):**
     ```json
     {
       "company": "{{trigger.company}}",
       "product": "{{trigger.product}}",
       "tone": "professional"
     }
     ```
5. **Connect** Trigger → Multi-Agent
6. **Execute** workflow
7. **Observe:** All agents have access to company, product, and tone information

---

## 🔍 **What to Look For in Logs**

### **Successful Execution Should Show:**

```
🚀 Starting Multi-Agent Execution
   Execution ID: multi-agent-...
   Mode: supervised
   Task: ...

🤖 Supervisor analyzing task...
✅ Supervisor decision:
   Selected agents: research-agent, writing-agent
   Execution mode: sequential
   Reasoning: ...

🤖 Executing agent: Research Agent (research-agent)
   Task: ...
✅ Agent completed

🤖 Executing agent: Writing Agent (writing-agent)
   Task: ...
✅ Agent completed

✅ Multi-Agent Execution Complete
   Duration: ...ms
   Successful agents: 2/2
```

### **Error Indicators:**

- ❌ "No valid agents found" - Check agent IDs
- ❌ "Supervisor analysis failed" - Check supervisor prompt
- ❌ Agent execution errors - Check individual agent logs

---

## 🎯 **Quick Test Checklist**

### **Basic Test:**
- [ ] Can add multi-agent node to workflow
- [ ] Can configure multi-agent node
- [ ] Can connect trigger to multi-agent
- [ ] Workflow executes without errors
- [ ] Supervisor selects agents (in supervised mode)
- [ ] Agents execute successfully
- [ ] Results are aggregated

### **Mode Tests:**
- [ ] Supervised mode works
- [ ] Parallel mode works
- [ ] Sequential mode works

### **Advanced Tests:**
- [ ] Shared context works
- [ ] Variable resolution works ({{trigger.field}})
- [ ] Multiple agents execute correctly
- [ ] Error handling works

---

## 🐛 **Troubleshooting**

### **Problem: "No valid agents found"**

**Solution:**
- Check that agent IDs match predefined agents
- Verify agent registry is initialized
- Check server console for agent registration logs

### **Problem: "Supervisor analysis failed"**

**Solution:**
- Check LLM is responding
- Verify supervisor prompt is correct
- Check server logs for LLM errors
- Try simpler task first

### **Problem: "Agent execution failed"**

**Solution:**
- Check individual agent logs
- Verify agent has required tools
- Check LLM configuration
- Try with generalist agent first

### **Problem: "Variable not resolved"**

**Solution:**
- Check variable syntax: `{{trigger.field}}`
- Verify trigger node has the field
- Check variable name spelling
- Use JSON format for complex data

---

## 📊 **Expected Output Format**

### **Multi-Agent Node Output:**

```json
{
  "output": "[Research Agent]\n...\n\n---\n\n[Writing Agent]\n...",
  "results": {
    "research-agent": {
      "agentId": "research-agent",
      "agentName": "Research Agent",
      "success": true,
      "output": "...",
      "executionTime": 1234
    },
    "writing-agent": {
      "agentId": "writing-agent",
      "agentName": "Writing Agent",
      "success": true,
      "output": "...",
      "executionTime": 2345
    }
  },
  "supervisorDecision": {
    "selectedAgents": ["research-agent", "writing-agent"],
    "reasoning": "...",
    "executionMode": "sequential"
  },
  "executionId": "multi-agent-...",
  "mode": "supervised",
  "success": true,
  "executionTime": 5678
}
```

---

## 🎓 **Example Workflows**

### **Example 1: Research + Write Article**

```
[Trigger] → [Multi-Agent]
```

**Trigger Data:**
```json
{
  "topic": "Quantum Computing"
}
```

**Multi-Agent Config:**
- Task: `Research {{trigger.topic}} and write a comprehensive article`
- Mode: Supervised
- Agents: Auto-select

**Expected:** Research agent gathers info, Writing agent creates article

---

### **Example 2: Code Review**

```
[Trigger] → [Multi-Agent]
```

**Trigger Data:**
```json
{
  "code": "function add(a, b) { return a + b; }"
}
```

**Multi-Agent Config:**
- Task: `Review this code: {{trigger.code}}`
- Mode: Parallel
- Agents: Code Agent, Analysis Agent

**Expected:** Both agents analyze code simultaneously

---

### **Example 3: Creative Campaign**

```
[Trigger] → [Multi-Agent]
```

**Trigger Data:**
```json
{
  "product": "Smart Watch",
  "audience": "Tech Enthusiasts"
}
```

**Multi-Agent Config:**
- Task: `Create a marketing campaign for {{trigger.product}} targeting {{trigger.audience}}`
- Mode: Sequential
- Agents: Research Agent, Creative Agent, Writing Agent

**Expected:** Research → Ideas → Content

---

## ✅ **Success Criteria**

Your multi-agent system is working correctly if:

1. ✅ Multi-agent node appears in palette
2. ✅ Can configure all settings
3. ✅ Supervisor routes tasks correctly (supervised mode)
4. ✅ Agents execute successfully
5. ✅ Results are aggregated properly
6. ✅ Parallel mode runs agents simultaneously
7. ✅ Sequential mode passes results between agents
8. ✅ Shared context is accessible to all agents
9. ✅ Variable resolution works
10. ✅ Error handling works gracefully

---

## 🚀 **Next Steps After Testing**

Once basic testing is successful:

1. **Try Complex Scenarios:**
   - Multi-step workflows with multiple multi-agent nodes
   - Combining multi-agent with other node types
   - Nested agent coordination

2. **Performance Testing:**
   - Test with many agents
   - Test with long tasks
   - Monitor execution times

3. **Error Scenarios:**
   - Test with invalid agent IDs
   - Test with malformed tasks
   - Test with missing context

4. **Integration Testing:**
   - Use multi-agent with RAG
   - Use multi-agent with chains
   - Use multi-agent with tools

---

## 📝 **Quick Reference**

### **Agent IDs:**
- `research-agent` - Research Agent
- `writing-agent` - Writing Agent
- `code-agent` - Code Agent
- `analysis-agent` - Analysis Agent
- `creative-agent` - Creative Agent
- `generalist-agent` - Generalist Agent
- `supervisor-agent` - Supervisor Agent (internal use)

### **Execution Modes:**
- `supervised` - Supervisor routes tasks automatically
- `parallel` - All agents run simultaneously
- `sequential` - Agents run one after another

### **Variable Syntax:**
- `{{trigger.field}}` - Reference trigger data
- `{{nodeName.field}}` - Reference previous node output
- `{{nodeName.output}}` - Reference node output object

---

**Happy Testing! 🎉**

If you encounter any issues, check the server console logs for detailed error messages.

