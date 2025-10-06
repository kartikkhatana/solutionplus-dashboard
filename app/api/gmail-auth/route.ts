import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/email-automation'
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/email-automation';

  if (action === 'authorize') {
    // Generate authorization URL with explicit redirect_uri
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      redirect_uri: redirectUri
    });

    console.log('Generated auth URL with redirect_uri:', redirectUri);
    return NextResponse.json({ authUrl });
  }

  if (action === 'callback') {
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    try {
      console.log('Attempting to exchange code for tokens...');
      console.log('Using redirect_uri:', redirectUri);
      
      // Exchange code for tokens with explicit redirect_uri
      const { tokens } = await oauth2Client.getToken({
        code: code,
        redirect_uri: redirectUri
      });
      
      oauth2Client.setCredentials(tokens);
      
      console.log('Successfully obtained tokens');

      // In production, store tokens securely (database, encrypted storage)
      return NextResponse.json({ 
        success: true, 
        tokens: tokens,
        message: 'Successfully authenticated with Gmail'
      });
    } catch (error: any) {
      console.error('Error getting tokens:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      
      return NextResponse.json({ 
        error: error.message || 'Failed to authenticate',
        details: 'Check that your Google OAuth redirect URI matches exactly: ' + redirectUri
      }, { status: 500 });
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
