import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Initialize Gmail API
const getGmailClient = async (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Parse PDF content - Using dynamic import to avoid module issues
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return '';
  }
}

// Parse Excel content
async function parseExcel(buffer: Buffer): Promise<any> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    return data;
  } catch (error) {
    console.error('Error parsing Excel:', error);
    return [];
  }
}

// Parse Word document
async function parseWord(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing Word:', error);
    return '';
  }
}

// Extract invoice data from parsed content
function extractInvoiceData(content: string, filename: string) {
  const invoiceData: any = {
    filename,
    extractedAt: new Date().toISOString(),
    rawContent: content.substring(0, 1000), // First 1000 chars
  };

  // Extract invoice number
  const invoiceNumberMatch = content.match(/invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i);
  if (invoiceNumberMatch) {
    invoiceData.invoiceNumber = invoiceNumberMatch[1];
  }

  // Extract date
  const dateMatch = content.match(/date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dateMatch) {
    invoiceData.invoiceDate = dateMatch[1];
  }

  // Extract amount/total
  const amountMatch = content.match(/total\s*:?\s*\$?\s*([\d,]+\.?\d*)/i) ||
                      content.match(/amount\s*:?\s*\$?\s*([\d,]+\.?\d*)/i);
  if (amountMatch) {
    invoiceData.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // Extract vendor/from
  const vendorMatch = content.match(/from\s*:?\s*([^\n]+)/i) ||
                      content.match(/vendor\s*:?\s*([^\n]+)/i);
  if (vendorMatch) {
    invoiceData.vendor = vendorMatch[1].trim();
  }

  return invoiceData;
}

// GET - Fetch forwarded emails from current date
export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    const gmail = await getGmailClient(accessToken);
    
    // Get current date in YYYY/MM/DD format
    const today = new Date();
    const dateString = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    
    // Search for forwarded emails from today
    const query = `is:forwarded after:${dateString}`;
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50,
    });

    const messages = response.data.messages || [];
    const processedEmails: any[] = [];

    // Process each email
    for (const message of messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full',
      });

      const headers = fullMessage.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      const emailData: any = {
        id: message.id,
        subject,
        from,
        date,
        attachments: [],
        processedAttachments: [],
      };

      // Process attachments
      const parts = fullMessage.data.payload?.parts || [];
      
      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          const attachment = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: message.id!,
            id: part.body.attachmentId,
          });

          const buffer = Buffer.from(attachment.data.data!, 'base64');
          const filename = part.filename;
          const mimeType = part.mimeType || '';

          let parsedContent = '';
          let structuredData: any = null;

          // Parse based on file type
          if (mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf')) {
            parsedContent = await parsePDF(buffer);
            structuredData = extractInvoiceData(parsedContent, filename);
          } else if (
            mimeType.includes('spreadsheet') ||
            mimeType.includes('excel') ||
            filename.toLowerCase().endsWith('.xlsx') ||
            filename.toLowerCase().endsWith('.xls')
          ) {
            const excelData = await parseExcel(buffer);
            structuredData = {
              filename,
              type: 'excel',
              data: excelData,
              extractedAt: new Date().toISOString(),
            };
          } else if (
            mimeType.includes('word') ||
            filename.toLowerCase().endsWith('.docx')
          ) {
            parsedContent = await parseWord(buffer);
            structuredData = extractInvoiceData(parsedContent, filename);
          }

          emailData.attachments.push({
            filename,
            mimeType,
            size: buffer.length,
          });

          if (structuredData) {
            emailData.processedAttachments.push(structuredData);
          }
        }
      }

      processedEmails.push(emailData);
    }

    return NextResponse.json({
      success: true,
      date: dateString,
      emailCount: processedEmails.length,
      emails: processedEmails,
    });
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

// POST - Process specific email and create invoice workflow
export async function POST(request: NextRequest) {
  try {
    const { emailId, accessToken, attachmentData } = await request.json();

    if (!emailId || !accessToken || !attachmentData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Here you would integrate with your existing invoice processing workflow
    // For now, we'll return a success response
    const workflowData = {
      id: `workflow-${Date.now()}`,
      emailId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      invoiceData: attachmentData,
    };

    return NextResponse.json({
      success: true,
      workflow: workflowData,
    });
  } catch (error: any) {
    console.error('Error processing email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process email' },
      { status: 500 }
    );
  }
}
