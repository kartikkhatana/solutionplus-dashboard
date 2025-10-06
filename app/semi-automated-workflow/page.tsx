'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'requires-input';
  description: string;
  automationLevel: 'automated' | 'manual';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  date: string;
  status: 'pending-review' | 'in-process' | 'approved' | 'rejected';
  steps: WorkflowStep[];
}

const SAMPLE_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-12345',
    vendor: 'ABC Supplies Ltd.',
    amount: 5425.50,
    date: '2025-10-05',
    status: 'pending-review',
    steps: [
      {
        id: 'step-1',
        name: 'Document Receipt',
        status: 'completed',
        description: 'Invoice received via email',
        automationLevel: 'automated'
      },
      {
        id: 'step-2',
        name: 'Data Extraction',
        status: 'completed',
        description: 'Extract invoice details from PDF',
        automationLevel: 'automated'
      },
      {
        id: 'step-3',
        name: 'Vendor Verification',
        status: 'requires-input',
        description: 'Verify vendor details and PO match',
        automationLevel: 'manual'
      },
      {
        id: 'step-4',
        name: 'Amount Validation',
        status: 'pending',
        description: 'Validate invoice amount against PO',
        automationLevel: 'manual'
      },
      {
        id: 'step-5',
        name: 'Approval',
        status: 'pending',
        description: 'Awaiting manager approval',
        automationLevel: 'manual'
      },
      {
        id: 'step-6',
        name: 'Payment Processing',
        status: 'pending',
        description: 'Process payment to vendor',
        automationLevel: 'automated'
      }
    ]
  },
  {
    id: 'inv-002',
    invoiceNumber: 'TS-OCT-2025',
    vendor: 'Tech Services Inc.',
    amount: 3749.94,
    date: '2025-10-04',
    status: 'in-process',
    steps: [
      {
        id: 'step-1',
        name: 'Document Receipt',
        status: 'completed',
        description: 'Invoice received via email',
        automationLevel: 'automated'
      },
      {
        id: 'step-2',
        name: 'Data Extraction',
        status: 'completed',
        description: 'Extract invoice details from Excel',
        automationLevel: 'automated'
      },
      {
        id: 'step-3',
        name: 'Vendor Verification',
        status: 'completed',
        description: 'Vendor verified successfully',
        automationLevel: 'manual'
      },
      {
        id: 'step-4',
        name: 'Amount Validation',
        status: 'in-progress',
        description: 'Validating line items',
        automationLevel: 'manual'
      },
      {
        id: 'step-5',
        name: 'Approval',
        status: 'pending',
        description: 'Awaiting manager approval',
        automationLevel: 'manual'
      },
      {
        id: 'step-6',
        name: 'Payment Processing',
        status: 'pending',
        description: 'Process payment to vendor',
        automationLevel: 'automated'
      }
    ]
  },
  {
    id: 'inv-003',
    invoiceNumber: 'PO-9876',
    vendor: 'Global Vendors Corp.',
    amount: 12750.00,
    date: '2025-10-03',
    status: 'approved',
    steps: [
      {
        id: 'step-1',
        name: 'Document Receipt',
        status: 'completed',
        description: 'Invoice received via email',
        automationLevel: 'automated'
      },
      {
        id: 'step-2',
        name: 'Data Extraction',
        status: 'completed',
        description: 'Extract invoice details from PDF',
        automationLevel: 'automated'
      },
      {
        id: 'step-3',
        name: 'Vendor Verification',
        status: 'completed',
        description: 'Vendor verified successfully',
        automationLevel: 'manual'
      },
      {
        id: 'step-4',
        name: 'Amount Validation',
        status: 'completed',
        description: 'Amount validated against PO',
        automationLevel: 'manual'
      },
      {
        id: 'step-5',
        name: 'Approval',
        status: 'completed',
        description: 'Approved by manager',
        automationLevel: 'manual'
      },
      {
        id: 'step-6',
        name: 'Payment Processing',
        status: 'in-progress',
        description: 'Processing payment',
        automationLevel: 'automated'
      }
    ]
  }
];

export default function SemiAutomatedWorkflow() {
  const [invoices, setInvoices] = useState<Invoice[]>(SAMPLE_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'in-progress':
        return 'text-blue-400 bg-blue-500/20';
      case 'requires-input':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'pending':
        return 'text-gray-400 bg-gray-500/20';
      case 'approved':
        return 'text-green-400 bg-green-500/20';
      case 'pending-review':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const handleStepAction = (invoiceId: string, stepId: string) => {
    setActiveStep(stepId);
    // Simulate processing
    setTimeout(() => {
      setInvoices(prev => prev.map(inv => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            steps: inv.steps.map(step => {
              if (step.id === stepId && step.status === 'requires-input') {
                return { ...step, status: 'completed' as const };
              }
              return step;
            })
          };
        }
        return inv;
      }));
      setActiveStep(null);
    }, 1500);
  };

  const stats = {
    total: invoices.length,
    pendingReview: invoices.filter(i => i.status === 'pending-review').length,
    inProcess: invoices.filter(i => i.status === 'in-process').length,
    approved: invoices.filter(i => i.status === 'approved').length,
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%)' }}>
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Semi Automated Workflow</h1>
          <p className="text-gray-400">Monitor and manage invoice workflows with automated and manual steps</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(107, 70, 193, 0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Invoices</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.pendingReview}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-yellow-500/20">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">In Process</p>
                <p className="text-3xl font-bold text-blue-400">{stats.inProcess}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500/20">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-500/20">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="grid gap-6">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-6 rounded-xl transition-all cursor-pointer"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: selectedInvoice?.id === invoice.id ? '1px solid rgba(107, 70, 193, 0.6)' : '1px solid rgba(107, 70, 193, 0.3)' 
              }}
              onClick={() => setSelectedInvoice(selectedInvoice?.id === invoice.id ? null : invoice)}
            >
              {/* Invoice Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{invoice.invoiceNumber}</h3>
                  <p className="text-gray-400 text-sm">Vendor: {invoice.vendor}</p>
                  <p className="text-gray-400 text-sm">Date: {new Date(invoice.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white mb-2">${invoice.amount.toLocaleString()}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Workflow Steps */}
              {selectedInvoice?.id === invoice.id && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h4 className="text-lg font-semibold text-white mb-4">Workflow Steps</h4>
                  <div className="space-y-3">
                    {invoice.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h5 className="font-medium text-white">{step.name}</h5>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                step.automationLevel === 'automated' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {step.automationLevel}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{step.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                            {step.status.replace('-', ' ')}
                          </span>
                          {step.status === 'requires-input' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStepAction(invoice.id, step.id);
                              }}
                              disabled={activeStep === step.id}
                              className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-all"
                              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            >
                              {activeStep === step.id ? 'Processing...' : 'Take Action'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(107, 70, 193, 0.3)' }}>
          <h3 className="text-lg font-semibold text-white mb-3">About Semi Automated Workflow</h3>
          <div className="space-y-2 text-gray-300">
            <p>Semi automated workflows combine the efficiency of automation with human oversight and decision-making:</p>
            <ul className="space-y-1 ml-6 mt-2">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span><strong className="text-blue-400">Automated Steps:</strong> Document receipt, data extraction, payment processing</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-400 mr-2">•</span>
                <span><strong className="text-orange-400">Manual Steps:</strong> Vendor verification, amount validation, approvals</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Steps requiring input are highlighted and can be completed with one click</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Real-time status tracking for each invoice and workflow step</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
