'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export default function ResultsPage() {
  const router = useRouter();
  const [selectedView, setSelectedView] = useState<'overview' | 'details'>('overview');

  const summary = {
    totalProcessed: 5,
    successful: 4,
    failed: 1,
    totalAmount: 105891.25,
    avgProcessingTime: '2.3s',
    successRate: 80
  };
  

  const insights = [
    {
      title: 'High Success Rate',
      description: '80% of invoices matched successfully with their purchase orders',
      type: 'success',
      icon: '✓'
    },
    {
      title: 'Amount Validation',
      description: 'Total validated amount: $105,891.25 across 5 transactions',
      type: 'info',
      icon: '$'
    },
    {
      title: 'Vendor Compliance',
      description: '4 out of 5 vendors have complete documentation',
      type: 'success',
      icon: '✓'
    },
    {
      title: 'Failed Validation',
      description: '1 invoice requires manual review due to PO mismatch',
      type: 'warning',
      icon: '!'
    }
  ];

  const detailedResults = [
    {
      invoiceNumber: 'INV-2024-001',
      poNumber: 'PO-2024-156',
      vendor: 'TechSupply Corp',
      amount: 15750.00,
      status: 'success',
      matchScore: 98,
      issues: []
    },
    {
      invoiceNumber: 'INV-2024-002',
      poNumber: 'PO-2024-157',
      vendor: 'Office Solutions Ltd',
      amount: 8450.50,
      status: 'success',
      matchScore: 95,
      issues: []
    },
    {
      invoiceNumber: 'INV-2024-003',
      poNumber: 'PO-2024-158',
      vendor: 'Digital Systems Inc',
      amount: 23200.00,
      status: 'success',
      matchScore: 97,
      issues: []
    },
    {
      invoiceNumber: 'INV-2024-004',
      poNumber: 'PO-2024-159',
      vendor: 'Global Trading Co',
      amount: 12890.75,
      status: 'failed',
      matchScore: 65,
      issues: ['PO number mismatch', 'Amount discrepancy: $500.00']
    },
    {
      invoiceNumber: 'INV-2024-005',
      poNumber: 'PO-2024-160',
      vendor: 'Enterprise Hardware',
      amount: 45600.00,
      status: 'success',
      matchScore: 99,
      issues: []
    }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Processing Results</h1>
              <p className="text-sm text-gray-600 mt-1">Step 3 of 4 - Review insights and outputs</p>
            </div>
            <button onClick={() => router.push('/login')} className="text-gray-600 hover:text-gray-900">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="ml-2 text-sm text-gray-500">Ingestion</span>
            </div>
            <div className="flex-1 h-1 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="ml-2 text-sm text-gray-500">Processing</span>
            </div>
            <div className="flex-1 h-1 bg-blue-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">3</div>
              <span className="ml-2 text-sm font-medium text-gray-900">Results</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">4</div>
              <span className="ml-2 text-sm text-gray-500">Share</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Processing Complete!</h2>
              <p className="text-lg text-green-100">All invoices have been processed and validated</p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Processed</h3>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{summary.totalProcessed}</p>
            <p className="text-sm text-gray-500 mt-1">Invoices</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{summary.successRate}%</p>
            <p className="text-sm text-gray-500 mt-1">{summary.successful} of {summary.totalProcessed} matched</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Amount</h3>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">${summary.totalAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Validated</p>
          </div>
        </div>

        {/* View Selector */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setSelectedView('overview')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  selectedView === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Insights Overview
              </button>
              <button
                onClick={() => setSelectedView('details')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  selectedView === 'details'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Detailed Results
              </button>
            </div>
          </div>

          <div className="p-6">
            {selectedView === 'overview' ? (
              <div className="space-y-4">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-lg border-l-4 ${
                      insight.type === 'success'
                        ? 'bg-green-50 border-green-500'
                        : insight.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-4 ${
                          insight.type === 'success'
                            ? 'bg-green-500'
                            : insight.type === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                      >
                        {insight.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Chart Placeholder */}
                <div className="mt-8 bg-gray-50 rounded-lg p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Statistics</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Status Distribution</p>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-3 mr-3">
                            <div className="bg-green-500 h-3 rounded-full" style={{ width: '80%' }}></div>
                          </div>
                          <span className="text-sm text-gray-700">Success: 80%</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-3 mr-3">
                            <div className="bg-red-500 h-3 rounded-full" style={{ width: '20%' }}></div>
                          </div>
                          <span className="text-sm text-gray-700">Failed: 20%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Validation Metrics</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">PO Match Rate:</span>
                          <span className="font-medium text-gray-900">80%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Amount Accuracy:</span>
                          <span className="font-medium text-gray-900">95%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Vendor Match:</span>
                          <span className="font-medium text-gray-900">100%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Date Validation:</span>
                          <span className="font-medium text-gray-900">100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detailedResults.map((result, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{result.invoiceNumber}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{result.poNumber}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{result.vendor}</td>
                        <td className="px-4 py-4 text-sm font-medium">${result.amount.toLocaleString()}</td>
                        <td className="px-4 py-4">
                          <span className={`font-bold ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {result.matchScore}%
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              result.status === 'success'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {result.status === 'success' ? 'Matched' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {result.issues.length > 0 ? (
                            <ul className="list-disc list-inside text-red-600">
                              {result.issues.map((issue, i) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/processing')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back to Processing
          </button>
          <button
            onClick={() => router.push('/share')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            Share Results
          </button>
        </div>
      </div>
      </main>
    </div>
  );
}
