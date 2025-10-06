'use client';

import { useState, useEffect } from 'react';

export default function DebugOAuth() {
  const [config, setConfig] = useState<any>(null);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Get config from debug endpoint
      const configRes = await fetch('/api/debug-oauth');
      const configData = await configRes.json();
      setConfig(configData);

      // Get auth URL
      const authRes = await fetch('/api/gmail-auth');
      const authData = await authRes.json();
      if (authData.success) {
        setAuthUrl(authData.authUrl);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractRedirectUri = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('redirect_uri') || 'Not found in URL';
    } catch {
      return 'Invalid URL';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">OAuth Configuration Debug</h1>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p>Loading configuration...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Environment Variables */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Environment Variables</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GOOGLE_CLIENT_ID
                  </label>
                  <div className="bg-gray-50 p-3 rounded border font-mono text-sm break-all">
                    {config?.clientId}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GOOGLE_CLIENT_SECRET
                  </label>
                  <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                    {config?.clientSecret}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GOOGLE_REDIRECT_URI (from .env.local)
                  </label>
                  <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                    {config?.redirectUri}
                  </div>
                  {config?.redirectUri === 'NOT SET' && (
                    <p className="text-red-600 text-sm mt-2">
                      ⚠️ ERROR: Redirect URI not set in environment variables!
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NODE_ENV
                  </label>
                  <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                    {config?.nodeEnv}
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Auth URL */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Generated OAuth URL</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Auth URL
                  </label>
                  <div className="bg-gray-50 p-3 rounded border font-mono text-xs break-all max-h-40 overflow-y-auto">
                    {authUrl || 'Failed to generate'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extracted redirect_uri Parameter
                  </label>
                  <div className="bg-yellow-50 p-3 rounded border-2 border-yellow-400 font-mono text-sm">
                    {extractRedirectUri(authUrl)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    ☝️ This is the redirect URI being sent to Google. It must <strong>exactly match</strong> what you have in Google Cloud Console.
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-6">
              <h2 className="text-xl font-bold text-blue-900 mb-4">What to Check in Google Cloud Console</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google Cloud Console Credentials</a></li>
                <li>Click on your OAuth 2.0 Client ID</li>
                <li>Scroll to "Authorized redirect URIs"</li>
                <li>Make sure this <strong>EXACT</strong> URI is listed:</li>
              </ol>
              <div className="mt-4 bg-white p-4 rounded border-2 border-blue-600 font-mono text-lg font-bold">
                {extractRedirectUri(authUrl)}
              </div>
              <p className="text-sm text-blue-900 mt-4">
                Copy the redirect URI above and add it to your Google Cloud Console if it's not there.
              </p>
            </div>

            {/* Common Issues */}
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-900 mb-4">Common Issues</h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-red-900">
                <li>Extra spaces or characters in the redirect URI</li>
                <li>Wrong protocol (https:// instead of http:// for localhost)</li>
                <li>Wrong port number</li>
                <li>Trailing slash at the end</li>
                <li>Changes not saved in Google Cloud Console</li>
                <li>Environment variables not loaded (restart dev server)</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => loadConfig()}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  🔄 Refresh Configuration
                </button>
                <button
                  onClick={() => window.open('/semi-automated-workflow', '_blank')}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  ➡️ Go to Semi-Automated Workflow
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(extractRedirectUri(authUrl));
                    alert('Redirect URI copied to clipboard!');
                  }}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                  📋 Copy Redirect URI to Clipboard
                </button>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-900 mb-4">Fix Checklist</h2>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 text-sm text-green-900">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <span>Copied the redirect URI from this page</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-green-900">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <span>Opened Google Cloud Console</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-green-900">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <span>Found my OAuth 2.0 Client ID</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-green-900">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <span>Added the redirect URI to "Authorized redirect URIs"</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-green-900">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <span>Clicked "Save" in Google Cloud Console</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-green-900">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <span>Waited 1-2 minutes for changes to propagate</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-green-900">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <span>Restarted my dev server (npm run dev)</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-green-900">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <span>Cleared browser cache</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-green-900">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <span>Ready to test again!</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
