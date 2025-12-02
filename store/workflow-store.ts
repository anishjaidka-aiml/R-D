/**
 * Workflow Store
 * 
 * Zustand store for managing workflows and executions
 */

import { create } from 'zustand';
import { Workflow, WorkflowExecution } from '@/types/workflow';

interface WorkflowStore {
  // Workflows
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  
  // Executions
  executions: WorkflowExecution[];
  currentExecution: WorkflowExecution | null;
  
  // Workflow actions
  setWorkflows: (workflows: Workflow[]) => void;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  
  // Execution actions
  addExecution: (execution: WorkflowExecution) => void;
  setCurrentExecution: (execution: WorkflowExecution | null) => void;
  updateExecution: (execution: WorkflowExecution) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflows: [],
  currentWorkflow: null,
  executions: [],
  currentExecution: null,

  setWorkflows: (workflows) => set({ workflows }),
  
  addWorkflow: (workflow) => 
    set((state) => ({ workflows: [...state.workflows, workflow] })),
  
  updateWorkflow: (workflow) =>
    set((state) => ({
      workflows: state.workflows.map((w) => (w.id === workflow.id ? workflow : w)),
      currentWorkflow: state.currentWorkflow?.id === workflow.id ? workflow : state.currentWorkflow,
    })),
  
  deleteWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
      currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
    })),
  
  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
  
  addExecution: (execution) =>
    set((state) => ({ executions: [execution, ...state.executions] })),
  
  setCurrentExecution: (execution) => set({ currentExecution: execution }),
  
  updateExecution: (execution) =>
    set((state) => ({
      executions: state.executions.map((e) => (e.id === execution.id ? execution : e)),
      currentExecution: state.currentExecution?.id === execution.id ? execution : state.currentExecution,
    })),
}));

