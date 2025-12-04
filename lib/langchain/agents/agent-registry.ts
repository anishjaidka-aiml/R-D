/**
 * Multi-Agent System - Agent Registry
 * 
 * Manages agent definitions and provides agent lookup
 */

import { AgentType, AgentDefinition } from './agent-types';

/**
 * Predefined agent definitions
 */
const PREDEFINED_AGENTS: AgentDefinition[] = [
  {
    id: 'research-agent',
    type: AgentType.RESEARCH,
    name: 'Research Agent',
    description: 'Specialized in gathering information from reliable sources',
    systemPrompt: `You are a research specialist agent. Your role is to:
- Gather accurate and reliable information
- Verify facts from multiple sources
- Provide comprehensive research summaries
- Cite sources when possible
- Focus on factual, objective information

Use search tools and web requests to gather information. Be thorough and accurate.`,
    tools: ['search', 'http_request'],
    temperature: 0.3,
  },
  {
    id: 'writing-agent',
    type: AgentType.WRITING,
    name: 'Writing Agent',
    description: 'Specialized in creating clear, engaging, well-structured content',
    systemPrompt: `You are a professional writing agent. Your role is to:
- Create clear, engaging, and well-structured content
- Adapt writing style to the audience
- Ensure proper grammar and flow
- Organize information logically
- Write in a professional yet accessible tone

Focus on clarity, coherence, and engaging the reader.`,
    tools: [],
    temperature: 0.7,
  },
  {
    id: 'code-agent',
    type: AgentType.CODE,
    name: 'Code Agent',
    description: 'Specialized in writing clean, efficient, well-documented code',
    systemPrompt: `You are a software engineering agent. Your role is to:
- Write clean, efficient, and well-documented code
- Follow best practices and coding standards
- Consider performance and maintainability
- Provide clear explanations of code logic
- Handle edge cases and errors

Focus on code quality, readability, and best practices.`,
    tools: [],
    temperature: 0.2,
  },
  {
    id: 'analysis-agent',
    type: AgentType.ANALYSIS,
    name: 'Analysis Agent',
    description: 'Specialized in analyzing data, identifying patterns, and providing insights',
    systemPrompt: `You are a data analysis agent. Your role is to:
- Analyze information and identify patterns
- Provide data-driven insights
- Make logical conclusions
- Present findings clearly
- Use calculations and data processing tools

Focus on accuracy, logical reasoning, and actionable insights.`,
    tools: ['calculator'],
    temperature: 0.3,
  },
  {
    id: 'creative-agent',
    type: AgentType.CREATIVE,
    name: 'Creative Agent',
    description: 'Specialized in generating innovative ideas and creative solutions',
    systemPrompt: `You are a creative specialist agent. Your role is to:
- Generate innovative and original ideas
- Think outside the box
- Provide creative solutions to problems
- Brainstorm multiple options
- Encourage creative thinking

Focus on originality, creativity, and innovative approaches.`,
    tools: [],
    temperature: 0.9,
  },
  {
    id: 'generalist-agent',
    type: AgentType.GENERALIST,
    name: 'Generalist Agent',
    description: 'General-purpose agent for diverse tasks',
    systemPrompt: `You are a helpful generalist AI agent. Your role is to:
- Handle a wide variety of tasks
- Adapt to different requirements
- Provide comprehensive assistance
- Use tools when appropriate
- Deliver high-quality results

Be versatile and helpful across different domains.`,
    tools: ['calculator', 'search', 'http_request'],
    temperature: 0.7,
  },
  {
    id: 'supervisor-agent',
    type: AgentType.SUPERVISOR,
    name: 'Supervisor Agent',
    description: 'Coordinates and routes tasks to specialist agents',
    systemPrompt: `You are a supervisor agent coordinating multiple specialist agents.

Available agents:
- research-agent: For research and information gathering
- writing-agent: For writing and content creation
- code-agent: For code generation and technical tasks
- analysis-agent: For data analysis and insights
- creative-agent: For creative tasks and brainstorming
- generalist-agent: For general-purpose tasks

Your role is to:
- Analyze tasks and determine which agent(s) should handle them
- Decide execution mode (parallel or sequential)
- Break down complex tasks into subtasks
- Coordinate agent execution
- Aggregate results

IMPORTANT GUIDELINES:
- If task mentions "research" or "gather information", include research-agent
- If task mentions "write", "article", "content", "draft", include writing-agent
- If task mentions "code", "programming", "technical", include code-agent
- If task mentions "analyze", "insights", "data", include analysis-agent
- If task mentions "creative", "ideas", "brainstorm", include creative-agent
- If task has multiple steps (e.g., "first research, then write"), use sequential mode
- If task can be done independently by multiple agents, use parallel mode

CRITICAL: You MUST respond with ONLY valid JSON. No markdown code blocks, no explanations. Just the raw JSON object.

Required JSON format:
{
  "selectedAgents": ["agent-id-1", "agent-id-2"],
  "reasoning": "Why these agents were selected",
  "executionMode": "sequential",
  "taskBreakdown": [
    {"agent": "agent-id-1", "subtask": "What this agent should do"},
    {"agent": "agent-id-2", "subtask": "What this agent should do"}
  ]
}`,
    tools: [],
    temperature: 0.5,
  },
];

/**
 * Agent Registry
 * 
 * Manages agent definitions and provides lookup functionality
 */
class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();
  private agentsByType: Map<AgentType, AgentDefinition[]> = new Map();

  constructor() {
    // Register predefined agents
    PREDEFINED_AGENTS.forEach(agent => {
      this.register(agent);
    });
  }

  /**
   * Register an agent definition
   */
  register(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
    
    // Index by type
    const typeAgents = this.agentsByType.get(agent.type) || [];
    typeAgents.push(agent);
    this.agentsByType.set(agent.type, typeAgents);
  }

  /**
   * Get agent by ID
   */
  get(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agents by type
   */
  getByType(type: AgentType): AgentDefinition[] {
    return this.agentsByType.get(type) || [];
  }

  /**
   * Get all agents
   */
  getAll(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /**
   * List available agent IDs
   */
  listIds(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Check if agent exists
   */
  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Create a custom agent
   */
  createCustomAgent(
    id: string,
    type: AgentType,
    name: string,
    description: string,
    systemPrompt: string,
    tools: string[] = [],
    config?: {
      temperature?: number;
      model?: string;
      maxTokens?: number;
    }
  ): AgentDefinition {
    const agent: AgentDefinition = {
      id,
      type,
      name,
      description,
      systemPrompt,
      tools,
      temperature: config?.temperature ?? 0.7,
      model: config?.model,
      maxTokens: config?.maxTokens,
    };

    this.register(agent);
    return agent;
  }

  /**
   * Remove an agent (only custom agents can be removed)
   */
  remove(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    // Don't allow removing predefined agents
    if (PREDEFINED_AGENTS.some(a => a.id === agentId)) {
      return false;
    }

    this.agents.delete(agentId);
    
    // Remove from type index
    const typeAgents = this.agentsByType.get(agent.type) || [];
    const filtered = typeAgents.filter(a => a.id !== agentId);
    this.agentsByType.set(agent.type, filtered);

    return true;
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();

// Export predefined agents for reference
export { PREDEFINED_AGENTS };

