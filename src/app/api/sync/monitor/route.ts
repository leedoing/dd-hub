import { NextResponse } from 'next/server';
import { syncMonitors } from '@/lib/datadog-service';

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    
    if (!formData) {
      return NextResponse.json(
        { success: false, error: 'No form data provided' },
        { status: 400 }
      );
    }

    console.log('Monitor API Route - Received request:', {
      ...formData,
      sourceApiKey: '[HIDDEN]',
      sourceAppKey: '[HIDDEN]',
      targetApiKey: '[HIDDEN]',
      targetAppKey: '[HIDDEN]'
    });
    
    const result = await syncMonitors(formData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Monitor API Route - Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
} 