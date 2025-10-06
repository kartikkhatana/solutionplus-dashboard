import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { tokens, threadId, messageId, to, subject, body } = await request.json();

    if (!tokens || !to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email message with proper reply formatting
    let replySubject = subject;
    if (messageId && threadId && !subject.toLowerCase().startsWith('re:')) {
      replySubject = `Re: ${subject}`;
    }

    const emailLines = [
      `To: ${to}`,
      `Subject: ${replySubject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body
    ];

    // If messageId is provided, add proper reply headers for threading
    if (messageId && threadId) {
      console.log('Original messageId:', messageId);
      console.log('ThreadId:', threadId);
      // Ensure the messageId is properly formatted (should already include < >)
      const formattedMessageId = messageId.startsWith('<') ? messageId : `<${messageId}>`;
      console.log('Formatted messageId:', formattedMessageId);
      
      // Insert reply headers at the correct position (after Subject, before Content-Type)
      emailLines.splice(2, 0, `In-Reply-To: ${formattedMessageId}`, `References: ${formattedMessageId}`);
      console.log('Email headers with reply info:', emailLines.slice(0, 8));
    }

    const email = emailLines.join('\r\n');
    const encodedMessage = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Send email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId || undefined
      }
    });

    return NextResponse.json({ 
      success: true,
      messageId: result.data.id,
      threadId: result.data.threadId,
      message: 'Email sent successfully'
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error.message 
    }, { status: 500 });
  }
}
