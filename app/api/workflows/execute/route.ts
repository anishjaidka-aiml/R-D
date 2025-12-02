import { NextRequest, NextResponse } from 'next/server';
import { Workflow } from '@/types/workflow';
import { WorkflowExecutor } from '@/lib/workflow-executor';

/**
 * API Route to execute a workflow
 * 
 * POST /api/workflows/execute
 * 
 * Body:
 * {
 *   workflow: Workflow;
 *   triggerData?: any;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow, triggerData } = body;

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow is required' },
        { status: 400 }
      );
    }

    console.log(`\n📥 Received workflow execution request`);
    console.log(`   Workflow: ${workflow.name}`);
    console.log(`   Nodes: ${workflow.nodes?.length || 0}`);

    // Create executor and run
    const executor = new WorkflowExecutor(workflow as Workflow, triggerData);
    const execution = await executor.execute();

    console.log(`📤 Returning execution result`);
    console.log(`   Status: ${execution.status}`);
    console.log(`   Logs: ${execution.logs?.length || 0}\n`);

    return NextResponse.json(execution);
  } catch (error: any) {
    console.error('❌ Workflow execution API error:', error);
    return NextResponse.json(
      {
        id: 'error',
        workflowId: 'unknown',
        status: 'error',
        logs: [{
          nodeId: 'error',
          nodeName: 'Error',
          status: 'error',
          error: error.message || 'Failed to execute workflow',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        }],
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

