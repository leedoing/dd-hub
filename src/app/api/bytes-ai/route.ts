import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, session_id, user_id, is_new_session } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Generate a session ID if not provided
    const sessionId = session_id || uuidv4();
    
    // Get the server session to extract user information if not provided
    const session = await getServerSession();
    const userId = user_id || session?.user?.email || 'anonymous';

    console.log('Calling Lambda with:', { 
      query, 
      session_id: sessionId, 
      user_id: userId,
      is_new_session: is_new_session
    });

    // 모든 요청 헤더 로깅
    console.log('All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    // 헤더 설정
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 클라이언트에서 전달된 Datadog 트레이싱 헤더가 있으면 추가
    const datadogHeaders = [
      'x-datadog-trace-id',
      'x-datadog-parent-id',
      'x-datadog-sampling-priority',
      'x-datadog-origin'
    ];
    
    let foundDatadogHeaders = false;
    for (const header of datadogHeaders) {
      const value = request.headers.get(header);
      if (value) {
        // 쉼표로 구분된 값이 있는 경우 첫 번째 값만 사용
        const cleanValue = value.split(',')[0].trim();
        console.log(`Found Datadog header: ${header}=${value} (using: ${cleanValue})`);
        
        // 헤더 이름을 소문자로 통일
        headers[header.toLowerCase()] = cleanValue;
        foundDatadogHeaders = true;
      }
    }
    
    if (!foundDatadogHeaders) {
      console.log('No Datadog tracing headers found in request');
    }

    console.log('Lambda request headers:', headers);

    // Call the Lambda function without streaming
    const lambdaResponse = await fetch(
      'https://tevypdyuwkuqnedfkcrfbwkvxa0gmueq.lambda-url.ap-northeast-2.on.aws/',
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          query, 
          session_id: sessionId,
          user_id: userId,
          is_new_session: is_new_session
        }),
      }
    );

    if (!lambdaResponse.ok) {
      throw new Error(`Lambda responded with status: ${lambdaResponse.status}`);
    }

    // Get the full response from Lambda
    const responseText = await lambdaResponse.text();
    console.log('Lambda response length:', responseText.length);
    
    // Check if the response is empty
    if (!responseText.trim()) {
      return NextResponse.json(
        { error: 'Empty response from Lambda' },
        { status: 500 }
      );
    }
    
    try {
      // Try to parse the response as JSON
      const responseObj = JSON.parse(responseText);
      console.log('Lambda response parsed as JSON');
      
      // Return the response directly
      return NextResponse.json(responseObj);
    } catch (e) {
      // If JSON parsing fails, return the raw text
      console.log('Failed to parse Lambda response as JSON, returning raw text');
      return new Response(responseText, {
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    console.error('Error calling ByteAI:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 