'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Wrench, 
  Brain, 
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import type { CallbackEventData } from '@/types/callbacks';

interface ExecutionMonitorProps {
  events: CallbackEventData[];
  isOpen?: boolean;
  onToggle?: () => void;
  onClear?: () => void;
}

export default function ExecutionMonitor({
  events,
  isOpen = true,
  onToggle,
  onClear,
}: ExecutionMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const getEventIcon = (event: CallbackEventData) => {
    switch (event.type) {
      case 'agent_start':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'agent_end':
        return event.success ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        );
      case 'llm_start':
      case 'llm_end':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'tool_start':
      case 'tool_end':
        return <Wrench className="w-4 h-4 text-orange-500" />;
      case 'iteration_start':
      case 'iteration_end':
        return <Loader className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventColor = (event: CallbackEventData) => {
    switch (event.type) {
      case 'agent_start':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'agent_end':
        return event.success
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-red-500/10 border-red-500/20';
      case 'llm_start':
      case 'llm_end':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'tool_start':
      case 'tool_end':
        return 'bg-orange-500/10 border-orange-500/20';
      case 'iteration_start':
      case 'iteration_end':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'complete':
        return 'bg-green-500/10 border-green-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatEvent = (event: CallbackEventData) => {
    const time = new Date(event.timestamp).toLocaleTimeString();
    
    switch (event.type) {
      case 'agent_start':
        return {
          title: 'Agent Started',
          description: `Prompt: ${event.prompt.substring(0, 50)}...`,
          details: `Tools: ${event.tools?.join(', ') || 'none'}`,
        };
      case 'agent_end':
        return {
          title: event.success ? 'Agent Completed' : 'Agent Failed',
          description: event.output?.substring(0, 100) || 'No output',
          details: `Execution time: ${event.executionTime}ms | Tool calls: ${event.toolCalls || 0}`,
        };
      case 'llm_start':
        return {
          title: 'LLM Call Started',
          description: `Processing ${event.messages} message(s)`,
          details: event.iteration ? `Iteration ${event.iteration}` : '',
        };
      case 'llm_end':
        return {
          title: 'LLM Call Completed',
          description: `Response: ${event.response.substring(0, 100)}...`,
          details: `Duration: ${event.duration}ms`,
        };
      case 'tool_start':
        return {
          title: `Tool: ${event.toolName}`,
          description: `Parameters: ${JSON.stringify(event.parameters).substring(0, 80)}...`,
          details: event.iteration ? `Iteration ${event.iteration}` : '',
        };
      case 'tool_end':
        return {
          title: `Tool: ${event.toolName} ${event.success ? 'Completed' : 'Failed'}`,
          description: event.success
            ? `Result: ${JSON.stringify(event.result).substring(0, 80)}...`
            : `Error occurred`,
          details: `Duration: ${event.duration}ms`,
        };
      case 'iteration_start':
        return {
          title: `Iteration ${event.iteration}/${event.maxIterations}`,
          description: 'Agent reasoning step',
          details: '',
        };
      case 'iteration_end':
        return {
          title: `Iteration ${event.iteration} Complete`,
          description: `Action: ${event.action}`,
          details: '',
        };
      case 'error':
        return {
          title: 'Error',
          description: event.error,
          details: `Type: ${event.errorType}`,
        };
      case 'complete':
        return {
          title: 'Execution Complete',
          description: event.success ? 'Successfully completed' : 'Failed',
          details: `Time: ${event.totalExecutionTime}ms | Iterations: ${event.totalIterations} | Tools: ${event.totalToolCalls}`,
        };
      default:
        return {
          title: event.type,
          description: '',
          details: '',
        };
    }
  };

  const metrics = {
    totalEvents: events.length,
    toolCalls: events.filter(e => e.type === 'tool_start').length,
    errors: events.filter(e => e.type === 'error').length,
    totalTime: events.find(e => e.type === 'complete')?.totalExecutionTime || 0,
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white/10 border-b border-white/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="font-semibold text-white">Execution Monitor</h3>
            <p className="text-xs text-white/70">
              {metrics.totalEvents} events | {metrics.toolCalls} tools | {metrics.errors} errors
              {metrics.totalTime > 0 && ` | ${metrics.totalTime}ms`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClear && (
            <button
              onClick={onClear}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Clear events"
            >
              <Trash2 className="w-4 h-4 text-white/70" />
            </button>
          )}
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              onToggle?.();
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-white/70" />
            ) : (
              <ChevronUp className="w-4 h-4 text-white/70" />
            )}
          </button>
        </div>
      </div>

      {/* Events List */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {events.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No events yet</p>
              <p className="text-xs mt-1">Events will appear here as the agent executes</p>
            </div>
          ) : (
            events.map((event, index) => {
              const formatted = formatEvent(event);
              const time = new Date(event.timestamp).toLocaleTimeString();
              
              return (
                <div
                  key={index}
                  className={`${getEventColor(event)} border rounded-lg p-3 transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getEventIcon(event)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-white text-sm">{formatted.title}</h4>
                        <span className="text-xs text-white/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {time}
                        </span>
                      </div>
                      {formatted.description && (
                        <p className="text-xs text-white/70 mb-1">{formatted.description}</p>
                      )}
                      {formatted.details && (
                        <p className="text-xs text-white/50">{formatted.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={eventsEndRef} />
        </div>
      )}
    </div>
  );
}

