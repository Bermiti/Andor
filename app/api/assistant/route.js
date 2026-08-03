import { NextResponse } from 'next/server';
import { executeStructuredAssistantOperation } from '../../lib/server/structured-assistant';

export async function POST(request) {
  try {
    const body = await request.json();
    const { itinerary, command } = body || {};

    if (!itinerary || !command || !command.action) {
      return NextResponse.json({
        success: false,
        error: 'ASSISTANT_INVALID_INPUT',
        message: 'Itinerary and valid command payload are required.',
      }, { status: 400 });
    }

    const result = executeStructuredAssistantOperation(itinerary, command);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Structured Assistant API error:', error);
    return NextResponse.json({
      success: false,
      error: 'ASSISTANT_EXECUTION_FAILED',
      message: error.message,
    }, { status: 400 });
  }
}
