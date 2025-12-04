/**
 * Multi-Agent System - Supervisor Agent
 * 
 * Analyzes tasks and routes them to appropriate specialist agents
 */

import { createAIMLClient } from '../client';
import { agentRegistry } from './agent-registry';
import { SupervisorDecision, AgentType } from './agent-types';
import { parseJSON } from '../parsers';

/**
 * Get supervisor agent definition
 */
function getSupervisorAgent() {
  const supervisor = agentRegistry.get('supervisor-agent');
  if (!supervisor) {
    throw new Error('Supervisor agent not found in registry');
  }
  return supervisor;
}

/**
 * Analyze a task and determine which agents should handle it
 */
export async function analyzeTask(
  task: string,
  availableAgents: string[] = [],
  config?: {
    temperature?: number;
    model?: string;
  }
): Promise<SupervisorDecision> {
  const supervisor = getSupervisorAgent();
  const client = createAIMLClient({
    temperature: config?.temperature ?? supervisor.temperature ?? 0.5,
    model: config?.model ?? supervisor.model,
  });

  // Get available agents info
  const agentsInfo = availableAgents.length > 0
    ? availableAgents.map(id => {
        const agent = agentRegistry.get(id);
        return agent ? `${id}: ${agent.description}` : null;
      }).filter(Boolean).join('\n')
    : agentRegistry.getAll()
        .filter(a => a.type !== AgentType.SUPERVISOR)
        .map(a => `${a.id}: ${a.description}`)
        .join('\n');

  const prompt = `${supervisor.systemPrompt}

Task to analyze: "${task}"

Available agents:
${agentsInfo}

Analyze this task and determine which agent(s) should handle it. Consider:
- What type of work is needed?
- Which agents are best suited?
- Should agents work in parallel or sequentially?
- How should the task be broken down?

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations before or after. Just the raw JSON object.

Required JSON format (copy this exactly):
{
  "selectedAgents": ["agent-id-1", "agent-id-2"],
  "reasoning": "Why these agents were selected",
  "executionMode": "sequential",
  "taskBreakdown": [
    {"agent": "agent-id-1", "subtask": "What this agent should do"},
    {"agent": "agent-id-2", "subtask": "What this agent should do"}
  ]
}

Remember: Return ONLY the JSON object, nothing else.`;

  try {
    console.log('🤖 Supervisor analyzing task...');
    console.log(`   Task: ${task.substring(0, 100)}...`);

    const response = await client.invoke(prompt);
    const responseText = response.content as string;

    console.log(`   Supervisor raw response: ${responseText.substring(0, 500)}...`);

    // Try to parse JSON with auto-fix enabled
    let decision: SupervisorDecision;
    try {
      // Try direct JSON parse first
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          decision = JSON.parse(jsonMatch[0]) as SupervisorDecision;
          console.log(`✅ Parsed JSON directly from response`);
        } catch (directParseError: any) {
          // If direct parse fails, try with auto-fix parser
          console.warn(`⚠️  Direct parse failed, trying auto-fix parser...`);
          const parsed = await parseJSON(responseText, true); // Enable auto-fix
          decision = parsed as SupervisorDecision;
        }
      } else {
        // No JSON found, try auto-fix parser
        console.warn(`⚠️  No JSON found in response, trying auto-fix parser...`);
        const parsed = await parseJSON(responseText, true);
        decision = parsed as SupervisorDecision;
      }
    } catch (parseError: any) {
      console.error(`❌ All JSON parsing attempts failed: ${parseError.message}`);
      throw new Error(`Failed to parse supervisor response as JSON: ${parseError.message}`);
    }

    // Validate decision
    if (!decision.selectedAgents || !Array.isArray(decision.selectedAgents)) {
      throw new Error('Invalid supervisor decision: missing selectedAgents');
    }

    if (!decision.executionMode || !['parallel', 'sequential'].includes(decision.executionMode)) {
      decision.executionMode = 'sequential'; // Default
    }

    // Validate agent IDs
    const validAgents = decision.selectedAgents.filter(id => {
      const agent = agentRegistry.get(id);
      if (!agent) {
        console.warn(`⚠️  Supervisor selected unknown agent: ${id}`);
        return false;
      }
      return true;
    });

    if (validAgents.length === 0) {
      throw new Error('No valid agents selected by supervisor');
    }

    decision.selectedAgents = validAgents;

    console.log(`✅ Supervisor decision:`);
    console.log(`   Selected agents: ${decision.selectedAgents.join(', ')}`);
    console.log(`   Execution mode: ${decision.executionMode}`);
    console.log(`   Reasoning: ${decision.reasoning}`);

    return decision;
  } catch (error: any) {
    console.error('❌ Supervisor analysis failed:', error);
    
    // Fallback: use generalist agent
    console.log('⚠️  Falling back to generalist agent');
    return {
      selectedAgents: ['generalist-agent'],
      reasoning: 'Supervisor analysis failed, using generalist agent as fallback',
      executionMode: 'sequential',
      taskBreakdown: [
        {
          agent: 'generalist-agent',
          subtask: task,
        },
      ],
    };
  }
}

/**
 * Get supervisor agent definition
 */
export function getSupervisorAgentDefinition() {
  return getSupervisorAgent();
}

