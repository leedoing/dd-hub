import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log('Session request headers:', request.headers);
    const session = await getServerSession();
    console.log('Session data:', session);
    return NextResponse.json(session);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
} 