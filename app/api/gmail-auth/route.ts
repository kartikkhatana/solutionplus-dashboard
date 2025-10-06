import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/email-automation'
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose'
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'authorize') {
    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    return NextResponse.json({ authUrl });
  }

  if (action === 'callback') {
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // In production, store tokens securely (database, encrypted storage)
      return NextResponse.json({ 
        success: true, 
        tokens: tokens,
        message: 'Successfully authenticated with Gmail'
      });
    } catch (error) {
      console.error('Error getting tokens:', error);
      return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const { tokens } = await request.json();
    
    if (!tokens) {
      return NextResponse.json({ error: 'No tokens provided' }, { status: 400 });
    }

    oauth2Client.setCredentials(tokens);

    // Verify tokens are valid
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    await gmail.users.getProfile({ userId: 'me' });

    return NextResponse.json({ 
      success: true,
      message: 'Tokens verified successfully'
    });
  } catch (error) {
    console.error('Error verifying tokens:', error);
    return NextResponse.json({ error: 'Invalid or expired tokens' }, { status: 401 });
  }
}
