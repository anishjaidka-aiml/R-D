# 🤖 Agentic Workflow Builder

A visual workflow builder for creating AI agent automations, powered by **LangChain.js** and your company's **AI.ML API**.

Built with Next.js, React Flow, and TypeScript.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your AI.ML credentials:

```env
AIML_API_KEY=your_aiml_api_key_here
AIML_BASE_URL=https://api.aimlapi.com/v1
AIML_MODEL=gpt-4o
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Test AI.ML Connection

Navigate to [http://localhost:3000/test-connection](http://localhost:3000/test-connection) to verify your AI.ML API is working.

---

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI Framework**: LangChain.js
- **LLM Provider**: AI.ML (OpenAI-compatible)
- **UI Library**: React + React Flow
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React

---

## 🏗️ Project Structure

```
agentic-workflow-builder/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── api/               # API routes
│   └── test-connection/   # Connection test page
├── lib/                   # Core logic
│   ├── langchain/         # LangChain configuration
│   └── utils.ts           # Utility functions
├── components/            # React components (coming in Phase 2)
├── types/                 # TypeScript types (coming in Phase 2)
└── data/                  # Storage (gitignored)
```

---

## 📚 Development Phases

### ✅ Phase 1: Foundation (Current)
- [x] Project setup
- [x] LangChain + AI.ML integration
- [x] Basic UI
- [x] Connection test

### 🔄 Phase 2: Agent Core (Next)
- [ ] Agent executor
- [ ] Tool registry
- [ ] Memory management

### 🔄 Phase 3: Visual Builder
- [ ] React Flow integration
- [ ] Node components
- [ ] Drag & drop

### 🔄 Phase 4: Workflow Engine
- [ ] Workflow execution
- [ ] Data flow
- [ ] Error handling

### 🔄 Phase 5: Features & Polish
- [ ] Email automation
- [ ] Execution logs
- [ ] Save/load workflows

---

## 🧪 Testing

### Test AI.ML Connection

```bash
# Via browser
http://localhost:3000/test-connection

# Via API
curl http://localhost:3000/api/test-connection
```

---

## 📖 Documentation

- [LangChain.js Docs](https://js.langchain.com/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [React Flow Docs](https://reactflow.dev/docs/)

---

## 🤝 Contributing

This is a POC project. Feel free to extend and customize!

---

## 📝 License

MIT

