'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const vendors = [
    { id: 1, name: 'TechSupply Corp', invoices: 342, amount: 1245600, compliance: 98, status: 'active', contact: 'john@techsupply.com' },
    { id: 2, name: 'Office Solutions Ltd', invoices: 289, amount: 856700, compliance: 95, status: 'active', contact: 'sales@officesolutions.com' },
    { id: 3, name: 'Digital Systems Inc', invoices: 256, amount: 1023400, compliance: 97, status: 'active', contact: 'info@digitalsystems.com' },
    { id: 4, name: 'Global Trading Co', invoices: 198, amount: 687500, compliance: 92, status: 'active', contact: 'contact@globaltrading.com' },
    { id: 5, name: 'Enterprise Hardware', invoices: 167, amount: 934200, compliance: 99, status: 'active', contact: 'support@enthard.com' },
    { id: 6, name: 'Cloud Services Inc', invoices: 145, amount: 678900, compliance: 94, status: 'active', contact: 'hello@cloudservices.com' },
    { id: 7, name: 'Software Solutions', invoices: 123, amount: 567800, compliance: 96, status: 'inactive', contact: 'info@softsolutions.com' },
  ];

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Vendors</h1>
          <p className="text-sm text-slate-500">Manage vendor relationships and performance</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
           
            </div>
            <p className="text-xs text-slate-500 mb-2">Total vendors</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{vendors.length}</p>
            <div className="flex items-center text-xs">
              <span className="text-slate-500">All registered</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
           
            </div>
            <p className="text-xs text-slate-500 mb-2">Active vendors</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{vendors.filter(v => v.status === 'active').length}</p>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-500 font-medium">85.7%</span>
              <span className="text-slate-400 ml-1">active rate</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
           
            </div>
            <p className="text-xs text-slate-500 mb-2">Total invoices</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{vendors.reduce((sum, v) => sum + v.invoices, 0).toLocaleString()}</p>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-500 font-medium">12.3%</span>
              <span className="text-slate-400 ml-1">from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
           
            </div>
            <p className="text-xs text-slate-500 mb-2">Avg compliance</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{Math.round(vendors.reduce((sum, v) => sum + v.compliance, 0) / vendors.length)}%</p>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-500 font-medium">3.2%</span>
              <span className="text-slate-400 ml-1">improvement</span>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        {/* <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search vendors by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-slate-900 placeholder-slate-400"
                style={{ outline: 'none' }}
              />
            </div>
            <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 shadow-sm transition-colors flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Vendor
            </button>
          </div>
        </div> */}

        {/* Vendors Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
            <div className="col-span-4">Vendor</div>
            <div className="col-span-2 text-right">Invoices</div>
            <div className="col-span-2 text-right">Total Value</div>
            <div className="col-span-2 text-center">Compliance</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {filteredVendors.map((vendor, idx) => {
              const vendorIcons = [
                <svg key="chip" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 7H7v6h6V7z" />
                  <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                </svg>,
                <svg key="briefcase" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>,
                <svg key="server" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>,
                <svg key="building" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>,
                <svg key="cube" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                </svg>,
                <svg key="cloud" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                </svg>,
                <svg key="code" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ];

              const iconColors = [
                'from-blue-500 to-blue-600',
                'from-purple-500 to-purple-600',
                'from-green-500 to-green-600',
                'from-orange-500 to-orange-600',
                'from-pink-500 to-pink-600',
                'from-indigo-500 to-indigo-600',
                'from-red-500 to-red-600'
              ];

              return (
                <div key={vendor.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="col-span-4 flex items-center">
                    <div className={`w-10 h-10 bg-gradient-to-br ${iconColors[idx % iconColors.length]} rounded-xl mr-3 flex items-center justify-center text-white flex-shrink-0`}>
                      {vendorIcons[idx % vendorIcons.length]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{vendor.name}</p>
                      <p className="text-xs text-slate-500 truncate">{vendor.contact}</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="text-sm text-slate-900 font-medium">{vendor.invoices}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="text-sm text-slate-900 font-medium">${(vendor.amount / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden mr-2">
                        <div
                          className="h-full bg-slate-900 rounded-full"
                          style={{ width: `${vendor.compliance}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${vendor.compliance >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {vendor.compliance}%
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-center space-x-2">
                    <button className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      View
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
