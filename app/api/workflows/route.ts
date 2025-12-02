import { NextRequest, NextResponse } from 'next/server';
import { Workflow } from '@/types/workflow';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

async function readWorkflows(): Promise<Workflow[]> {
  try {
    const data = await fs.readFile(WORKFLOWS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeWorkflows(workflows: Workflow[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2));
}

export async function GET() {
  try {
    const workflows = await readWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const workflow: Workflow = await request.json();
    const workflows = await readWorkflows();
    
    const existingIndex = workflows.findIndex(w => w.id === workflow.id);
    if (existingIndex >= 0) {
      workflows[existingIndex] = workflow;
    } else {
      workflows.push(workflow);
    }
    
    await writeWorkflows(workflows);
    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save workflow' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }
    
    const workflows = await readWorkflows();
    const filtered = workflows.filter(w => w.id !== id);
    await writeWorkflows(filtered);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}
