import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DollarSign, TrendingUp, ArrowDownRight, ArrowUpRight, BarChart3, PieChart } from 'lucide-react';

export const AdminRevenueScreen = () => {
  const [period, setPeriod] = useState('Monthly');

  const monthlyBreakdown = [
    { source: 'Monthly Publishing Plan (₹199)', amount: '₹6,368', percentage: '51%' },
    { source: 'Quarterly Publishing Plan (₹499)', amount: '₹3,493', percentage: '28%' },
    { source: 'Yearly Publishing Plan (₹1,499)', amount: '₹2,589', percentage: '21%' }
  ];

  return (
    <AdminLayout title="Platform Revenue & Margins">
      {/* Top Filter */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-semibold">Accounting Period: 2026 Fiscal Q3</span>
        <div className="flex items-center gap-1 bg-[#140e2b] p-1 rounded-2xl border border-white/10 text-xs">
          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                period === p
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#130d29] border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Total Subscription Revenue</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-heading">₹12,450</div>
          <span className="text-[10px] text-emerald-400 font-bold">+18.5% vs previous month</span>
        </div>

        <div className="p-5 rounded-3xl bg-[#130d29] border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Creator Disbursements</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-heading">₹5,800</div>
          <span className="text-[10px] text-amber-400 font-bold">Paid to verified creators</span>
        </div>

        <div className="p-5 rounded-3xl bg-[#130d29] border border-pink-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Net Platform Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-extrabold text-pink-400 font-heading">₹6,650</div>
          <span className="text-[10px] text-white/80 font-bold">53.4% Net Margin</span>
        </div>
      </div>

      {/* Subscription Source Breakdown */}
      <div className="p-5 rounded-3xl bg-[#130d29] border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white font-heading">
          Subscription Inflow by Tier
        </h3>

        <div className="space-y-3">
          {monthlyBreakdown.map(item => (
            <div key={item.source} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-200">{item.source}</span>
                <span className="font-extrabold text-white">{item.amount} ({item.percentage})</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                  style={{ width: item.percentage }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};
