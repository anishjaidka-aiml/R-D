# 🎯 LangChain Capabilities Explained

This document explains what we implemented for each LangChain capability and how they work in our project.

---

## 📋 Table of Contents

1. [Memory](#memory)
2. [Chains](#chains)
3. [Vector Stores](#vector-stores)
4. [Retrievers](#retrievers)
5. [Output Parsers](#output-parsers)
6. [Callbacks](#callbacks)
7. [Streaming](#streaming)
8. [Multi-Agent](#multi-agent)

---

## 🧠 Memory

### **What It Is**

Memory allows agents to **remember previous conversations** and maintain context across multiple interactions.

### **What We Implemented**

**File:** `lib/langchain/memory-manager.ts`

**Memory Types:**
1. **Buffer Memory** - Stores entire conversation history
2. **Buffer Window Memory** - Keeps only last N messages (configurable)
3. **Summary Memory** - (Planned) Summarizes old messages

**Features:**
- ✅ Conversation session management
- ✅ Unique conversation IDs
- ✅ Automatic session cleanup (1 hour timeout)
- ✅ Max 100 concurrent sessions
- ✅ Message counting and statistics

### **How It Works**

**Code from `lib/langchain/memory-manager.ts`:**

```typescript
// Get memory for a conversation
export function getConversationMemory(
  conversationId: string,
  config: MemoryConfig = { type: "buffer" }
): BufferMemory | BufferWindowMemory {
  const session = memoryStore.getSession(conversationId, config);
  return session.memory;
}

// Add messages to memory
export async function addToMemory(
  conversationId: string,
  input: string,
  output: string,
  config: MemoryConfig = { type: "buffer" }
): Promise<void> {
  const session = memoryStore.getSession(conversationId, config);
  await session.memory.saveContext({ input }, { output });
  session.messageCount += 2;
}

// Load memory (get chat history)
export async function loadMemory(
  conversationId: string,
  config: MemoryConfig = { type: "buffer" }
): Promise<any> {
  const session = memoryStore.getSession(conversationId, config);
  return await session.memory.loadMemoryVariables({});
}
```

**Usage in Agent Execution (`lib/langchain/agent-manual.ts`):**

```typescript
// Check if memory is enabled
if (config.enableMemory) {
  const conversationId = config.conversationId || generateConversationId();
  
  // Load previous conversation history
  const memory = getConversationMemory(conversationId, {
    type: "buffer",
    returnMessages: true
  });
  
  const memoryVariables = await memory.loadMemoryVariables({});
  const chatHistory = memoryVariables.chat_history || [];
  
  // Add history to messages
  messages.push(...chatHistory);
  
  // After agent responds, save to memory
  await addToMemory(conversationId, prompt, finalOutput);
}
```

### **Usage in Agents**

When `enableMemory: true` in agent config:
- Agent remembers previous messages
- Can reference past interactions
- Maintains context across turns
- Uses conversation ID to track sessions

**Example:**
```typescript
// First message
User: "My name is John"
Agent: "Nice to meet you, John!"

// Second message (with memory)
User: "What's my name?"
Agent: "Your name is John!" // ✅ Remembers!
```

### **Storage**

- **Current:** In-memory storage (resets on server restart)
- **Production Ready:** Can be swapped with Redis/Database

---

## 🔗 Chains

### **What It Is**

Chains are **sequences of LLM calls** that can pass data from one step to the next, enabling complex multi-step workflows.

### **What We Implemented**

**Files:**
- `lib/langchain/chains/llm-chain.ts` - Simple LLM chain
- `lib/langchain/chains/sequential-chain.ts` - Multi-step chain
- `lib/langchain/chains/router-chain.ts` - Conditional routing chain

**Chain Types:**

#### **1. LLM Chain** (`llm-chain.ts`)

**Purpose:** Simple chain with prompt template and variables

**How It Works:**
```
Prompt Template + Variables → LLM → Output
```

**Code from `lib/langchain/chains/llm-chain.ts`:**

```typescript
export async function executeLLMChain(
  config: LLMChainConfig
): Promise<LLMChainResult> {
  // Create prompt template
  const template = PromptTemplate.fromTemplate(config.prompt);
  
  // Format prompt with variables
  const formattedPrompt = await template.format(config.variables || {});
  
  // Create LLM client
  const llm = createAIMLClient({
    temperature: config.temperature ?? 0.7,
    modelName: config.modelName,
    maxTokens: config.maxTokens,
  });
  
  // Invoke LLM
  const response = await llm.invoke(formattedPrompt);
  const output = String(response.content);
  
  return {
    output,
    variables: config.variables,
  };
}
```

**Example Usage:**
```typescript
const result = await executeLLMChain({
  prompt: "Write a {tone} email about {topic}",
  variables: { tone: "professional", topic: "meeting" }
});
// Output: "Subject: Meeting Request\n\nDear Team..."
```

---

#### **2. Sequential Chain** (`sequential-chain.ts`)

**Purpose:** Chains multiple LLM calls together, passing output from one to the next

**How It Works:**
```
Step 1 → Output 1 → Step 2 → Output 2 → Step 3 → Final Output
```

**Code from `lib/langchain/chains/sequential-chain.ts`:**

```typescript
export async function executeSequentialChain(
  config: SequentialChainConfig
): Promise<SequentialChainResult> {
  const outputs: Record<string, string> = {};
  let currentVariables: Record<string, any> = { ...(config.initialInput || {}) };
  
  // Execute each step sequentially
  for (let i = 0; i < config.steps.length; i++) {
    const step = config.steps[i];
    const outputKey = step.outputKey || step.name;
    
    // Build input variables for this step
    const stepInput: Record<string, any> = {};
    if (step.inputVariables) {
      for (const varName of step.inputVariables) {
        if (varName in currentVariables) {
          stepInput[varName] = currentVariables[varName];
        }
      }
    } else {
      Object.assign(stepInput, currentVariables);
    }
    
    // Create prompt template and format
    const template = PromptTemplate.fromTemplate(step.prompt);
    const formattedPrompt = await template.format(stepInput);
    
    // Invoke LLM
    const llm = createAIMLClient({
      temperature: step.temperature ?? config.temperature ?? 0.7,
      modelName: step.modelName ?? config.modelName,
    });
    
    const response = await llm.invoke(formattedPrompt);
    const stepOutput = String(response.content);
    
    // Store output and make available to next steps
    outputs[outputKey] = stepOutput;
    currentVariables[outputKey] = stepOutput;
  }
  
  return {
    outputs,
    finalOutput: outputs[config.steps[config.steps.length - 1].outputKey || 
                          config.steps[config.steps.length - 1].name],
    steps: stepResults,
  };
}
```

**Example Usage:**
```typescript
const result = await executeSequentialChain({
  initialInput: { topic: "AI agents" },
  steps: [
    {
      name: "outline",
      prompt: "Create an outline for an article about {topic}",
      inputVariables: ["topic"],
    },
    {
      name: "draft",
      prompt: "Write a draft based on this outline:\n{outline}",
      inputVariables: ["outline"], // Uses output from step 1
    },
  ],
});
// Output: { outputs: { outline: "...", draft: "..." }, finalOutput: "..." }
```

---

#### **3. Router Chain** (`router-chain.ts`)

**Purpose:** Routes to different chains based on input conditions using LLM decision-making

**How It Works:**
```
Input → LLM Routing Decision → Selected Chain → Output
```

**Code from `lib/langchain/chains/router-chain.ts`:**

```typescript
export async function executeRouterChain(
  config: RouterChainConfig
): Promise<RouterChainResult> {
  // Build routing prompt with destination options
  const destinationList = config.destinations
    .map((dest, idx) => `${idx + 1}. ${dest.name}: ${dest.description}`)
    .join('\n');
  
  const routingPromptTemplate = `${config.routingPrompt}
  
Available destinations:
${destinationList}

Respond with ONLY the destination name (e.g., "email" or "code").`;
  
  // Use LLM to determine routing
  const routingLLM = createAIMLClient({
    temperature: config.temperature ?? 0.3, // Lower temp for consistent routing
  });
  
  const routingTemplate = PromptTemplate.fromTemplate(routingPromptTemplate);
  const formattedRoutingPrompt = await routingTemplate.format(config.input || {});
  
  const routingResponse = await routingLLM.invoke(formattedRoutingPrompt);
  const routingDecision = String(routingResponse.content).trim().toLowerCase();
  
  // Find matching destination
  let selectedDestination = config.destinations.find(
    (dest) => dest.name.toLowerCase() === routingDecision
  );
  
  // Execute the selected chain
  if (selectedDestination.chainType === 'llm') {
    const chainResult = await executeLLMChain({
      ...selectedDestination.chainConfig as LLMChainConfig,
      variables: { ...config.input },
    });
    return { selectedDestination: selectedDestination.name, chainResult, routingDecision };
  }
  
  // ... handle sequential chain type
}
```

**Example Usage:**
```typescript
const result = await executeRouterChain({
  routingPrompt: "Based on this query: {query}, which destination?",
  input: { query: "Write a professional email" },
  destinations: [
    {
      name: "email",
      description: "For email-related tasks",
      chainType: "llm",
      chainConfig: { prompt: "Write email about {query}" }
    },
  ],
});
// Output: { selectedDestination: "email", chainResult: {...}, routingDecision: "email" }
```

---

### **Usage in Workflows**

All chain types are available as **workflow nodes**:
- **LLM Chain Node** - Visual node in workflow builder
- **Sequential Chain Node** - Configure steps visually
- **Router Chain Node** - Set up routing destinations

**Workflow Integration:** `lib/workflow-executor.ts`
- Chains execute as workflow nodes
- Outputs stored in workflow context
- Can be chained with other nodes

---

## 📚 Vector Stores

### **What It Is**

Vector stores are **databases that store documents as embeddings** (numerical representations) and enable **semantic similarity search**.

### **What We Implemented**

**File:** `lib/langchain/vectorstores/document-store.ts`

**Storage Type:** `MemoryVectorStore` (LangChain)
- In-memory storage
- Fast for development
- Resets on server restart

**Features:**
- ✅ Document upload and storage
- ✅ Automatic chunking
- ✅ Embedding generation
- ✅ Similarity search
- ✅ Metadata filtering

### **How It Works**

**Code from `lib/langchain/chains/rag-chain.ts`:**

```typescript
export async function executeRAGChain(
  query: string,
  config: RAGChainConfig
): Promise<RAGResult> {
  // Step 1: Retrieve relevant documents
  const documentsWithScores = await retrieveDocumentsWithScores(
    config.vectorStore, 
    query, 
    { k: config.k || 4 }
  );
  
  // Step 2: Build context from retrieved documents
  const context = documents
    .map((doc, index) => {
      const source = doc.metadata.source || "Unknown";
      return `[Source ${index + 1}: ${source}]\n${doc.pageContent}`;
    })
    .join("\n\n---\n\n");
  
  // Step 3: Create prompt with context
  const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful assistant that answers questions based on the provided context.
Use only the information from the context to answer the question.

Context:
{context}

Question: {question}

Answer:`);
  
  const formattedPrompt = await promptTemplate.format({
    context,
    question: query,
  });
  
  // Step 4: Generate answer using LLM
  const llm = createAIMLClient({ temperature: config.temperature });
  const response = await llm.invoke(formattedPrompt);
  const answer = String(response.content);
  
  return {
    answer,
    sources: documents.map((doc, index) => ({
      content: doc.pageContent.substring(0, 200),
      metadata: doc.metadata,
      score: scores[index],
    })),
  };
}
```

**Document Upload (`lib/langchain/vector-store/setup.ts`):**

```typescript
// Upload and process documents
export async function addDocumentsToVectorStore(
  documents: Document[],
  collectionName: string = "documents"
): Promise<void> {
  const vectorStore = await getVectorStore(collectionName);
  
  // Split documents into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  
  const chunks = await textSplitter.splitDocuments(documents);
  
  // Create embeddings and add to vector store
  await vectorStore.addDocuments(chunks);
}
```

### **Embeddings**

**Current Implementation:**
- **Primary:** OpenAI/Baseten embeddings (if API key configured)
- **Fallback:** `SimpleTextEmbeddings` (text-based similarity)
- **Note:** Baseten doesn't support embeddings, so fallback is used

**Embedding Client:** `lib/langchain/embeddings/embedding-client.ts`
- Automatic fallback system
- Supports OpenAI-compatible APIs
- Handles API errors gracefully

### **Usage**

**1. Upload Documents:**
```typescript
// Via API
POST /api/rag/upload
// Via UI: http://localhost:3000/rag
```

**2. Query Documents:**
```typescript
// Via API
POST /api/rag/query
{
  query: "What is this document about?",
  k: 4  // Top 4 results
}
```

**3. Use in Agents:**
```typescript
// Agent with RAG tool
{
  tools: ["query_documents"],
  prompt: "What information is available about AI?"
}
```

### **RAG Tool**

**File:** `lib/langchain/tools/rag-tool.ts`

**Features:**
- ✅ Semantic document search
- ✅ Returns relevant chunks
- ✅ Includes similarity scores
- ✅ Supports metadata filtering

---

## 🔍 Retrievers

### **What It Is**

Retrievers are **interfaces for fetching relevant documents** from vector stores based on queries.

### **What We Implemented**

**File:** `lib/langchain/retrievers/document-retriever.ts`

**Functions:**
1. `createRetriever()` - Create retriever from vector store
2. `retrieveDocuments()` - Get relevant documents
3. `retrieveDocumentsWithScores()` - Get documents with similarity scores
4. `getTopKDocuments()` - Get top K documents
5. `retrieveDocumentsByFilter()` - Filter by metadata

### **How It Works**

**Code from `lib/langchain/retrievers/document-retriever.ts`:**

```typescript
// Create retriever from vector store
export function createRetriever(
  vectorStore: MemoryVectorStore,
  options?: {
    k?: number;
    scoreThreshold?: number;
    filter?: Record<string, any>;
  }
): BaseRetriever {
  const { k = 4, scoreThreshold, filter } = options || {};
  
  return vectorStore.asRetriever({
    k,
    scoreThreshold,
    filter,
  });
}

// Retrieve documents with similarity scores
export async function retrieveDocumentsWithScores(
  vectorStore: MemoryVectorStore,
  query: string,
  options?: { k?: number; filter?: Record<string, any>; }
): Promise<Array<[Document, number]>> {
  const { k = 4, filter } = options || {};
  
  // Use similarity search with scores
  const results = filter 
    ? await vectorStore.similaritySearchWithScore(query, k, filter)
    : await vectorStore.similaritySearchWithScore(query, k);
  
  return results;
}

// Retrieve documents (without scores)
export async function retrieveDocuments(
  vectorStore: MemoryVectorStore,
  query: string,
  options?: { k?: number; scoreThreshold?: number; filter?: Record<string, any>; }
): Promise<Document[]> {
  const retriever = createRetriever(vectorStore, options);
  const documents = await retriever.getRelevantDocuments(query);
  return documents;
}
```

**Usage Example:**

```typescript
// Get documents with scores
const docsWithScores = await retrieveDocumentsWithScores(
  vectorStore,
  "What is AI?",
  { k: 4 }
);
// Returns: [[Document, 0.95], [Document, 0.87], ...]

// Get documents only
const docs = await retrieveDocuments(vectorStore, "What is AI?", {
  k: 4,
  scoreThreshold: 0.7  // Only return docs with score >= 0.7
});
```

### **Features**

- ✅ Top-K retrieval (configurable)
- ✅ Similarity score threshold
- ✅ Metadata filtering
- ✅ Fallback to text-based similarity
- ✅ Error handling

### **Usage in RAG**

Retrievers are used by:
- **RAG Tool** - For document search in agents
- **RAG API** - For query endpoints
- **RAG Chain** - For RAG workflows

---

## 📝 Output Parsers

### **What It Is**

Output parsers **extract structured data** from LLM text responses, converting free-form text into JSON or structured objects.

### **What We Implemented**

**Files:**
- `lib/langchain/parsers/json-parser.ts` - JSON parsing
- `lib/langchain/parsers/structured-parser.ts` - Structured schema parsing
- `lib/langchain/parsers/fixing-parser.ts` - Auto-fix malformed outputs

**Parser Types:**

#### **1. JSON Parser**

**Purpose:** Extract JSON from LLM responses

**Features:**
- ✅ Extracts JSON from text (handles extra text)
- ✅ Auto-fix option (uses LLM to fix malformed JSON)
- ✅ Error handling

**Code from `lib/langchain/parsers/json-parser.ts`:**

```typescript
class JSONOutputParser extends BaseOutputParser<Record<string, any>> {
  async parse(text: string): Promise<Record<string, any>> {
    try {
      // Try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // If no JSON found, try parsing entire text
      return JSON.parse(text);
    } catch (error: any) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }
  
  getFormatInstructions(): string {
    return `Your response must be valid JSON. Return only the JSON object, no additional text.`;
  }
}

export async function parseJSON(
  response: string,
  autoFix: boolean = false
): Promise<Record<string, any>> {
  const parser = createJSONParser(autoFix);
  return parser.parse(response);
}
```

**Usage in Agent (`lib/langchain/agent-manual.ts`):**

```typescript
// Parse output if parser is configured
let parsedOutput: any = undefined;
if (config.outputParser && config.outputParser.type !== 'none') {
  try {
    if (config.outputParser.type === 'json') {
      parsedOutput = await parseJSON(rawOutput, config.outputParser.autoFix);
    } else if (config.outputParser.type === 'structured' && config.outputParser.schema) {
      parsedOutput = await parseStructuredOutput(rawOutput, {
        schema: config.outputParser.schema,
        autoFix: config.outputParser.autoFix,
      });
    }
  } catch (error: any) {
    console.warn(`Output parsing failed: ${error.message}`);
  }
}
```

**Example:**
```typescript
const llmResponse = "Here's the data: {\"name\": \"John\", \"age\": 30}";
const result = await parseJSON(llmResponse, autoFix: true);
// Returns: { name: "John", age: 30 }
```

#### **2. Structured Parser**

**Purpose:** Parse responses into specific schemas

**Features:**
- ✅ Schema validation
- ✅ Format instructions for LLM
- ✅ Type-safe output

**Example:**
```typescript
const result = await parseStructuredOutput(llmResponse, {
  schema: {
    name: "string",
    age: "number",
    email: "string"
  }
});
```

#### **3. Fixing Parser**

**Purpose:** Automatically fix malformed outputs using LLM

**Features:**
- ✅ Detects parsing errors
- ✅ Uses LLM to fix output
- ✅ Retries with fixed output

**Example:**
```typescript
const parser = createFixingParser(baseParser, llm);
const result = await parser.parse(malformedOutput);
// Automatically fixes and retries
```

### **Usage in Agents**

**Configuration:**
```typescript
{
  outputParser: {
    type: "json",           // or "structured"
    schema: { ... },        // for structured
    autoFix: true,          // auto-fix errors
    maxRetries: 3           // max retry attempts
  }
}
```

**In Agent Execution:**
- Parser applied after LLM response
- Parsed output stored in `parsedOutput` field
- Falls back gracefully on parse errors

---

## 📞 Callbacks

### **What It Is**

Callbacks are **event handlers** that track agent execution in real-time, providing visibility into what the agent is doing.

### **What We Implemented**

**File:** `types/callbacks.ts`

**Callback Events:**
1. `agent_start` - Agent execution started
2. `agent_end` - Agent execution completed
3. `llm_start` - LLM call started
4. `llm_end` - LLM call completed
5. `tool_start` - Tool execution started
6. `tool_end` - Tool execution completed
7. `iteration_start` - New iteration started
8. `iteration_end` - Iteration completed
9. `error` - Error occurred
10. `complete` - Execution complete

### **How It Works**

**Code from `lib/langchain/agent-manual.ts`:**

```typescript
// Emit callbacks during agent execution
if (callbackHandler?.handle) {
  await callbackHandler.handle({
    type: 'agent_start',
    timestamp: Date.now(),
    executionId,
    prompt,
    tools: config.tools,
    config: {
      temperature: config.temperature,
      model: config.model,
      maxTokens: config.maxTokens,
    },
  });
}

// Tool execution callback
if (callbackHandler?.handle) {
  await callbackHandler.handle({
    type: 'tool_start',
    timestamp: Date.now(),
    executionId,
    toolName: toolName,
    parameters: params,
    iteration: iterations,
  });
}

// After tool completes
if (callbackHandler?.handle) {
  await callbackHandler.handle({
    type: 'tool_end',
    timestamp: Date.now(),
    executionId,
    toolName: toolName,
    result: toolResult,
    duration: toolDuration,
    success: true,
  });
}
```

**Usage Example:**

```typescript
// Define callback handler
const handler: CallbackHandler = {
  onAgentStart: (event) => {
    console.log("Agent started:", event.prompt);
  },
  onToolStart: (event) => {
    console.log("Tool called:", event.toolName, event.parameters);
  },
  onToolEnd: (event) => {
    console.log("Tool completed:", event.toolName, event.result);
  },
  onComplete: (event) => {
    console.log("Complete:", event.output);
  },
};

// Use in agent execution
await executeAgent(prompt, config, handler);
```

### **Event Data**

Each event includes:
- `type` - Event type
- `timestamp` - When it occurred
- `executionId` - Unique execution ID
- Event-specific data (prompt, tool name, results, etc.)

### **Usage**

**1. Real-time Monitoring:**
- Track agent progress
- See tool calls as they happen
- Monitor execution time

**2. Debugging:**
- See exactly what agent is doing
- Identify bottlenecks
- Track errors

**3. UI Updates:**
- Update UI in real-time
- Show progress indicators
- Display tool call results

**4. Logging:**
- Log all events
- Store execution history
- Analytics

---

## 🌊 Streaming

### **What It Is**

Streaming allows **real-time token-by-token output** from LLM, showing responses as they're generated instead of waiting for complete response.

### **What We Implemented**

**Files:**
- `app/api/conversation/stream/route.ts` - Streaming API endpoint
- `components/StreamingResponse.tsx` - Frontend streaming component

**Features:**
- ✅ Server-Sent Events (SSE)
- ✅ Real-time token streaming
- ✅ Tool call streaming
- ✅ Status updates (starting, reasoning, tool_call, streaming, done)
- ✅ Toggle ON/OFF in UI

### **How It Works**

**Backend Code (`app/api/conversation/stream/route.ts`):**

```typescript
export async function POST(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (type: string, data: any) => {
        const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      try {
        const { message, conversationId } = await request.json();
        
        sendEvent('status', { status: 'streaming' });
        
        // Stream LLM response
        const streamResponse = await llm.stream(messages);
        
        for await (const chunk of streamResponse) {
          const token = chunk.content;
          if (token) {
            sendEvent('token', { token });
          }
        }
        
        sendEvent('done', { output: finalOutput });
        controller.close();
      } catch (error) {
        sendEvent('error', { error: error.message });
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Frontend Code (`components/StreamingResponse.tsx`):**

```typescript
export default function StreamingResponse({ message, onComplete }: Props) {
  const [streamingContent, setStreamingContent] = useState('');
  
  useEffect(() => {
    const startStreaming = async () => {
      const response = await fetch('/api/conversation/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId }),
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'token') {
              setStreamingContent(prev => prev + data.token);
            } else if (data.type === 'done') {
              onComplete(data);
            }
          }
        }
      }
    };
    
    startStreaming();
  }, []);
  
  return <div>{streamingContent}</div>;
}
```

### **Event Types**

**Stream Events:**
- `status` - Status update (starting, reasoning, tool_call, streaming, done)
- `token` - New token (text chunk)
- `tool_call` - Tool execution event
- `done` - Stream completed

### **Usage**

**1. Enable Streaming:**
- Toggle "Streaming ON" in conversation UI
- Default: Enabled

**2. See Real-time Output:**
- Text appears word-by-word
- Status badges show current state
- Animated cursor while streaming

**3. Disable Streaming:**
- Toggle "Streaming OFF"
- Falls back to non-streaming mode
- Waits for complete response

### **Benefits**

- ✅ **Better UX** - See progress immediately
- ✅ **Faster Perceived Speed** - Don't wait for complete response
- ✅ **Real-time Feedback** - Know what agent is doing
- ✅ **Progressive Rendering** - Content appears as generated

---

## 🤖 Multi-Agent

### **What It Is**

Multi-agent systems allow **multiple specialized agents** to work together on complex tasks, with a supervisor coordinating their efforts.

### **What We Implemented**

**Files:**
- `lib/langchain/agents/multi-agent-executor.ts` - Core executor
- `lib/langchain/agents/supervisor.ts` - Supervisor agent
- `lib/langchain/agents/agent-registry.ts` - Agent definitions
- `lib/langchain/agents/communication.ts` - Agent messaging
- `lib/langchain/agents/shared-context.ts` - Shared data

**Execution Modes:**

#### **1. Supervised Mode** (Default)

**How It Works:**
```
Task → Supervisor Analysis → Select Agents → Execute → Aggregate Results
```

**Supervisor Responsibilities:**
- Analyzes task complexity
- Breaks down into subtasks
- Selects appropriate agents
- Determines execution mode
- Coordinates execution

**Code from `lib/langchain/agents/multi-agent-executor.ts`:**

```typescript
export async function executeMultiAgent(
  task: string,
  config: {
    mode: 'supervised' | 'parallel' | 'sequential';
    agentIds?: string[];
    supervisorDecision?: SupervisorDecision;
    sharedContext?: Record<string, any>;
  } = { mode: 'supervised' },
  callbackHandler?: CallbackHandler
): Promise<MultiAgentExecutionResult> {
  const executionId = `multi-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Initialize shared context
  if (config.sharedContext) {
    sharedContext.update(executionId, config.sharedContext);
  }
  
  let supervisorDecision: SupervisorDecision | undefined = config.supervisorDecision;
  let agents: AgentDefinition[] = [];
  
  // Determine which agents to use
  if (config.mode === 'supervised') {
    // Use supervisor to analyze task
    if (!supervisorDecision) {
      supervisorDecision = await analyzeTask(task, config.agentIds);
    }
    
    // Get agent definitions
    agents = supervisorDecision.selectedAgents
      .map(id => agentRegistry.get(id))
      .filter((agent): agent is AgentDefinition => agent !== undefined);
  }
  
  // Execute agents based on mode
  let results: Record<string, AgentExecutionResult>;
  
  if (supervisorDecision?.executionMode === 'parallel') {
    // Execute all agents in parallel
    results = await executeParallel(agents, task, executionId, config.sharedContext);
  } else {
    // Execute sequentially
    results = await executeSequential(
      agents, 
      task, 
      executionId, 
      supervisorDecision?.taskBreakdown,
      config.sharedContext
    );
  }
  
  // Aggregate results
  const successfulResults = Object.values(results).filter(r => r.success);
  const aggregatedOutput = successfulResults
    .map(r => `[${r.agentName}]\n${r.output}`)
    .join('\n\n---\n\n');
  
  return {
    executionId,
    mode: config.mode,
    success: successfulResults.length > 0,
    results,
    aggregatedOutput,
    supervisorDecision,
    executionTime: Date.now() - startTime,
  };
}
```

**Example Usage:**

```typescript
const result = await executeMultiAgent("Write a research article about AI", {
  mode: "supervised"
});
// Supervisor analyzes task
// Selects: research-agent, writing-agent
// Executes sequentially: research → write
// Returns: { results: {...}, aggregatedOutput: "...", ... }
```

#### **2. Parallel Mode**

**How It Works:**
```
Task → Execute All Agents Simultaneously → Aggregate Results
```

**Use Cases:**
- Independent tasks
- Fast execution needed
- No dependencies between agents

**Example:**
```typescript
executeMultiAgent("Research AI and write article", {
  mode: "parallel",
  agentIds: ["research-agent", "writing-agent"]
});
// Both agents execute at the same time
```

#### **3. Sequential Mode**

**How It Works:**
```
Task → Execute Agent 1 → Pass Results → Execute Agent 2 → Final Output
```

**Use Cases:**
- Dependent tasks
- Need previous results
- Step-by-step workflow

**Example:**
```typescript
executeMultiAgent("Research and write article", {
  mode: "sequential",
  agentIds: ["research-agent", "writing-agent"]
});
// Research first, then writing uses research results
```

### **Agent Types**

**Predefined Agents:**
1. **Supervisor Agent** - Coordinates other agents
2. **Research Agent** - Web search and research
3. **Writing Agent** - Content creation
4. **Generalist Agent** - General-purpose tasks
5. **Code Agent** - Code generation
6. **Analysis Agent** - Data analysis

**Agent Registry:** `lib/langchain/agents/agent-registry.ts`
- Central registry of all agents
- Each agent has: system prompt, tools, temperature, model
- Easy to add new agents

### **Features**

**1. Shared Context:**
- Agents share data during execution
- Updates visible to all agents
- Persists for execution duration

**2. Communication:**
- Agents can send messages to each other
- Broadcast messages to all agents
- Message history tracking

**3. Task Breakdown:**
- Supervisor breaks complex tasks into subtasks
- Each agent gets specific subtask
- Results aggregated at end

**4. Error Handling:**
- Failed agents don't stop execution
- Supervisor can retry with different agents
- Fallback to generalist agent

### **Usage in Workflows**

**Multi-Agent Node:**
- Available in workflow builder
- Configure: task, execution mode, selected agents
- Execute multiple agents in one node

**Configuration:**
```json
{
  "type": "multi_agent",
  "config": {
    "task": "Write a research article about AI",
    "executionMode": "supervised",
    "selectedAgents": ["research-agent", "writing-agent"],
    "sharedContext": {}
  }
}
```

### **Execution Flow**

```
1. Supervisor analyzes task
   ↓
2. Selects appropriate agents
   ↓
3. Breaks down into subtasks
   ↓
4. Executes agents (parallel/sequential)
   ↓
5. Agents communicate and share context
   ↓
6. Aggregate results
   ↓
7. Return final output
```

---

## 🎯 Summary

| Capability | Status | Purpose | Key Files |
|------------|--------|---------|-----------|
| **Memory** | ✅ Complete | Remember conversations | `memory-manager.ts` |
| **Chains** | ✅ Complete | Multi-step LLM workflows | `chains/*.ts` |
| **Vector Stores** | ✅ Complete | Document storage & search | `vectorstores/*.ts` |
| **Retrievers** | ✅ Complete | Document retrieval | `retrievers/*.ts` |
| **Output Parsers** | ✅ Complete | Structured output parsing | `parsers/*.ts` |
| **Callbacks** | ✅ Complete | Execution tracking | `types/callbacks.ts` |
| **Streaming** | ✅ Complete | Real-time token streaming | `api/conversation/stream` |
| **Multi-Agent** | ✅ Complete | Multiple agents working together | `agents/*.ts` |

---

## 🚀 How They Work Together

**Example: Multi-Agent RAG Workflow**

```
1. Multi-Agent System
   ↓
2. Research Agent uses Retrievers
   ↓
3. Retrievers query Vector Store
   ↓
4. Results passed to Writing Agent
   ↓
5. Writing Agent uses Chains
   ↓
6. Output parsed with Output Parsers
   ↓
7. Streaming shows progress
   ↓
8. Callbacks track execution
   ↓
9. Memory stores conversation
```

---

## 📚 Additional Resources

- **Vector Stores Guide:** `docs/VECTOR-STORES-GUIDE.md`
- **Multi-Agent Status:** `docs/MULTI-AGENT-STATUS.md`
- **Streaming Guide:** `docs/PHASE7-STREAMING-COMPLETE.md`
- **Chains Guide:** `docs/HOW-TO-USE-LANGCHAIN-CHAINS.md`

---

**All capabilities are fully implemented and integrated into the workflow system!** 🎉

