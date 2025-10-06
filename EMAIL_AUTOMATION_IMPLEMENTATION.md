# Email Semi-Automation - Complete Implementation Guide

## Overview
This document outlines the complete implementation of the Email Semi-Automation workflow for the SolutionPlus Dashboard.

## Architecture

### 1. Gmail OAuth Setup

#### Prerequisites
1. Create a Google Cloud Project at https://console.cloud.google.com
2. Enable Gmail API
3. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/email-automation`
4. Download credentials and add to `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/email-automation
EMAIL_SENDER_FILTER=xyz@gmail.com
```

### 2. API Routes Created

#### `/api/gmail-auth` - OAuth Authentication
- **GET** with `action=authorize`: Returns Google OAuth URL
- **GET** with `action=callback`: Handles OAuth callback and returns tokens
- **POST**: Verifies existing tokens

#### `/api/gmail-fetch` - Fetch Emails
- **POST**: Fetches emails from Gmail with attachments
- Request body:
  ```json
  {
    "tokens": {...},
    "senderEmail": "xyz@gmail.com"
  }
  ```
- Returns list of emails with attachments metadata

#### `/api/gmail-process-pdfs` - Process PDF Attachments
- **POST**: Downloads and processes PDF attachments
- Request body:
  ```json
  {
    "tokens": {...},
    "messageId": "email-id",
    "attachmentId": "attachment-id",
    "filename": "invoice.pdf"
  }
  ```
- Returns extracted data from PDF

### 3. Workflow Stages

```
Home → Gmail Auth → Email Fetch → PDF Processing → Matching → Output → Done
```

#### Stage 1: Gmail Authentication
- User clicks "Start Email Workflow"
- System initiates OAuth flow
- User authorizes Gmail access
- Tokens stored in session/state

#### Stage 2: Email Fetching
- System fetches emails from configured sender
- Filters for emails with PDF attachments
- Displays list of emails with attachment counts

#### Stage 3: PDF Processing
- User selects emails to process
- System downloads PDF attachments
- Extracts data using pdf-parse library
- Identifies PO vs Invoice documents

#### Stage 4: Data Matching
- Groups PO and Invoice pairs by vendor
- Performs field-by-field comparison
- Calculates match scores
- Identifies discrepancies

#### Stage 5: Output & Actions
- Shows validation results
- User can approve/reject
- Sends email notifications
- Returns to home

### 4. Data Extraction from PDFs

The system extracts:
- Document type (PO or Invoice)
- Vendor name
- Document number (PO# or Invoice#)
- Total amount
- Date
- Tax amount
- Payment terms
- Shipping address

Pattern matching is used for extraction. For production, consider:
- OCR services (Google Vision API, AWS Textract)
- AI/ML models for better accuracy
- Template matching for known formats

### 5. Matching Algorithm

```javascript
function matchPOAndInvoice(po, invoice) {
  const fields = [
    { name: 'Vendor Name', poVal: po.vendorName, invVal: invoice.vendorName },
    { name: 'Amount', poVal: po.amount, invVal: invoice.amount },
    { name: 'Date', poVal: po.date, invVal: invoice.date },
    { name: 'Tax', poVal: po.taxAmount, invVal: invoice.taxAmount },
    { name: 'Payment Terms', poVal: po.paymentTerms, invVal: invoice.paymentTerms },
    { name: 'Address', poVal: po.shippingAddress, invVal: invoice.shippingAddress }
  ];

  const comparisons = fields.map(field => ({
    field: field.name,
    poValue: field.poVal,
    invoiceValue: field.invVal,
    match: compareValues(field.poVal, field.invVal)
  }));

  const matchScore = (comparisons.filter(c => c.match).length / comparisons.length) * 100;
  
  return { comparisons, matchScore };
}
```

### 6. Frontend Implementation

The `semi-automated-workflow/page.tsx` needs:

#### Additional State Variables
```typescript
const [gmailTokens, setGmailTokens] = useState(null);
const [emails, setEmails] = useState([]);
const [selectedEmails, setSelectedEmails] = useState(new Set());
const [pdfData, setPdfData] = useState({});
const [isAuthenticating, setIsAuthenticating] = useState(false);
```

#### Gmail Authentication Handler
```typescript
const handleGmailAuth = async () => {
  setIsAuthenticating(true);
  try {
    const response = await fetch('/api/gmail-auth?action=authorize');
    const { authUrl } = await response.json();
    
    // Open auth window
    const authWindow = window.open(authUrl, '_blank', 'width=500,height=600');
    
    // Listen for callback
    window.addEventListener('message', handleAuthCallback);
  } catch (error) {
    showError('Failed to authenticate');
  }
};
```

#### Email Fetching Handler
```typescript
const fetchEmails = async () => {
  try {
    const response = await fetch('/api/gmail-fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokens: gmailTokens,
        senderEmail: process.env.EMAIL_SENDER_FILTER
      })
    });
    
    const { emails } = await response.json();
    setEmails(emails);
    setWorkflowStage('extraction');
  } catch (error) {
    showError('Failed to fetch emails');
  }
};
```

#### PDF Processing Handler
```typescript
const processPDFs = async () => {
  setIsProcessing(true);
  setWorkflowStage('processing');
  
  const selectedEmailsList = emails.filter(e => selectedEmails.has(e.id));
  const allPDFs = [];
  
  for (const email of selectedEmailsList) {
    for (const attachment of email.attachments) {
      if (attachment.mimeType === 'application/pdf') {
        try {
          const response = await fetch('/api/gmail-process-pdfs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokens: gmailTokens,
              messageId: email.id,
              attachmentId: attachment.attachmentId,
              filename: attachment.filename
            })
          });
          
          const { extractedData } = await response.json();
          allPDFs.push({
            emailId: email.id,
            filename: attachment.filename,
            data: extractedData
          });
        } catch (error) {
          console.error(`Failed to process ${attachment.filename}`);
        }
      }
    }
  }
  
  // Match POs and Invoices
  const matched = matchPOsAndInvoices(allPDFs);
  setProcessedData(matched);
  setWorkflowStage('output');
  setIsProcessing(false);
};
```

### 7. Security Considerations

1. **Token Storage**: Never store tokens in localStorage
   - Use httpOnly cookies
   - Encrypt tokens before storing
   - Implement token rotation

2. **API Security**:
   - Add rate limiting
   - Implement CORS properly
   - Validate all inputs
   - Use environment variables for secrets

3. **Email Access**:
   - Request minimal OAuth scopes
   - Filter by specific sender
   - Implement access controls

### 8. Testing Checklist

- [ ] Gmail OAuth flow works
- [ ] Tokens are properly stored and refreshed
- [ ] Emails are fetched correctly
- [ ] PDF parsing extracts data accurately
- [ ] PO and Invoice matching works
- [ ] Validation scores are calculated correctly
- [ ] Approve/Reject emails are sent
- [ ] Error handling for network failures
- [ ] Error handling for invalid PDFs
- [ ] Error handling for expired tokens

### 9. Production Recommendations

1. **Improve PDF Extraction**:
   - Use OCR for scanned PDFs (Tesseract, Google Vision API)
   - Implement ML models for better accuracy
   - Support multiple PDF formats

2. **Database Integration**:
   - Store processed emails in MongoDB
   - Track processing history
   - Implement audit logs

3. **Queue System**:
   - Use job queue for PDF processing (Bull, BullMQ)
   - Process PDFs asynchronously
   - Handle large volumes

4. **Monitoring**:
   - Add logging (Winston, Pino)
   - Track processing metrics
   - Set up alerts for failures

5. **Scalability**:
   - Cache Gmail API responses
   - Implement pagination for large email volumes
   - Use worker threads for PDF processing

### 10. Deployment Steps

1. Set up environment variables in production
2. Configure Google OAuth redirect URLs for production domain
3. Set up SSL/TLS certificates
4. Configure CORS for production domain
5. Set up monitoring and logging
6. Test complete workflow in production
7. Document user instructions

## Next Steps

1. Complete frontend integration in `semi-automated-workflow/page.tsx`
2. Add Gmail authentication UI components
3. Add email list display components
4. Test with real Gmail account
5. Refine PDF extraction patterns
6. Add comprehensive error handling
7. Implement production recommendations
