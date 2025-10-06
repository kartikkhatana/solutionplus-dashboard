# Troubleshooting OAuth "redirect_uri_mismatch" Error

## The Problem
You're seeing: **Error 400: redirect_uri_mismatch**

This means the redirect URI in your Google Cloud Console doesn't match what your application is sending.

## The Solution

### Step 1: Go to Google Cloud Console
1. Visit https://console.cloud.google.com/
2. Select your project
3. Go to **"APIs & Services"** → **"Credentials"**

### Step 2: Edit Your OAuth 2.0 Client ID
1. Find your OAuth 2.0 Client ID in the list
2. Click on it to edit
3. Scroll down to **"Authorized redirect URIs"**

### Step 3: Add the EXACT Redirect URI
Add this EXACT URI (copy and paste to avoid typos):

```
http://localhost:3000/gmail-callback
```

**IMPORTANT:** 
- ✅ Use `http://` (not `https://` for localhost)
- ✅ No trailing slash at the end
- ✅ Port 3000 (default Next.js port)
- ✅ Path is `/gmail-callback`

### Step 4: Save Changes
1. Click **"Save"** at the bottom
2. Wait a few seconds for changes to propagate

### Step 5: Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 6: Clear Browser Cache (Optional)
If it still doesn't work:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 7: Try Again
1. Go to http://localhost:3000/semi-automated-workflow
2. Click "Start Email Workflow"
3. Click "Connect to Gmail"
4. The OAuth popup should now work!

## Common Mistakes to Avoid

❌ **Wrong:** `https://localhost:3000/gmail-callback` (should be http not https)
❌ **Wrong:** `http://localhost:3000/gmail-callback/` (no trailing slash)
❌ **Wrong:** `http://localhost:3000/api/gmail-auth` (wrong path)
❌ **Wrong:** `http://127.0.0.1:3000/gmail-callback` (use localhost, not 127.0.0.1)

✅ **Correct:** `http://localhost:3000/gmail-callback`

## Still Not Working?

### Check Your Environment Variables
Make sure your `.env.local` has the correct redirect URI:
```env
GOOGLE_REDIRECT_URI=http://localhost:3000/gmail-callback
```

### Verify the Dev Server Port
By default, Next.js runs on port 3000. If you're using a different port:
1. Check what port your server is running on (look at the terminal output)
2. Update both `.env.local` and Google Cloud Console to match

Example for port 3001:
- `.env.local`: `GOOGLE_REDIRECT_URI=http://localhost:3001/gmail-callback`
- Google Cloud Console: Add `http://localhost:3001/gmail-callback`

### Check the Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for any error messages when you click "Connect to Gmail"

## Need More Help?

If you're still having issues, check:
1. Is the Gmail API enabled in your Google Cloud project?
2. Is your OAuth consent screen configured?
3. Are you using the correct Client ID and Client Secret?
4. Did you save changes in Google Cloud Console?
