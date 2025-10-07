'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function EmailAutomationCallback() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authorization...');
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Prevent multiple executions (React StrictMode calls useEffect twice in dev)
    if (hasProcessed) {
      return;
    }
    setHasProcessed(true);
    
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Authorization failed: ${error}`);
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
    const params = new URLSearchParams({
      action: 'callback',
      code: code
    });
    
    fetch('/api/gmail-auth?' + params.toString())
      .then(async res => {
        console.log('API Response status:', res.status);
        const data = await res.json();
        console.log('API Response data:', data);
        
        // Check if response is OK (status 200-299)
        if (!res.ok) {
          throw new Error(data.error || `Server error: ${res.status}`);
        }
        
        return data;
      })
      .then(data => {
        // Double-check we have valid data
        if (!data.success || !data.tokens) {
          throw new Error(data.error || 'No tokens received from server');
        }
        
        setStatus('success');
        setMessage('Authorization successful! Redirecting...');
        
        console.log('Sending tokens to parent window');
        
        // Send tokens to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GMAIL_AUTH_SUCCESS',
            tokens: data.tokens
          }, window.location.origin);
          
          // Close popup after a short delay
          setTimeout(() => window.close(), 1500);
        } else {
          console.error('No window.opener available!');
          setStatus('error');
          setMessage('Unable to communicate with parent window');
          setTimeout(() => window.close(), 3000);
        }
      })
      .catch(err => {
        console.error('Error exchanging code for tokens:', err);
        setStatus('error');
        setMessage(`Authorization failed: ${err.message}`);
        
        // Send failure message to parent window so it doesn't show false success
        if (window.opener) {
          window.opener.postMessage({
            type: 'GMAIL_AUTH_FAILED',
            error: err.message
          }, window.location.origin);
        }
        
        setTimeout(() => window.close(), 4000);
      });
  }, [searchParams, hasProcessed]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Connecting to Gmail</h2>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Success!</h2>
              <p className="text-green-700">{message}</p>
            </>
          )}

          {/* {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-900 mb-2">Authorization Failed</h2>
              <p className="text-red-700">{message}</p>
            </>
          )} */}

          <p className="text-sm text-slate-500 mt-6">This window will close automatically...</p>
        </div>
      </div>
    </div>
  );
}
