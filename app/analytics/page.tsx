'use client';

import { useState } from 'react';
import Select from 'react-select';
import Sidebar from '../components/Sidebar';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState({ value: '30d', label: 'Last 30 days' });
  const [selectedCategory, setSelectedCategory] = useState('overview');

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '6m', label: 'Last 6 months' }
  ];

  // Base data for different time ranges
  const allData = {
    '7d': {
      monthly: [
        { month: 'Day 1', processed: 580, amount: 68400, success: 554, validationRate: 95.5 },
        { month: 'Day 2', processed: 624, amount: 77000, success: 595, validationRate: 95.4 },
        { month: 'Day 3', processed: 689, amount: 84200, success: 658, validationRate: 95.5 },
        { month: 'Day 4', processed: 756, amount: 93600, success: 722, validationRate: 95.5 },
        { month: 'Day 5', processed: 769, amount: 99600, success: 738, validationRate: 96.0 },
        { month: 'Day 6', processed: 712, amount: 88800, success: 681, validationRate: 95.6 },
        { month: 'Day 7', processed: 698, amount: 86200, success: 667, validationRate: 95.6 }
      ],
      metrics: {
        avgProcessingTime: '1.6s',
        matchAccuracy: '98.1%',
        costSavings: '$12K',
        errorRate: '1.2%',
        trends: { processing: '↓ 8%', accuracy: '↑ 1.8%', savings: '↑ 15%', errors: '↓ 0.5%' }
      }
    },
    '30d': {
      monthly: [
        { month: 'Jan', processed: 2850, amount: 342000, success: 2720, validationRate: 95.4 },
        { month: 'Feb', processed: 3120, amount: 385000, success: 2974, validationRate: 95.3 },
        { month: 'Mar', processed: 3445, amount: 421000, success: 3290, validationRate: 95.5 },
        { month: 'Apr', processed: 3780, amount: 468000, success: 3610, validationRate: 95.5 },
        { month: 'May', processed: 3847, amount: 498000, success: 3693, validationRate: 96.0 }
      ],
      metrics: {
        avgProcessingTime: '1.8s',
        matchAccuracy: '97.8%',
        costSavings: '$45K',
        errorRate: '1.5%',
        trends: { processing: '↓ 15%', accuracy: '↑ 2.3%', savings: '↑ 28%', errors: '↓ 0.8%' }
      }
    },
    '90d': {
      monthly: [
        { month: 'Month 1', processed: 8950, amount: 1125000, success: 8542, validationRate: 95.4 },
        { month: 'Month 2', processed: 9420, amount: 1285000, success: 8985, validationRate: 95.4 },
        { month: 'Month 3', processed: 10145, amount: 1421000, success: 9689, validationRate: 95.5 }
      ],
      metrics: {
        avgProcessingTime: '2.1s',
        matchAccuracy: '97.2%',
        costSavings: '$128K',
        errorRate: '1.8%',
        trends: { processing: '↓ 22%', accuracy: '↑ 3.1%', savings: '↑ 35%', errors: '↓ 1.2%' }
      }
    },
    '6m': {
      monthly: [
        { month: 'Jan', processed: 18950, amount: 2342000, success: 18087, validationRate: 95.4 },
        { month: 'Feb', processed: 21120, amount: 2685000, success: 20137, validationRate: 95.3 },
        { month: 'Mar', processed: 23445, amount: 2921000, success: 22375, validationRate: 95.4 },
        { month: 'Apr', processed: 25780, amount: 3268000, success: 24594, validationRate: 95.4 },
        { month: 'May', processed: 27847, amount: 3598000, success: 26733, validationRate: 96.0 },
        { month: 'Jun', processed: 29234, amount: 3785000, success: 28065, validationRate: 96.0 }
      ],
      metrics: {
        avgProcessingTime: '2.3s',
        matchAccuracy: '96.8%',
        costSavings: '$285K',
        errorRate: '2.1%',
        trends: { processing: '↓ 28%', accuracy: '↑ 4.2%', savings: '↑ 42%', errors: '↓ 1.8%' }
      }
    }
  };

  // Get current data based on selected time range
  const monthlyData = allData[timeRange.value as keyof typeof allData].monthly;
  const currentMetrics = allData[timeRange.value as keyof typeof allData].metrics;

  // Custom styles for react-select to match theme
  const customSelectStyles = {
    control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
      ...base,
      minHeight: '44px',
      borderRadius: '0.75rem',
      borderColor: state.isFocused ? '#0f172a' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '&:hover': {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0'
      },
      cursor: 'pointer',
      backgroundColor: 'white',
      transition: 'all 0.2s'
    }),
    valueContainer: (base: Record<string, unknown>) => ({
      ...base,
      padding: '0 1rem',
      fontWeight: '500',
      fontSize: '0.875rem'
    }),
    singleValue: (base: Record<string, unknown>) => ({
      ...base,
      color: '#0f172a'
    }),
    menu: (base: Record<string, unknown>) => ({
      ...base,
      borderRadius: '0.75rem',
      marginTop: '0.25rem',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    }),
    menuList: (base: Record<string, unknown>) => ({
      ...base,
      padding: '0.25rem',
      borderRadius: '0.75rem'
    }),
    option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected ? '#0f172a' : state.isFocused ? '#f1f5f9' : 'white',
      color: state.isSelected ? 'white' : '#0f172a',
      cursor: 'pointer',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      fontWeight: state.isSelected ? '500' : '400',
      transition: 'all 0.15s',
      '&:active': {
        backgroundColor: state.isSelected ? '#0f172a' : '#e2e8f0'
      }
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (base: Record<string, unknown>) => ({
      ...base,
      color: '#64748b',
      '&:hover': {
        color: '#0f172a'
      }
    })
  };

  const validationMetrics = [
    { name: 'Duplicate Check', successRate: 99.8, failures: 8, category: 'document' },
    { name: 'Supplier Name', successRate: 97.2, failures: 108, category: 'supplier' },
    { name: 'Asset Name', successRate: 95.8, failures: 162, category: 'document' },
    { name: 'Billing Address', successRate: 94.3, failures: 219, category: 'supplier' },
    { name: 'Document Type', successRate: 98.9, failures: 42, category: 'document' },
    { name: 'Tax Invoice', successRate: 96.7, failures: 127, category: 'financial' },
    { name: 'Invoice or Credit Note', successRate: 99.1, failures: 35, category: 'document' },
    { name: 'Supplier TRN Number', successRate: 93.2, failures: 262, category: 'supplier' },
    { name: 'Customer TRN Number', successRate: 91.8, failures: 316, category: 'supplier' },
    { name: 'Bank Account Number', successRate: 96.4, failures: 139, category: 'financial' },
    { name: 'IBAN Number', successRate: 95.1, failures: 189, category: 'financial' },
    { name: 'Swift Code', successRate: 97.8, failures: 85, category: 'financial' },
    { name: 'Sort Code', successRate: 98.2, failures: 69, category: 'financial' },
    { name: 'ABA Routing Number', successRate: 99.3, failures: 27, category: 'financial' },
    { name: 'Invoice Number', successRate: 98.7, failures: 50, category: 'document' },
    { name: 'Invoice Date', successRate: 97.5, failures: 96, category: 'document' },
    { name: 'Invoice Currency', successRate: 99.4, failures: 23, category: 'financial' },
    { name: 'Invoice Amount before Tax', successRate: 94.8, failures: 200, category: 'financial' },
    { name: 'VAT Amount', successRate: 93.6, failures: 246, category: 'financial' },
    { name: 'Invoice Total Amount', successRate: 95.2, failures: 185, category: 'financial' },
    { name: 'Description', successRate: 89.7, failures: 397, category: 'document' },
    { name: 'Invoice FTA Requirements', successRate: 92.4, failures: 293, category: 'financial' },
    { name: 'PO Invoice', successRate: 96.8, failures: 123, category: 'document' },
    { name: 'Purchase Order/Work Order', successRate: 94.1, failures: 227, category: 'document' },
    { name: 'Supporting Documents', successRate: 87.3, failures: 489, category: 'document' },
    { name: 'Invoice Attached', successRate: 99.6, failures: 15, category: 'document' },
    { name: 'Split Gross Amount and VAT', successRate: 91.2, failures: 339, category: 'financial' }
  ];

  const categoryData = {
    document: validationMetrics.filter(m => m.category === 'document'),
    supplier: validationMetrics.filter(m => m.category === 'supplier'),
    financial: validationMetrics.filter(m => m.category === 'financial')
  };

  const errorTrends = [
    { month: 'Jan', document: 45, supplier: 32, financial: 28 },
    { month: 'Feb', document: 42, supplier: 35, financial: 31 },
    { month: 'Mar', document: 38, supplier: 29, financial: 25 },
    { month: 'Apr', document: 35, supplier: 27, financial: 22 },
    { month: 'May', document: 32, supplier: 24, financial: 19 }
  ];

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Analytics</h1>
              <p className="text-sm text-slate-500">Invoice validation insights</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="min-w-[180px]">
                <Select
                  value={timeRange}
                  onChange={(option) => option && setTimeRange(option)}
                  options={timeRangeOptions}
                  styles={customSelectStyles}
                  isSearchable={false}
                />
              </div>
              <button className="px-4 py-3 text-sm bg-slate-900 border border-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium shadow-sm">
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-2">Processing Time</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{currentMetrics.avgProcessingTime}</p>
            <div className="flex items-center text-xs">
              <span className="text-green-500 font-medium">{currentMetrics.trends.processing}</span>
              <span className="text-slate-400 ml-1">per invoice</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-2">Match Accuracy</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{currentMetrics.matchAccuracy}</p>
            <div className="flex items-center text-xs">
              <span className="text-green-500 font-medium">{currentMetrics.trends.accuracy}</span>
              <span className="text-slate-400 ml-1">{timeRange.value === '7d' ? 'last 7 days' : timeRange.value === '30d' ? 'last 30 days' : timeRange.value === '90d' ? 'last 90 days' : 'last 6 months'}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-2">Cost Savings</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{currentMetrics.costSavings}</p>
            <div className="flex items-center text-xs">
              <span className="text-green-500 font-medium">{currentMetrics.trends.savings}</span>
              <span className="text-slate-400 ml-1">{timeRange.value === '7d' ? 'this week' : timeRange.value === '30d' ? 'this month' : timeRange.value === '90d' ? 'this quarter' : 'last 6 months'}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-2">Error Rate</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{currentMetrics.errorRate}</p>
            <div className="flex items-center text-xs">
              <span className="text-green-500 font-medium">{currentMetrics.trends.errors}</span>
              <span className="text-slate-400 ml-1">below target</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Processing Volume Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Processing Volume</h2>
            <div className="h-48 flex items-end justify-between space-x-2">
              {(() => {
                const maxProcessed = Math.max(...monthlyData.map(d => d.processed));
                return monthlyData.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col-reverse items-center space-y-reverse space-y-1">
                      <div
                        className="w-full rounded-t hover:opacity-80 transition-all cursor-pointer"
                        style={{ 
                          height: `${(data.processed / maxProcessed) * 160}px`,
                          backgroundColor: '#7c3aed'
                        }}
                        title={`${data.processed.toLocaleString()} processed`}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-600 mt-2">{data.month}</span>
                    <span className="text-xs text-slate-500">{data.processed.toLocaleString()}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Success Rate Trend - Line Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Success rate trend</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-slate-900">
                    {(() => {
                      const avgRate = monthlyData.reduce((sum, data) => sum + (data.success / data.processed) * 100, 0) / monthlyData.length;
                      return avgRate.toFixed(1);
                    })()}%
                  </p>
                  <div className="flex items-center ml-2">
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-xs text-green-500 font-medium ml-1">2.3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="relative h-48 mt-6">
              <svg className="w-full h-full" viewBox="0 0 600 192">
                {(() => {
                  const successRates = monthlyData.map(data => (data.success / data.processed) * 100);
                  const minRate = Math.min(...successRates);
                  const maxRate = Math.max(...successRates);
                  const range = maxRate - minRate || 1;
                  
                  const points = successRates.map((rate, idx) => ({
                    x: 50 + (500 * idx) / (successRates.length - 1),
                    y: 160 - ((rate - minRate) / range) * 120,
                    rate: rate
                  }));

                  // Generate smooth path like dashboard
                  let path = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 1; i < points.length; i++) {
                    const prev = points[i - 1];
                    const curr = points[i];
                    const cpx = (prev.x + curr.x) / 2;
                    path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
                  }

                  return (
                    <>
                      {/* Y-axis labels */}
                      <text x="10" y="50" className="text-xs fill-slate-400">{maxRate.toFixed(1)}%</text>
                      <text x="10" y="110" className="text-xs fill-slate-400">{((minRate + maxRate) / 2).toFixed(1)}%</text>
                      <text x="10" y="170" className="text-xs fill-slate-400">{minRate.toFixed(1)}%</text>
                      
                      {/* Grid lines */}
                      <line x1="50" y1="40" x2="550" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="50" y1="100" x2="550" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="50" y1="160" x2="550" y2="160" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      
                      {/* Reference line (dashed) */}
                      <path
                        d="M 50 120 Q 150 115, 250 118 Q 350 120, 450 115 Q 500 112, 550 110"
                        stroke="#e2e8f0"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="6 6"
                      />
                      
                      {/* Main curve */}
                      <path
                        d={path}
                        stroke="#000"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data points */}
                      {points.map((point, idx) => (
                        <circle
                          key={idx}
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="#fff"
                          stroke="#000"
                          strokeWidth="2.5"
                        />
                      ))}
                      
                      {/* Highlight point with tooltip */}
                      <circle cx={points[Math.floor(points.length/2)].x} cy={points[Math.floor(points.length/2)].y} r="6" fill="#7c3aed" />
                      <circle cx={points[Math.floor(points.length/2)].x} cy={points[Math.floor(points.length/2)].y} r="4" fill="#fff" />
                      
                      {/* Tooltip */}
                      <g transform={`translate(${points[Math.floor(points.length/2)].x - 50}, ${points[Math.floor(points.length/2)].y - 50})`}>
                        <rect x="0" y="0" width="100" height="40" rx="8" fill="#7c3aed" />
                        <text x="50" y="18" textAnchor="middle" className="text-xs fill-white font-medium">
                          {points[Math.floor(points.length/2)].rate.toFixed(1)}%
                        </text>
                        <text x="50" y="32" textAnchor="middle" className="text-xs fill-white opacity-80">
                          {monthlyData[Math.floor(points.length/2)].month}
                        </text>
                      </g>
                      
                      {/* X-axis labels */}
                      {points.map((point, idx) => (
                        <text key={idx} x={point.x} y="185" textAnchor="middle" className="text-xs fill-slate-400">
                          {monthlyData[idx].month}
                        </text>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* Pie Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Invoice Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Sales Invoice Categories</h2>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Technology - 42% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="292"
                    strokeLinecap="round"
                  />
                  {/* Services - 28% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="362"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(151deg)', transformOrigin: '100px 100px' }}
                  />
                  {/* Products - 20% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="402"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(252deg)', transformOrigin: '100px 100px' }}
                  />
                  {/* Other - 10% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="453"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(324deg)', transformOrigin: '100px 100px' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-2xl font-bold text-slate-900">2,156</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  <span className="text-sm text-slate-700">Technology</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">42%</p>
                  <p className="text-xs text-slate-500">906</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-700">Services</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">28%</p>
                  <p className="text-xs text-slate-500">604</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-700">Products</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">20%</p>
                  <p className="text-xs text-slate-500">431</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-slate-700">Other</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">10%</p>
                  <p className="text-xs text-slate-500">215</p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Invoice Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Purchase Invoice Categories</h2>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Supplies - 35% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="327"
                    strokeLinecap="round"
                  />
                  {/* Equipment - 30% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="352"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(126deg)', transformOrigin: '100px 100px' }}
                  />
                  {/* Services - 25% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="377"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(234deg)', transformOrigin: '100px 100px' }}
                  />
                  {/* Other - 10% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#84cc16"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="453"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(324deg)', transformOrigin: '100px 100px' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-2xl font-bold text-slate-900">1,691</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-slate-700">Supplies</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">35%</p>
                  <p className="text-xs text-slate-500">592</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-slate-700">Equipment</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">30%</p>
                  <p className="text-xs text-slate-500">507</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-sm text-slate-700">Services</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">25%</p>
                  <p className="text-xs text-slate-500">423</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  <span className="text-sm text-slate-700">Other</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">10%</p>
                  <p className="text-xs text-slate-500">169</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'document', label: 'Document' },
              { key: 'supplier', label: 'Supplier' },
              { key: 'financial', label: 'Financial' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedCategory === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Overview */}
        {selectedCategory === 'overview' && (
          <div className="space-y-6">
            {/* Validation Success Rate by Category */}
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Validation Success Rate</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray="95.5, 100"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-900">95.5%</span>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900">Document</h3>
                  <p className="text-sm text-gray-500">12 validations</p>
                </div>
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray="94.4, 100"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-900">94.4%</span>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900">Supplier</h3>
                  <p className="text-sm text-gray-500">4 validations</p>
                </div>
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeDasharray="95.8, 100"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-900">95.8%</span>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900">Financial</h3>
                  <p className="text-sm text-gray-500">11 validations</p>
                </div>
              </div>
            </div>

            {/* Top Validation Issues */}
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Issues</h2>
              <div className="space-y-3">
                {validationMetrics
                  .sort((a, b) => b.failures - a.failures)
                  .slice(0, 6)
                  .map((metric, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${
                            metric.category === 'document' ? 'bg-blue-500' :
                            metric.category === 'supplier' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></span>
                          <span className="font-medium text-gray-900 text-sm">{metric.name}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                          <span>Success: {metric.successRate}%</span>
                          <span>Failures: {metric.failures}</span>
                        </div>
                      </div>
                      <div className="w-16">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              metric.successRate >= 95 ? 'bg-green-500' :
                              metric.successRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${metric.successRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Document Validation Details */}
        {selectedCategory === 'document' && (
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Validation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryData.document.map((metric, idx) => (
                <div key={idx} className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-sm">{metric.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      metric.successRate >= 95 ? 'bg-green-100 text-green-700' :
                      metric.successRate >= 90 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {metric.successRate}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          metric.successRate >= 95 ? 'bg-green-500' :
                          metric.successRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${metric.successRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Failures: {metric.failures}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supplier Validation Details */}
        {selectedCategory === 'supplier' && (
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Validation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryData.supplier.map((metric, idx) => (
                <div key={idx} className="p-5 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">{metric.name}</h3>
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      metric.successRate >= 95 ? 'bg-green-100 text-green-700' :
                      metric.successRate >= 90 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {metric.successRate}%
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metric.successRate >= 95 ? 'bg-green-500' :
                          metric.successRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${metric.successRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Failures: {metric.failures}</span>
                      <span className="text-xs text-gray-500">
                        {metric.failures > 200 ? 'High Impact' : metric.failures > 100 ? 'Medium Impact' : 'Low Impact'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Validation Details */}
        {selectedCategory === 'financial' && (
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Validation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryData.financial.map((metric, idx) => (
                <div key={idx} className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-sm">{metric.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      metric.successRate >= 95 ? 'bg-green-100 text-green-700' :
                      metric.successRate >= 90 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {metric.successRate}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          metric.successRate >= 95 ? 'bg-green-500' :
                          metric.successRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${metric.successRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Failures: {metric.failures}</span>
                      {(metric.name.includes('Amount') || metric.name.includes('VAT')) && (
                        <span>Impact: ${(metric.failures * 1250).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
