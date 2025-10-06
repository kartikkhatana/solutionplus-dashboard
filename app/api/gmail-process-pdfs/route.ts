import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import pdf from 'pdf-parse';

interface ExtractedData {
  type: 'PO' | 'Invoice';
  vendorName: string;
  documentNumber: string;
  amount: number;
  date: string;
  taxAmount: number;
  paymentTerms: string;
  shippingAddress: string;
  lineItems: any[];
}

export async function POST(request: NextRequest) {
  try {
    const { tokens, messageId, attachmentId, filename } = await request.json();

    if (!tokens || !messageId || !attachmentId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Download attachment
    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId
    });

    if (!attachment.data.data) {
      return NextResponse.json({ error: 'Failed to download attachment' }, { status: 500 });
    }

    // Decode base64 attachment data
    const buffer = Buffer.from(attachment.data.data, 'base64');

    // Parse PDF
    const pdfData = await pdf(buffer);
    const text = pdfData.text;

    // Extract data from PDF text using pattern matching
    const extractedData = await extractDataFromPDF(text, filename);

    return NextResponse.json({ 
      success: true,
      filename,
      extractedData,
      rawText: text.substring(0, 1000) // First 1000 chars for debugging
    });

  } catch (error: any) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to process PDF',
      details: error.message 
    }, { status: 500 });
  }
}

async function extractDataFromPDF(text: string, filename: string): Promise<ExtractedData> {
  // Determine document type
  const isPO = /purchase\s+order|p\.?o\.?\s+#?/i.test(text) || /^po[-_]/i.test(filename);
  const isInvoice = /invoice|inv\s+#?/i.test(text) || /^inv[-_]/i.test(filename);

  // Extract vendor name (simplified pattern)
  const vendorMatch = text.match(/(?:vendor|from|bill\s+to|supplier)[\s:]+([^\n]+)/i);
  const vendorName = vendorMatch ? vendorMatch[1].trim().split('\n')[0] : 'Unknown Vendor';

  // Extract document number
  let documentNumber = 'Unknown';
  if (isPO) {
    const poMatch = text.match(/(?:p\.?o\.?|purchase\s+order)\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    documentNumber = poMatch ? poMatch[1] : 'PO-' + Date.now();
  } else if (isInvoice) {
    const invMatch = text.match(/(?:invoice|inv)\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    documentNumber = invMatch ? invMatch[1] : 'INV-' + Date.now();
  }

  // Extract amount
  const amountMatch = text.match(/(?:total|amount|grand\s+total)[\s:]+\$?\s*([0-9,]+\.?\d*)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

  // Extract date
  const dateMatch = text.match(/(?:date|issued)[\s:]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

  // Extract tax
  const taxMatch = text.match(/(?:tax|vat)[\s:]+\$?\s*([0-9,]+\.?\d*)/i);
  const taxAmount = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : amount * 0.05; // Default 5% if not found

  // Extract payment terms
  const termsMatch = text.match(/(?:payment\s+terms|terms)[\s:]+([^\n]+)/i);
  const paymentTerms = termsMatch ? termsMatch[1].trim() : 'Net 30';

  // Extract shipping address
  const addressMatch = text.match(/(?:ship\s+to|shipping\s+address|delivery\s+address)[\s:]+([^\n]+(?:\n[^\n]+){0,2})/i);
  const shippingAddress = addressMatch ? addressMatch[1].trim().replace(/\n/g, ', ') : 'Unknown Address';

  return {
    type: isPO ? 'PO' : 'Invoice',
    vendorName,
    documentNumber,
    amount,
    date,
    taxAmount,
    paymentTerms,
    shippingAddress,
    lineItems: []
  };
}
