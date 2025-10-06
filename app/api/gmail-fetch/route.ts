import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { tokens, senderEmail } = await request.json();

    if (!tokens) {
      return NextResponse.json({ error: 'No authentication tokens provided' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Build query to fetch emails from specific sender with attachments
    const query = senderEmail 
      ? `from:${senderEmail} has:attachment`
      : 'has:attachment';

    // List messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    });

    const messages = response.data.messages || [];

    if (messages.length === 0) {
      return NextResponse.json({ emails: [], message: 'No emails found' });
    }

    // Fetch full message details for each message
    const emailsData = await Promise.all(
      messages.slice(0, 20).map(async (message) => {
        try {
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          });

          const headers = fullMessage.data.payload?.headers || [];
          const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h) => h.name === 'From')?.value || 'Unknown';
          const to = headers.find((h) => h.name === 'To')?.value || 'Unknown';
          const date = headers.find((h) => h.name === 'Date')?.value || '';

          // Extract body
          let body = '';
          const parts = fullMessage.data.payload?.parts || [];
          for (const part of parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body = Buffer.from(part.body.data, 'base64').toString('utf-8');
              break;
            }
          }

          // Extract attachments metadata
          const attachments: any[] = [];
          const extractAttachments = (parts: any[]) => {
            for (const part of parts) {
              if (part.filename && part.body?.attachmentId) {
                attachments.push({
                  filename: part.filename,
                  mimeType: part.mimeType,
                  attachmentId: part.body.attachmentId,
                  size: part.body.size
                });
              }
              if (part.parts) {
                extractAttachments(part.parts);
              }
            }
          };

          if (fullMessage.data.payload?.parts) {
            extractAttachments(fullMessage.data.payload.parts);
          }

          return {
            id: message.id,
            threadId: fullMessage.data.threadId,
            subject,
            from,
            to,
            date,
            body: body.substring(0, 500), // Truncate body
            attachments,
            snippet: fullMessage.data.snippet
          };
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
          return null;
        }
      })
    );

    const validEmails = emailsData.filter((email) => email !== null);

    return NextResponse.json({ 
      emails: validEmails,
      count: validEmails.length,
      message: `Found ${validEmails.length} emails with attachments`
    });

  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch emails',
      details: error.message 
    }, { status: 500 });
  }
}
