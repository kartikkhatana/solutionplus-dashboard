# Email Automation Setup Guide

This guide will help you set up the automated email workflow feature that fetches forwarded emails from Gmail, parses attachments (PDF, Excel, Word), and processes them for invoice workflows.

## Prerequisites

- Node.js 18+ installed
- A Google Cloud Platform account
- MongoDB running (local or remote)

## Step 1: Google Cloud Platform Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your Project ID

### 1.2 Enable Gmail API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Click on "Gmail API" and click **Enable**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type (or Internal if using Google Workspace)
   - Fill in the required fields:
     - App name: "Invoice Workflow Dashboard"
     - User support email: Your email
     - Developer contact email: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.modify`
   - Add test users (your Gmail address)
   - Click **Save and Continue**

4. After configuring consent screen, create OAuth client ID:
   - Application type: **Web application**
   - Name: "Invoice Workflow Email Automation"
   - Authorized redirect URIs:
     - `http://localhost:3000/email-automation` (for development)
     - `https://yourdomain.com/email-automation` (for production)
   - Click **Create**

5. Download the credentials or copy:
   - Client ID
   - Client Secret

## Step 2: Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/invoice-workflow
   
   # Google Gmail API Configuration
   GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/email-automation
   
   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 3: Install Dependencies

The required packages have already been installed. If you need to reinstall:

```bash
npm install
```

Key packages added:
- `googleapis` - Google APIs client library
- `pdf-parse` - PDF document parsing
- `mammoth` - Word document parsing
- `xlsx` - Excel spreadsheet parsing (already installed)

## Step 4: Start the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/email-automation
   ```

## Step 5: Using the Email Automation Feature

### 5.1 Connect Gmail Account

1. Navigate to the **Email Automation** page from the sidebar
2. Click **Connect Gmail** button
3. You'll be redirected to Google's OAuth consent screen
4. Sign in with your Google account
5. Grant the requested permissions:
   - Read emails
   - Modify emails
6. You'll be redirected back to the application

### 5.2 Fetch Forwarded Emails

1. Once connected, click **Fetch Emails** button
2. The system will fetch all forwarded emails from today's date
3. Each email will be displayed with:
   - Subject
   - Sender
   - Date
   - Attachments count

### 5.3 Process Attachments

1. Click on an email to expand it
2. View the list of attachments
3. The system automatically:
   - Parses PDF files and extracts text
   - Parses Excel files and converts to JSON
   - Parses Word documents and extracts text
   - Attempts to extract invoice data (invoice number, date, amount, vendor)
4. Click **Process Invoice** button on any attachment to create a workflow

### 5.4 View Extracted Data

- Click on an email to see the extracted data in JSON format
- The system extracts common invoice fields:
  - Invoice Number
  - Invoice Date
  - Amount/Total
  - Vendor/From
  - Raw content preview

## Architecture Overview

### Backend Components

1. **`/api/gmail-auth/route.ts`**
   - Handles Gmail OAuth2 authentication
   - Generates authorization URLs
   - Exchanges authorization codes for access tokens

2. **`/api/email-automation/route.ts`**
   - GET: Fetches forwarded emails from current date
   - POST: Creates invoice workflows from extracted data
   - Parses PDF, Excel, and Word attachments
   - Extracts invoice information using regex patterns

### Frontend Components

1. **`/email-automation/page.tsx`**
   - Main UI for email automation
   - Gmail connection management
   - Email list and detail view
   - Attachment processing interface

### Data Flow

```
User → Connect Gmail → OAuth Flow → Access Token (stored in localStorage)
  ↓
Fetch Emails → Gmail API → Retrieve Forwarded Emails
  ↓
Parse Attachments → PDF/Excel/Word Parsers → Extract Text/Data
  ↓
Extract Invoice Data → Regex Patterns → Structured Data
  ↓
Process Invoice → Create Workflow → Save to Database
```

## Security Considerations

1. **Access Token Storage**
   - Currently stored in localStorage
   - For production: Consider using secure httpOnly cookies

2. **Token Refresh**
   - Implement token refresh mechanism for long-lived sessions
   - Current implementation uses short-lived access tokens

3. **Data Privacy**
   - Emails are fetched but not stored
   - Only extracted invoice data is saved
   - Consider implementing data retention policies

## Customization

### Modifying Invoice Data Extraction

Edit `/api/email-automation/route.ts` in the `extractInvoiceData` function:

```typescript
function extractInvoiceData(content: string, filename: string) {
  // Add your custom extraction patterns
  const customFieldMatch = content.match(/your-pattern/i);
  if (customFieldMatch) {
    invoiceData.customField = customFieldMatch[1];
  }
  // ... more patterns
}
```

### Adding New Document Types

To support additional file types, modify the attachment processing logic:

```typescript
// In /api/email-automation/route.ts
if (mimeType.includes('your-type') || filename.toLowerCase().endsWith('.ext')) {
  parsedContent = await parseYourType(buffer);
  structuredData = extractInvoiceData(parsedContent, filename);
}
```

## Troubleshooting

### Issue: "Access token required" error

**Solution:** 
- Click "Disconnect" and reconnect your Gmail account
- Check that OAuth credentials are correctly configured

### Issue: No emails fetched

**Solution:**
- Ensure you have forwarded emails in your inbox today
- Check Gmail API is enabled in Google Cloud Console
- Verify the query parameters in the API route

### Issue: Attachment parsing fails

**Solution:**
- Check file format is supported (PDF, XLSX, XLS, DOCX)
- Ensure file is not corrupted
- Check server logs for specific parsing errors

### Issue: OAuth redirect not working

**Solution:**
- Verify the redirect URI in Google Cloud Console matches exactly with `.env.local`
- Make sure no trailing slashes are present
- Check that the application is running on the correct port (3000)

### Issue: PDF parsing fails

**Solution:**
- Some PDF files may have encoding issues
- Try with a different PDF file to isolate the issue
- Check console logs for specific error messages

## Production Deployment

### Environment Variables

For production deployment, update the following in your environment:

```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/email-automation
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Security Enhancements for Production

1. Implement token refresh mechanism
2. Use secure httpOnly cookies instead of localStorage
3. Add rate limiting to API endpoints
4. Implement proper error handling and logging
5. Add monitoring and alerting

## Support

For issues or questions:
- Check the troubleshooting section above
- Review server logs for detailed error messages
- Ensure all environment variables are correctly set

## Future Enhancements

Potential improvements to consider:

1. **Scheduled Email Fetching**: Implement cron jobs to automatically fetch emails at intervals
2. **Email Filtering**: Add filters for specific senders or keywords
3. **Advanced OCR**: Integrate OCR for scanned invoices
4. **Machine Learning**: Use ML models for better invoice data extraction
5. **Webhook Integration**: Set up Gmail push notifications for real-time processing
6. **Bulk Processing**: Add ability to process multiple attachments at once
7. **Email Templates**: Create templates for forwarding invoices
8. **Approval Workflow**: Add approval steps before creating invoice workflows

---

**Last Updated**: January 2025
**Version**: 1.0.0
