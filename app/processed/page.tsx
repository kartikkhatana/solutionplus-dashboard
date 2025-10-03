'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

interface FieldComparison {
  field: string;
  poValue: string;
  invoiceValue: string;
  match: boolean;
}

interface ProcessedResult {
  id: number;
  invoice: string;
  po: string;
  vendor: string;
  amount: number;
  status: 'success' | 'warning';
  score: number;
  fieldComparisons: FieldComparison[];
  source: string;
  processedDate: string;
}

export default function ProcessedPage() {
  const [processedResults, setProcessedResults] = useState<ProcessedResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ProcessedResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Load processed workflows from localStorage
    const saved = localStorage.getItem('processedWorkflows');
    if (saved) {
      setProcessedResults(JSON.parse(saved));
    }
  }, []);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResults = processedResults.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedResults.length / itemsPerPage);

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const openComparisonModal = (result: ProcessedResult) => {
    setSelectedResult(result);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedResult(null);
  };

  const handleManualReview = () => {
    if (selectedResult) {
      setToastMessage(`Manual review requested for ${selectedResult.invoice}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      closeModal();
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Sidebar workflowCount={processedResults.length} />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Processed Workflows</h1>
          <p className="text-slate-600 mt-1">View all previously processed invoice validations</p>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-8 right-8 z-50 animate-slideDown">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        {processedResults.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Processed Workflows</h2>
            <p className="text-slate-600 mb-6">Complete a workflow to see processed results here</p>
            <a
              href="/workflow"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg cursor-pointer font-semibold"
            >
              Start New Workflow
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-90 mb-2">Success Rate</p>
                <p className="text-4xl font-bold">
                  {Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)}%
                </p>
                <p className="text-sm opacity-90 mt-2">
                  {processedResults.filter(r => r.status === 'success').length} of {processedResults.length} matched
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-90 mb-2">Total Amount</p>
                <p className="text-4xl font-bold">
                  ${(processedResults.reduce((sum, r) => sum + r.amount, 0) / 1000).toFixed(1)}K
                </p>
                <p className="text-sm opacity-90 mt-2">Validated</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-90 mb-2">Avg Score</p>
                <p className="text-4xl font-bold">
                  {Math.round(processedResults.reduce((sum, r) => sum + r.score, 0) / processedResults.length)}%
                </p>
                <p className="text-sm opacity-90 mt-2">Match confidence</p>
              </div>
            </div>

            {/* Results Table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">PO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {currentResults.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{result.invoice}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{result.po}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 max-w-[150px] overflow-hidden text-ellipsis truncate">
                        {result.vendor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">${result.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {result.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{result.processedDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-bold ${result.status === 'success' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {result.score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${result.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {result.status === 'success' ? 'Matched' : 'Review Required'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openComparisonModal(result)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {processedResults.length > itemsPerPage && (
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing <span className="font-medium text-slate-900">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium text-slate-900">
                        {Math.min(indexOfLastItem, processedResults.length)}
                      </span>{' '}
                      of <span className="font-medium text-slate-900">{processedResults.length}</span> results
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        Previous
                      </button>

                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => goToPage(pageNum)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            pageNum === currentPage - 2 ||
                            pageNum === currentPage + 2
                          ) {
                            return <span key={pageNum} className="px-2 text-slate-400">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Modal */}
        {showModal && selectedResult && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-8 py-6 text-white border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Document Validation Report</h3>
                    <p className="text-slate-300 mt-1 font-medium">Invoice {selectedResult.invoice} • Purchase Order {selectedResult.po}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`px-6 py-2 rounded-xl font-bold text-base shadow-lg ${selectedResult.status === 'success'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                      }`}>
                      Match Score: {selectedResult.score}%
                    </div>
                    <div className="bg-slate-600 px-4 py-2 rounded-xl text-sm font-medium">
                      Vendor: {selectedResult.vendor}
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">
                    {selectedResult.fieldComparisons.filter(f => f.match).length} / {selectedResult.fieldComparisons.length} fields validated
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-8 bg-gradient-to-br from-slate-50 to-white">
                <div className="space-y-4">
                  {selectedResult.fieldComparisons.map((comparison, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl p-6 transition-all shadow-md hover:shadow-lg ${comparison.match
                        ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200'
                        : 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-900 text-base">{comparison.field}</h4>
                        <div className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm ${comparison.match
                          ? 'bg-emerald-500 text-white'
                          : 'bg-red-500 text-white'
                          }`}>
                          {comparison.match ? '✓ VALIDATED' : '✗ MISMATCH'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm">
                          <p className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center tracking-wide">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Purchase Order
                          </p>
                          <p className={`text-base font-bold ${comparison.match ? 'text-emerald-700' : 'text-red-700'
                            }`}>
                            {comparison.poValue}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm">
                          <p className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center tracking-wide">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Invoice
                          </p>
                          <p className={`text-base font-bold ${comparison.match ? 'text-emerald-700' : 'text-red-700'
                            }`}>
                            {comparison.invoiceValue}
                          </p>
                        </div>
                      </div>

                      {!comparison.match && (
                        <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 rounded-r-lg">
                          <p className="text-sm text-red-900 font-medium flex items-center">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Manual review required - Data discrepancy detected
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-8 py-6 pb-8 border-t-2 border-slate-200 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-6">
                  <div className="text-sm">
                    <span className="font-bold text-emerald-600 text-lg">
                      {selectedResult.fieldComparisons.filter(f => f.match).length}
                    </span>
                    <span className="text-slate-600 ml-1">/ {selectedResult.fieldComparisons.length} fields validated</span>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${selectedResult.status === 'success'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                    }`}>
                    {selectedResult.status === 'success' ? 'Validation Passed' : 'Review Required'}
                  </div>
                </div>
                <div className="flex space-x-3">
                  {selectedResult.status === 'warning' && (
                    <button
                      onClick={handleManualReview}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg font-medium cursor-pointer"
                    >
                      Request Manual Review
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-md cursor-pointer"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
