'use client';

import { useEffect, useState } from 'react';

export default function GmailCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => window.close(), 3000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          setTimeout(() => window.close(), 3000);
          return;
        }

        // Exchange code for tokens
        const response = await fetch('/api/gmail-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (data.success && data.tokens) {
          // Store access token in localStorage
          if (window.opener) {
            localStorage.setItem('gmail_access_token', data.tokens.access_token);
            
            if (data.tokens.refresh_token) {
              localStorage.setItem('gmail_refresh_token', data.tokens.refresh_token);
            }
          }

          setStatus('success');
          setMessage('Authentication successful! Closing window...');
          
          // Close the popup after a brief delay
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          setStatus('error');
          setMessage('Failed to exchange authorization code');
          setTimeout(() => window.close(), 3000);
        }
      } catch (error) {
        console.error('Error during callback:', error);
        setStatus('error');
        setMessage('An error occurred during authentication');
        setTimeout(() => window.close(), 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing</h2>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-emerald-600 mb-2">Success!</h2>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
              <p className="text-slate-600">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
