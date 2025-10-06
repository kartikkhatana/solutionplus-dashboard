'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';

interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
  processedAttachments: Array<any>;
}

// Dummy email data for simulation
const DUMMY_EMAILS: Email[] = [
  {
    id: 'email-001',
    subject: 'Invoice from ABC Supplies - Order #12345',
    from: 'billing@abcsupplies.com',
    date: new Date().toLocaleString(),
    attachments: [
      {
        filename: 'Invoice_12345.pdf',
        mimeType: 'application/pdf',
        size: 245678,
      }
    ],
    processedAttachments: [
      {
        filename: 'Invoice_12345.pdf',
        extractedAt: new Date().toISOString(),
        invoiceNumber: 'INV-12345',
        invoiceDate: '10/05/2025',
        amount: 5425.50,
        vendor: 'ABC Supplies Ltd.',
        rawContent: 'INVOICE\nInvoice Number: INV-12345\nDate: 10/05/2025\nVendor: ABC Supplies Ltd.\nTotal Amount: $5,425.50\n\nItems:\n- Office Furniture - $3,500.00\n- Computer Equipment - $1,500.00\n- Software Licenses - $425.50',
      }
    ]
  },
  {
    id: 'email-002',
    subject: 'Monthly Invoice - Tech Services',
    from: 'accounts@techservices.com',
    date: new Date(Date.now() - 3600000).toLocaleString(),
    attachments: [
      {
        filename: 'Monthly_Statement_Oct2025.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 87543,
      }
    ],
    processedAttachments: [
      {
        filename: 'Monthly_Statement_Oct2025.xlsx',
        type: 'excel',
        extractedAt: new Date().toISOString(),
        data: [
          { Item: 'Cloud Hosting', Quantity: 1, UnitPrice: 299.99, Total: 299.99 },
          { Item: 'Support Services', Quantity: 20, UnitPrice: 150.00, Total: 3000.00 },
          { Item: 'License Fees', Quantity: 5, UnitPrice: 89.99, Total: 449.95 }
        ],
        summary: {
          invoiceNumber: 'TS-OCT-2025',
          totalAmount: 3749.94,
          vendor: 'Tech Services Inc.'
        }
      }
    ]
  },
  {
    id: 'email-003',
    subject: 'Purchase Order #PO-9876 Invoice',
    from: 'invoicing@globalvendors.com',
    date: new Date(Date.now() - 7200000).toLocaleString(),
    attachments: [
      {
        filename: 'PO_9876_Invoice.pdf',
        mimeType: 'application/pdf',
        size: 156789,
      },
      {
        filename: 'PO_9876_Details.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 45321,
      }
    ],
    processedAttachments: [
      {
        filename: 'PO_9876_Invoice.pdf',
        extractedAt: new Date().toISOString(),
        invoiceNumber: 'PO-9876',
        invoiceDate: '10/04/2025',
        amount: 12750.00,
        vendor: 'Global Vendors Corp.',
        rawContent: 'INVOICE\nPurchase Order: PO-9876\nInvoice Date: 10/04/2025\nVendor: Global Vendors Corp.\nAmount Due: $12,750.00\n\nDelivery Address:\n123 Business Park\nDubai, UAE',
      },
      {
        filename: 'PO_9876_Details.docx',
        extractedAt: new Date().toISOString(),
        invoiceNumber: 'PO-9876',
        vendor: 'Global Vendors Corp.',
        rawContent: 'Purchase Order Details\nPO Number: PO-9876\nDelivery: Standard\nTerms: Net 30\nShipping: Free',
      }
    ]
  },
  {
    id: 'email-004',
    subject: 'Consulting Services Invoice - Project Alpha',
    from: 'billing@consultpro.com',
    date: new Date(Date.now() - 10800000).toLocaleString(),
    attachments: [
      {
        filename: 'Consulting_Invoice_Q4.pdf',
        mimeType: 'application/pdf',
        size: 198765,
      }
    ],
    processedAttachments: [
      {
        filename: 'Consulting_Invoice_Q4.pdf',
        extractedAt: new Date().toISOString(),
        invoiceNumber: 'CONS-2025-Q4-001',
        invoiceDate: '10/03/2025',
        amount: 18500.00,
        vendor: 'ConsultPro Solutions',
        rawContent: 'PROFESSIONAL SERVICES INVOICE\nInvoice: CONS-2025-Q4-001\nDate: 10/03/2025\nProject: Alpha Development\nConsultant: ConsultPro Solutions\nTotal: $18,500.00\n\nHours: 185 @ $100/hr',
      }
    ]
  }
];

