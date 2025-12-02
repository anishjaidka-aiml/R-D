/**
 * Pre-Built Workflow Templates
 * 
 * Ready-to-use example workflows that users can import
 */

import { Workflow } from '@/types/workflow';
import { generateId } from './utils';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>;
}

/**
 * All available templates
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // 1. Simple Greeting
  {
    id: 'simple-greeting',
    name: 'Simple Greeting',
    description: 'Basic workflow showing variable usage with LLM',
    category: 'beginner',
    tags: ['llm', 'variables', 'simple'],
    workflow: {
      name: 'Simple Greeting',
      description: 'Generates a personalized greeting using variables',
      nodes: [
        {
          id: 'trigger-1',
          type: 'custom',
          position: { x: 250, y: 100 },
          data: {
            label: 'Trigger',
            type: 'trigger',
            description: 'Start point',
            config: {
              triggerData: JSON.stringify({
                name: 'Alice',
                interest: 'AI and machine learning'
              }, null, 2)
            }
          }
        },
        {
          id: 'llm-1',
          type: 'custom',
          position: { x: 250, y: 250 },
          data: {
            label: 'Generate Greeting',
            type: 'llm',
            description: 'Creates personalized greeting',
            config: {
              prompt: 'Write a warm, friendly greeting for {{trigger.name}} who is interested in {{trigger.interest}}. Make it 2 sentences and enthusiastic!'
            }
          }
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'trigger-1',
          target: 'llm-1'
        }
      ]
    }
  },

  // 2. Content Generator Chain
  {
    id: 'content-generator',
    name: 'Content Generator Chain',
    description: 'Multi-step workflow: title → outline → content',
    category: 'intermediate',
    tags: ['llm', 'content', 'chain'],
    workflow: {
      name: 'Content Generator',
      description: 'Generates title, outline, and content in multiple steps',
      nodes: [
        {
          id: 'trigger-1',
          type: 'custom',
          position: { x: 250, y: 50 },
          data: {
            label: 'Topic Input',
            type: 'trigger',
            config: {
              triggerData: JSON.stringify({
                topic: 'The Future of AI Agents'
              }, null, 2)
            }
          }
        },
        {
          id: 'llm-1',
          type: 'custom',
          position: { x: 250, y: 180 },
          data: {
            label: 'Generate Title',
            type: 'llm',
            config: {
              prompt: 'Create a catchy, professional title (5-8 words) for an article about: {{trigger.topic}}'
            }
          }
        },
        {
          id: 'llm-2',
          type: 'custom',
          position: { x: 250, y: 310 },
          data: {
            label: 'Create Outline',
            type: 'llm',
            config: {
              prompt: 'Create a 3-point outline for an article titled "{{llm_1.output}}". List 3 main points to cover.'
            }
          }
        },
        {
          id: 'llm-3',
          type: 'custom',
          position: { x: 250, y: 440 },
          data: {
            label: 'Write Introduction',
            type: 'llm',
            config: {
              prompt: 'Write an engaging 2-paragraph introduction for an article titled "{{llm_1.output}}" with this outline: {{llm_2.output}}'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-2', target: 'llm-3' }
      ]
    }
  },

  // 3. Conditional Scoring
  {
    id: 'conditional-scoring',
    name: 'Conditional Scoring',
    description: 'Branches workflow based on score value',
    category: 'intermediate',
    tags: ['condition', 'branching', 'logic'],
    workflow: {
      name: 'Score Evaluator',
      description: 'Provides different feedback based on score',
      nodes: [
        {
          id: 'trigger-1',
          type: 'custom',
          position: { x: 250, y: 50 },
          data: {
            label: 'Score Input',
            type: 'trigger',
            config: {
              triggerData: JSON.stringify({
                studentName: 'John',
                score: 85
              }, null, 2)
            }
          }
        },
        {
          id: 'condition-1',
          type: 'custom',
          position: { x: 250, y: 180 },
          data: {
            label: 'Check Score',
            type: 'condition',
            config: {
              leftValue: '{{trigger.score}}',
              operator: '>',
              rightValue: '70'
            }
          }
        },
        {
          id: 'llm-high',
          type: 'custom',
          position: { x: 100, y: 310 },
          data: {
            label: 'High Score Message',
            type: 'llm',
            config: {
              prompt: 'Write an enthusiastic congratulations message for {{trigger.studentName}} who scored {{trigger.score}} points! Make it 2 sentences and very positive!'
            }
          }
        },
        {
          id: 'llm-low',
          type: 'custom',
          position: { x: 400, y: 310 },
          data: {
            label: 'Low Score Message',
            type: 'llm',
            config: {
              prompt: 'Write an encouraging, supportive message for {{trigger.studentName}} who scored {{trigger.score}} points. Be kind and motivating in 2 sentences.'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'condition-1' },
        { id: 'e2', source: 'condition-1', target: 'llm-high', sourceHandle: 'true' },
        { id: 'e3', source: 'condition-1', target: 'llm-low', sourceHandle: 'false' }
      ]
    }
  },

  // 4. Variable Showcase
  {
    id: 'variable-demo',
    name: 'Variable Showcase',
    description: 'Demonstrates nested variables and data flow',
    category: 'beginner',
    tags: ['variables', 'demo', 'tutorial'],
    workflow: {
      name: 'Variable Demo',
      description: 'Shows how to use variables with nested data',
      nodes: [
        {
          id: 'trigger-1',
          type: 'custom',
          position: { x: 250, y: 50 },
          data: {
            label: 'User Data',
            type: 'trigger',
            config: {
              triggerData: JSON.stringify({
                user: {
                  name: 'Sarah',
                  age: 28,
                  city: 'San Francisco'
                },
                interests: ['AI', 'robotics', 'space']
              }, null, 2)
            }
          }
        },
        {
          id: 'llm-1',
          type: 'custom',
          position: { x: 250, y: 200 },
          data: {
            label: 'Generate Profile',
            type: 'llm',
            config: {
              prompt: 'Create a fun 2-sentence bio for {{trigger.user.name}}, age {{trigger.user.age}}, who lives in {{trigger.user.city}} and loves {{trigger.interests}}. Make it engaging!'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'llm-1' }
      ]
    }
  },

  // 5. Email Draft Generator
  {
    id: 'email-draft',
    name: 'Email Draft Generator',
    description: 'Creates professional email drafts',
    category: 'intermediate',
    tags: ['email', 'business', 'writing'],
    workflow: {
      name: 'Email Draft Generator',
      description: 'Generates professional email based on context',
      nodes: [
        {
          id: 'trigger-1',
          type: 'custom',
          position: { x: 250, y: 50 },
          data: {
            label: 'Email Context',
            type: 'trigger',
            config: {
              triggerData: JSON.stringify({
                recipient: 'John Smith',
                purpose: 'follow up on meeting',
                tone: 'professional and friendly',
                keyPoints: 'discuss Q4 strategy, schedule next meeting'
              }, null, 2)
            }
          }
        },
        {
          id: 'llm-1',
          type: 'custom',
          position: { x: 250, y: 200 },
          data: {
            label: 'Generate Subject',
            type: 'llm',
            config: {
              prompt: 'Create a professional email subject line (5-8 words) for an email to {{trigger.recipient}} to {{trigger.purpose}}'
            }
          }
        },
        {
          id: 'llm-2',
          type: 'custom',
          position: { x: 250, y: 350 },
          data: {
            label: 'Write Email Body',
            type: 'llm',
            config: {
              prompt: 'Write a {{trigger.tone}} email body to {{trigger.recipient}} about: {{trigger.keyPoints}}. Keep it concise (3-4 sentences). Subject: {{llm_1.output}}'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'llm-2' }
      ]
    }
  },

  // 6. Email Assistant with Memory
  {
    id: 'email-assistant-memory',
    name: 'Email Assistant with Memory',
    description: 'AI agent that drafts and sends emails using conversation context',
    category: 'intermediate',
    tags: ['agent', 'memory', 'email', 'automation'],
    workflow: {
      name: 'Email Assistant with Memory',
      description: 'An intelligent email assistant that remembers conversation context and can draft/send emails based on your instructions',
      nodes: [
        {
          id: 'trigger-1',
          type: 'custom',
          position: { x: 250, y: 100 },
          data: {
            label: 'Email Request',
            type: 'trigger',
            description: 'Provide email requirements',
            config: {
              triggerData: JSON.stringify({
                recipient: 'team@company.com',
                context: 'We completed Phase 6 - Memory & Conversations feature',
                tone: 'professional and enthusiastic'
              }, null, 2)
            }
          }
        },
        {
          id: 'agent-1',
          type: 'custom',
          position: { x: 250, y: 250 },
          data: {
            label: 'Email Agent',
            type: 'agent',
            description: 'AI agent with memory',
            config: {
              systemPrompt: 'You are a professional email assistant. You help draft and send emails based on the context provided. Always create well-formatted, professional emails.',
              prompt: `Draft an email with these details:
Recipient: {{trigger.recipient}}
Context: {{trigger.context}}
Tone: {{trigger.tone}}

Please create a professional email and send it using the send_email tool.`,
              tools: ['send_email'],
              temperature: 0.7,
              maxIterations: 5,
              enableMemory: true,
              conversationId: 'email-workflow-session'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'agent-1' }
      ]
    }
  }
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.category === category);
}

/**
 * Convert template to workflow (with new IDs)
 */
export function templateToWorkflow(template: WorkflowTemplate): Workflow {
  const now = new Date().toISOString();
  return {
    ...template.workflow,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
}

