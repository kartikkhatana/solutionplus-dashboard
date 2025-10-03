'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function DashboardPage() {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const [realtimeData, setRealtimeData] = useState({
    processingRate: 97.8,
    activeJobs: 12,
    queuedItems: 45
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        processingRate: Math.min(99.9, prev.processingRate + (Math.random() - 0.5) * 0.5),
        activeJobs: Math.max(0, prev.activeJobs + Math.floor(Math.random() * 3 - 1)),
        queuedItems: Math.max(0, prev.queuedItems + Math.floor(Math.random() * 5 - 2))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const processingData = [
    { day: 21, value: 68000 },
    { day: 22, value: 70000 },
    { day: 23, value: 75000 },
    { day: 24, value: 78000 },
    { day: 25, value: 80456 },
    { day: 26, value: 79000 },
    { day: 27, value: 82000 }
  ];

  const topVendors = [
    { name: 'TechSupply Corp', amount: 672245.00, invoices: '1245 pcs', status: 'active', statusColor: 'green' },
    { name: 'Office Solutions Ltd', amount: 483527.99, invoices: '989 pcs', status: 'active', statusColor: 'green' },
    { name: 'Digital Systems Inc', amount: 342789.99, invoices: '867 pcs', status: 'active', statusColor: 'green' }
  ];

  const generateSmoothPath = (data: { day: number; value: number }[]) => {
    const width = 600;
    const height = 200;
    const padding = 20;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    
    const points = data.map((item, idx) => ({
      x: padding + (width - 2 * padding) * (idx / (data.length - 1)),
      y: height - padding - ((item.value - minValue) / range) * (height - 2 * padding)
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    
    return { path, points };
  };

  const { path, points } = generateSmoothPath(processingData);

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Workflow</h1>
          {/* <p className="text-sm text-slate-500">Here's your analytic details.</p> */}
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Total Invoices */}
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
            <p className="text-xs text-slate-500 mb-2">Total invoices</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">3,847</p>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-500 font-medium">12.50%</span>
              <span className="text-slate-400 ml-1">from June</span>
            </div>
          </div>

          {/* Processing Accuracy */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
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
              <p className="text-xs text-slate-500 mb-2">Processing accuracy</p>
              <p className="text-2xl font-bold text-slate-900 mb-2">{realtimeData.processingRate.toFixed(1)}%</p>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-500 font-medium">2.30%</span>
              <span className="text-slate-400 ml-1">from June</span>
            </div>
          </div>

          {/* Average Amount */}
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
            <p className="text-xs text-slate-500 mb-2">Avg. invoice value</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">$128,890.97</p>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-red-500 mr-1 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-red-500 font-medium">10.07%</span>
              <span className="text-slate-400 ml-1">from June</span>
            </div>
          </div>

          {/* Active Vendors */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Active vendors</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">247</p>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-500 font-medium">8.30%</span>
              <span className="text-slate-400 ml-1">from June</span>
            </div>
          </div>

          {/* Cost Savings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Cost savings</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">$45.2K</p>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-500 font-medium">28.4%</span>
              <span className="text-slate-400 ml-1">this quarter</span>
            </div>
          </div>

          {/* Processing Time */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Avg. processing time</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">1.8s</p>
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-green-500 mr-1 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-500 font-medium">15.7%</span>
              <span className="text-slate-400 ml-1">faster</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Invoice Category Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-slate-900">Invoice Categories</h3>
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Technology - 38% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="312"
                    strokeLinecap="round"
                  />
                  {/* Services - 28% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="171"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(137deg)', transformOrigin: '100px 100px' }}
                  />
                  {/* Supplies - 22% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="281"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(238deg)', transformOrigin: '100px 100px' }}
                  />
                  {/* Other - 12% */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="40"
                    strokeDasharray="503"
                    strokeDashoffset="442"
                    strokeLinecap="round"
                    style={{ transform: 'rotate(317deg)', transformOrigin: '100px 100px' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-2xl font-bold text-slate-900">3,847</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-700">Technology</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">38%</p>
                  <p className="text-xs text-slate-500">1,462</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-slate-700">Services</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">28%</p>
                  <p className="text-xs text-slate-500">1,077</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-slate-700">Supplies</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">22%</p>
                  <p className="text-xs text-slate-500">846</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-700">Other</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">12%</p>
                  <p className="text-xs text-slate-500">462</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Overall Sales Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Overall sales</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-slate-900">$80,456.79</p>
                  <div className="flex items-center ml-2">
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-xs text-green-500 font-medium ml-1">78.50%</span>
                  </div>
                </div>
              </div>
              <button className="text-slate-400 text-xs hover:text-slate-600 flex items-center">
                Current month
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Chart */}
            <div className="relative h-64 mt-6">
              <svg className="w-full h-full" viewBox="0 0 600 240">
                {/* Y-axis labels - dynamically calculated */}
                {(() => {
                  const maxValue = Math.max(...processingData.map(d => d.value));
                  const minValue = Math.min(...processingData.map(d => d.value));
                  const range = maxValue - minValue;
                  const padding = range * 0.1; // Add 10% padding
                  const yMax = maxValue + padding;
                  const yMin = minValue - padding;
                  const yRange = yMax - yMin;
                  
                  const yLabels = [
                    { y: 30, value: yMax },
                    { y: 90, value: yMax - (yRange * 0.33) },
                    { y: 150, value: yMax - (yRange * 0.67) },
                    { y: 210, value: yMin }
                  ];
                  
                  return yLabels.map((label, idx) => (
                    <text key={idx} x="10" y={label.y} className="text-xs fill-slate-400">
                      ${(label.value / 1000).toFixed(0)}K
                    </text>
                  ));
                })()}
                
                {/* Grid lines */}
                <line x1="50" y1="30" x2="580" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="50" y1="90" x2="580" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="50" y1="150" x2="580" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Reference line (dashed) */}
                <path
                  d="M 50 120 Q 150 110, 250 115 Q 350 120, 450 105 Q 500 100, 580 95"
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
                
                {/* Interactive data points with hover areas */}
                {points.map((point, idx) => {
                  const isHovered = hoveredPoint === idx;
                  
                  return (
                    <g key={idx}>
                      {/* Invisible hover area */}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="15"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(idx)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      
                      {/* Visual dot */}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isHovered ? "6" : "4"}
                        fill={isHovered ? "#7c3aed" : "#fff"}
                        stroke={isHovered ? "#7c3aed" : "#000"}
                        strokeWidth="2.5"
                        className="transition-all pointer-events-none"
                      />
                      {isHovered && (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="#fff"
                          className="pointer-events-none"
                        />
                      )}
                    </g>
                  );
                })}
                
                {/* Tooltip - rendered last so it appears on top */}
                {hoveredPoint !== null && (() => {
                  const point = points[hoveredPoint];
                  const tooltipX = point.x < 120 ? point.x : point.x > 480 ? point.x - 100 : point.x - 50;
                  const tooltipY = point.y < 80 ? point.y + 15 : point.y - 50;
                  
                  return (
                    <g transform={`translate(${tooltipX}, ${tooltipY})`} className="pointer-events-none">
                      <rect x="0" y="0" width="100" height="40" rx="8" fill="#7c3aed" />
                      <text x="50" y="18" textAnchor="middle" className="text-xs fill-white font-medium">
                        ${(processingData[hoveredPoint].value / 1000).toFixed(1)}K
                      </text>
                      <text x="50" y="32" textAnchor="middle" className="text-xs fill-white opacity-80">
                        May {processingData[hoveredPoint].day}, 2022
                      </text>
                    </g>
                  );
                })()}
                
                {/* X-axis labels */}
                {processingData.map((item, idx) => {
                  const point = points[idx];
                  return (
                    <text key={idx} x={point.x} y="230" textAnchor="middle" className="text-xs fill-slate-400">
                      {item.day}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Vendors */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-slate-900 flex items-center">
                Top Vendors
                <svg className="w-4 h-4 ml-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </h3>
              <div className="flex items-center text-xs text-slate-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                10 May - 27 May
                <button className="ml-2 text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 text-xs text-slate-500 font-medium mb-4 pb-2 border-b border-slate-100">
              <div className="col-span-5">Vendor name</div>
              <div className="col-span-3 text-right">Amount</div>
              <div className="col-span-2 text-right">Invoices</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-4">
              {topVendors.map((vendor, idx) => {
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
                  </svg>
                ];
                
                const iconColors = [
                  'from-blue-500 to-blue-600',
                  'from-purple-500 to-purple-600',
                  'from-green-500 to-green-600'
                ];
                
                return (
                  <div key={idx} className="grid grid-cols-12 gap-4 items-center text-sm">
                    <div className="col-span-5 flex items-center">
                      <div className={`w-8 h-8 bg-gradient-to-br ${iconColors[idx]} rounded-lg mr-3 flex items-center justify-center text-white`}>
                        {vendorIcons[idx]}
                      </div>
                      <span className="font-medium text-slate-900">{vendor.name}</span>
                    </div>
                  <div className="col-span-3 text-right text-slate-900">${vendor.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="col-span-2 text-right text-slate-500">{vendor.invoices}</div>
                  <div className="col-span-2 text-right">
                    <span className="inline-flex items-center text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${vendor.statusColor === 'green' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className={vendor.statusColor === 'green' ? 'text-green-600' : 'text-red-600'}>
                        {vendor.status === 'active' ? 'In stock' : 'Out of stock'}
                      </span>
                    </span>
                  </div>
                </div>
              );
              })}
            </div>
          </div>

          {/* Compliance Status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-slate-900 flex items-center">
                Compliance metrics
                <button className="ml-2 text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </h3>
            </div>

            <div className="space-y-6">
              {[
                { country: 'PO Match Rate', value: 60456, percentage: 96 },
                { country: 'Amount Accuracy', value: 83478, percentage: 82 },
                { country: 'Date Validation', value: 45897, percentage: 46 },
                { country: 'Vendor Compliance', value: 56234, percentage: 56 }
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-900">{item.country}</span>
                    <span className="text-sm text-slate-500">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-slate-900 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`,
                        background: 'repeating-linear-gradient(45deg, #0f172a, #0f172a 10px, #1e293b 10px, #1e293b 20px)'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