export default function EmailAutomation() {
  const [isConnected, setIsConnected] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const connectGmail = () => {
    setLoading(true);
    setError(null);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setSuccess('Successfully connected to Gmail! (Simulation Mode)');
      setLoading(false);
    }, 1500);
  };

  const disconnectGmail = () => {
    setIsConnected(false);
    setEmails([]);
    setSelectedEmail(null);
    setSuccess('Disconnected from Gmail');
  };

  const fetchEmails = () => {
    setLoading(true);
    setError(null);
    
    // Simulate API call delay
    setTimeout(() => {
      setEmails(DUMMY_EMAILS);
      const today = new Date().toLocaleDateString();
      setSuccess(`Fetched ${DUMMY_EMAILS.length} emails from ${today} (Simulation Mode)`);
      setLoading(false);
    }, 1000);
  };

  const processEmail = (email: Email, attachmentIndex: number) => {
    setProcessing(true);
    setError(null);

    // Simulate processing delay
    setTimeout(() => {
      setSuccess(`Invoice workflow created successfully! (Simulation Mode)\nInvoice: ${email.processedAttachments[attachmentIndex].invoiceNumber || 'N/A'}`);
      setProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%)' }}>
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Simulation Mode Banner */}
        <div className="mb-6 p-4 rounded-lg border-2 border-blue-500/50 bg-blue-500/10">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-blue-400 font-semibold">Demo Mode Active</h3>
              <p className="text-blue-300 text-sm">This is a simulation with dummy data. No actual Gmail connection required.</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Email Automation</h1>
          <p className="text-gray-400">Automate invoice processing from forwarded emails</p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Connection Status */}
        <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(107, 70, 193, 0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                <svg className={`w-6 h-6 ${isConnected ? 'text-green-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Gmail Connection</h3>
                <p className="text-sm text-gray-400">
                  {isConnected ? 'Connected and ready to fetch emails' : 'Connect your Gmail account to start'}
                </p>
              </div>
            </div>
            
            {!isConnected ? (
              <button
                onClick={connectGmail}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                {loading ? 'Connecting...' : 'Connect Gmail'}
              </button>
            ) : (
              <button
                onClick={disconnectGmail}
                className="px-6 py-2.5 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 transition-all"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Fetch Emails Section */}
        {isConnected && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Today's Forwarded Emails</h2>
              <button
                onClick={fetchEmails}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                {loading ? 'Fetching...' : 'Fetch Emails'}
              </button>
            </div>

            {/* Email List */}
            {emails.length > 0 ? (
              <div className="grid gap-4">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="p-6 rounded-xl cursor-pointer transition-all"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      border: selectedEmail?.id === email.id ? '1px solid rgba(107, 70, 193, 0.6)' : '1px solid rgba(107, 70, 193, 0.3)' 
                    }}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{email.subject}</h3>
                        <p className="text-sm text-gray-400">From: {email.from}</p>
                        <p className="text-xs text-gray-500 mt-1">{email.date}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 text-xs font-medium text-white rounded-full" style={{ backgroundColor: '#8B5CF6' }}>
                          {email.attachments.length} Attachment{email.attachments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Attachments */}
                    {email.attachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Attachments:</h4>
                        <div className="space-y-2">
                          {email.attachments.map((attachment, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                              <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-white">{attachment.filename}</p>
                                  <p className="text-xs text-gray-400">{(attachment.size / 1024).toFixed(2)} KB</p>
                                </div>
                              </div>
                              
                              {email.processedAttachments[idx] && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    processEmail(email, idx);
                                  }}
                                  disabled={processing}
                                  className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-all"
                                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                >
                                  {processing ? 'Processing...' : 'Process Invoice'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Processed Data Preview */}
                    {selectedEmail?.id === email.id && email.processedAttachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Extracted Data:</h4>
                        {email.processedAttachments.map((data, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-white/5 mb-2">
                            <pre className="text-xs text-gray-300 overflow-auto">
                              {JSON.stringify(data, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(107, 70, 193, 0.3)' }}>
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400">No emails fetched yet. Click "Fetch Emails" to start.</p>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(107, 70, 193, 0.3)' }}>
          <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
          <ol className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="font-bold text-purple-400 mr-2">1.</span>
              <span>Connect your Gmail account using OAuth2 authentication</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-purple-400 mr-2">2.</span>
              <span>System fetches all forwarded emails from today</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-purple-400 mr-2">3.</span>
              <span>Attachments (PDF, Excel, Word) are automatically parsed</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-purple-400 mr-2">4.</span>
              <span>Invoice data is extracted and ready for processing</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-purple-400 mr-2">5.</span>
              <span>Click "Process Invoice" to create a workflow from the extracted data</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
