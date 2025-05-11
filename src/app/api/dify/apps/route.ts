import { NextResponse } from 'next/server';

/**
 * GET /api/dify/apps
 * Proxy to Dify /v1/apps endpoint
 */
export async function GET() {
  // Hardcoded Dify apps list with input schema
  const data = {
    data: [
      // {
      //   id: 'af0b9c2d-128b-4e2a-91a5-08af74c38f67',
      //   name: 'Workflow',
      //   inputSchema: [
      //     { name: 'paramA', label: 'パラメータA', type: 'string' },
      //     { name: 'paramB', label: 'パラメータB', type: 'number' },
      //   ],
      // },
      {
        id: '7624f2a0-ca24-48d4-ab57-806e77045e3a',
        name: 'Chat',
        inputSchema: [],
      },
    ],
  };
  return NextResponse.json(data);
}
