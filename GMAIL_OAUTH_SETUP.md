# Gmail OAuth Setup Guide

This guide will help you set up Gmail OAuth authentication for the Email Semi-Automation workflow.

## Prerequisites

1. A Google Cloud Console account
2. Access to the application's environment variables

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (or "Internal" if using Google Workspace)
3. Fill in the required information:
   - App name: "SolutionPlus Invoice Automation"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
5. Add test users (if using External type)
6. Save and continue

## Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add the following:
   - **Name**: SolutionPlus Dashboard
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/gmail-callback` (for development)
     - Your production callback URL (e.g., `https://yourdomain.com/gmail-callback`)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file (create it if it doesn't exist):

```env
# Gmail OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/gmail-callback

# For production, update GOOGLE_REDIRECT_URI to:
# GOOGLE_REDIRECT_URI=https://yourdomain.com/gmail-callback
```

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Semi-Automated Workflow page
3. Click "Start Email Workflow"
4. Click "Connect to Gmail"
5. You should see a Google OAuth popup
6. Grant the requested permissions
7. The popup should close automatically and you'll be connected

## Important Notes

### Security Considerations

- **Never commit** your `.env.local` file to version control
- Keep your Client Secret secure
- For production, use environment variables from your hosting provider
- Consider implementing token refresh logic for long-running sessions

### Token Storage

- Access tokens are stored in `localStorage` in the browser
- Tokens are temporary and will expire (typically after 1 hour)
- Refresh tokens can be used to obtain new access tokens

### Troubleshooting

**Error: "redirect_uri_mismatch"**
- Ensure the redirect URI in your Google Cloud Console exactly matches the one in your `.env.local`
- Check for trailing slashes (should not have one)

**Error: "invalid_client"**
- Verify your Client ID and Client Secret are correct
- Ensure there are no extra spaces in your environment variables

**Popup blocked**
- Allow popups for your application in browser settings
- The authentication requires a popup window to complete OAuth flow

**No emails fetched**
- Ensure you have forwarded emails in your Gmail account
- The API searches for emails forwarded on the current date
- Check that your Gmail account has the necessary permissions

## Email Workflow Process

Once connected, the workflow will:

1. **Fetch Emails**: Retrieve forwarded emails from today
2. **Extract Attachments**: Process PDF, Excel, and Word documents
3. **Extract Invoice Data**: Use intelligent extraction to identify:
   - Invoice numbers
   - Dates
   - Amounts
   - Vendor information
4. **Validate Data**: Match invoices against PO data
5. **Review & Approve**: Allow manual review and approval/rejection
6. **Send Notifications**: Automatically notify vendors of decisions

## API Rate Limits

Gmail API has the following quotas:
- 1 billion requests per day
- 250 quota units per user per second

For most use cases, these limits are more than sufficient.

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the Gmail API is enabled in Google Cloud Console
4. Check that your OAuth consent screen is properly configured
