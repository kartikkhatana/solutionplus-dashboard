# Google Workspace (G Suite) OAuth Setup Guide

Since you're using Google Workspace credentials, follow this guide for proper configuration.

## Important Differences for Google Workspace

Google Workspace accounts have additional options and different setup requirements compared to regular Gmail accounts.

## Step 1: Access Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Make sure you're signed in with your Google Workspace account
3. Select your existing project or create a new one

## Step 2: Enable Gmail API

1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"Gmail API"**
3. Click **"Enable"**

## Step 3: Configure OAuth Consent Screen

For Google Workspace, you can choose **"Internal"** user type:

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"Internal"** (recommended for Workspace)
   - This restricts access to users within your organization
   - No verification process required
   - Alternatively, choose "External" if you need access outside your organization
3. Fill in the application information:
   - **App name**: SolutionPlus Invoice Automation
   - **User support email**: Your workspace email
   - **Developer contact**: Your workspace email
4. Click **"Save and Continue"**

### Add Required Scopes

1. Click **"Add or Remove Scopes"**
2. Manually add these scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.modify
   ```
3. Click **"Update"**
4. Click **"Save and Continue"**

## Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Choose **"Web application"**
4. Configure the following:

### Application Name
```
SolutionPlus Dashboard
```

### Authorized JavaScript origins
Add both of these:
```
http://localhost:3000
http://127.0.0.1:3000
```

### Authorized redirect URIs
Add EXACTLY this URI (copy and paste to avoid typos):
```
http://localhost:3000/gmail-callback
```

**CRITICAL:** 
- ✅ Must be `http://` (NOT `https://`)
- ✅ Must be `localhost` (but also add 127.0.0.1 in origins)
- ✅ Must be port `3000`
- ✅ Must be path `/gmail-callback`
- ✅ NO trailing slash

5. Click **"Create"**
6. Copy the **Client ID** and **Client Secret**

## Step 5: Update .env.local

Your `.env.local` file should already have these values:
```env
GOOGLE_CLIENT_ID=911449296093-ifaq84p8vg0v35ojbnomqm3tlguth2fe.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3000/gmail-callback
```

Make sure:
- The Client ID matches what you copied
- The Client Secret matches what you copied
- The redirect URI is exactly `http://localhost:3000/gmail-callback`

## Step 6: Google Workspace Admin Console (Optional)

If you're a Workspace admin and want to control app access:

1. Go to https://admin.google.com
2. Navigate to **Security** → **API controls**
3. Go to **App access control**
4. If you set OAuth to "Internal", your app will automatically be available to all workspace users
5. If issues persist, you may need to whitelist your app

## Step 7: Test the Integration

1. **Restart your dev server** (very important):
   ```bash
   # Stop the server with Ctrl+C
   npm run dev
   ```

2. **Clear browser cache**:
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

3. **Test the flow**:
   - Go to http://localhost:3000/semi-automated-workflow
   - Click "Start Email Workflow"
   - Click "Connect to Gmail"
   - You should see the Google OAuth consent screen
   - Grant the permissions
   - The popup should close and connection should succeed

## Troubleshooting Workspace-Specific Issues

### Error: "This app isn't verified"
If you see this warning:
1. Click "Advanced"
2. Click "Go to SolutionPlus (unsafe)"
3. This is normal for internal apps not published to Google

### Error: "Access blocked: This app's request is invalid"
- Double-check the redirect URI in Google Cloud Console
- Make sure it exactly matches: `http://localhost:3000/gmail-callback`
- Ensure there are no extra spaces or characters

### Error: "Admin has not enabled this app"
If your workspace has strict controls:
1. Contact your Google Workspace admin
2. Ask them to allow API access for your Client ID
3. Or use an admin account to test

### Still getting "redirect_uri_mismatch"?

1. **Verify in Google Cloud Console:**
   - Go to Credentials → Your OAuth Client ID
   - Check "Authorized redirect URIs"
   - Must include: `http://localhost:3000/gmail-callback`

2. **Check your dev server port:**
   - Look at terminal output when you run `npm run dev`
   - If it says port 3001 or different, update both:
     - `.env.local`: `GOOGLE_REDIRECT_URI=http://localhost:3001/gmail-callback`
     - Google Cloud Console: Add `http://localhost:3001/gmail-callback`

3. **Wait a moment:**
   - After saving in Google Cloud Console, changes can take 1-2 minutes to propagate
   - Try clearing browser cache and restarting dev server

## Security Notes for Workspace

- Internal apps are only accessible to your workspace domain
- Tokens are stored in browser localStorage
- For production, implement proper token management and refresh logic
- Consider using service accounts for backend operations
- Review access regularly in Workspace admin console

## Testing with Workspace Email

Make sure you're testing with:
- ✅ An email account from your workspace domain
- ✅ An account that has Gmail enabled
- ✅ An account with permission to use OAuth apps (check with admin)

## Next Steps

Once authentication works:
1. Forward some invoice emails to your Gmail
2. The system will fetch emails from today
3. Process PDF, Excel, or Word attachments
4. Extract invoice data automatically
5. Validate and approve/reject invoices
