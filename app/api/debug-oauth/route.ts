import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    clientId: process.env.GOOGLE_CLIENT_ID || 'NOT SET',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET (hidden)' : 'NOT SET',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  });
}
