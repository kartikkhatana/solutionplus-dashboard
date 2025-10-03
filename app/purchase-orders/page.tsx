'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const purchaseOrders = [
    { id: 'PO-2024-156', vendor: 'TechSupply Corp', date: '2024-01-15', amount: 15750, status: 'active', items: 5 },
    { id: 'PO-2024-157', vendor: 'Office Solutions Ltd', date: '2024-01-18', amount: 8450, status: 'active', items: 3 },
    { id: 'PO-2024-158', vendor: 'Digital Systems Inc', date: '2024-01-20', amount: 23200, status: 'active', items: 8 },
    { id: 'PO-2024-159', vendor: 'Global Trading Co', date: '2024-01-22', amount: 12890, status: 'pending', items: 4 },
    { id: 'PO-2024-160', vendor: 'Enterprise Hardware', date: '2024-01-25', amount: 45600, status: 'active', items: 12 },
    { id: 'PO-2024-161', vendor: 'Software Solutions', date: '2024-01-28', amount: 34200, status: 'completed', items: 6 },
    { id: 'PO-2024-162', vendor: 'Tech Innovators', date: '2024-02-01', amount: 18900, status: 'active', items: 7 },
    { id: 'PO-2024-163', vendor: 'Cloud Services Inc', date: '2024-02-05', amount: 28400, status: 'pending', items: 5 },
  ];

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: purchaseOrders.length,
    active: purchaseOrders.filter(po => po.status === 'active').length,
    pending: purchaseOrders.filter(po => po.status === 'pending').length,
    completed: purchaseOrders.filter(po => po.status === 'completed').length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + po.amount, 0)
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Purchase Orders</h1>
          <p className="text-sm text-slate-500">Manage and track all purchase orders</p>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          {/* Total POs */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Total POs</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{stats.total}</p>
            <div className="flex items-center text-xs">
              <span className="text-slate-400">All purchase orders</span>
            </div>
          </div>

          {/* Active */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Active</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{stats.active}</p>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-500 font-medium">{((stats.active / stats.total) * 100).toFixed(0)}%</span>
              <span className="text-slate-400 ml-1">of total</span>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Pending</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{stats.pending}</p>
            <div className="flex items-center text-xs">
              <span className="text-slate-400">Awaiting approval</span>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Completed</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{stats.completed}</p>
            <div className="flex items-center text-xs">
              <span className="text-slate-400">Successfully closed</span>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Total value</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">${(stats.totalValue / 1000).toFixed(1)}K</p>
            <div className="flex items-center text-xs">
              <span className="text-slate-400">Combined PO value</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between space-x-4">
            <input
              type="text"
              placeholder="Search by PO number or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 text-sm text-slate-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            {/* <button className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 text-sm">
              + New PO
            </button> */}
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-900">{po.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-900">{po.vendor}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-500">{po.date}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-500">{po.items} items</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-slate-900">${po.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${po.status === 'active' ? 'bg-green-500' :
                        po.status === 'pending' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}></span>
                      <span className={
                        po.status === 'active' ? 'text-green-600' :
                          po.status === 'pending' ? 'text-yellow-600' :
                            'text-blue-600'
                      }>
                        {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-slate-900 hover:text-slate-700 font-medium mr-3">View</button>
                    <button className="text-slate-500 hover:text-slate-700">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
