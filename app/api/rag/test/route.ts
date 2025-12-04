/**
 * Test RAG Route
 * Simple test to verify route is working
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "RAG test route is working!" 
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: "RAG POST route is working!",
    method: "POST"
  });
}

