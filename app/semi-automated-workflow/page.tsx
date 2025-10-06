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

    
      </main>
    </div>
  );
}
