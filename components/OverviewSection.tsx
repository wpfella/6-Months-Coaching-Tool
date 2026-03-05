
import React from 'react';
import { CoachingData, CalculationResults } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { Target, DollarSign, Zap, TrendingUp, Home, ShieldCheck } from 'lucide-react';
import { COLORS } from '../constants';

interface OverviewSectionProps {
  data: CoachingData;
  results: CalculationResults;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ data, results }) => {
  const formatAUD = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  const summaryData = [
    { name: 'Debt Reduced', value: results.totalDebtReduction, color: '#10b981' },
    { name: 'Redraws', value: results.totalAdditionalRedraws, color: '#ef4444' },
    { name: 'Net Progress', value: results.totalDebtReduction - results.totalAdditionalRedraws, color: '#6366f1' }
  ];

  const ownershipData = [
    { name: 'You Own', value: results.homeOwnership.youOwn, color: COLORS.owner },
    { name: 'Bank Owns', value: results.homeOwnership.bankOwns, color: COLORS.bank }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#250B40] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300 mb-2">Total Debt Reduction</p>
          <h3 className="text-5xl font-black tracking-tighter">{formatAUD(results.totalDebtReduction)}</h3>
          <div className="mt-6 flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <TrendingUp size={14} /> Beating previous by {results.beatingPreviousPercent.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Current Equity</p>
            <h3 className="text-4xl font-black text-[#250B40] tracking-tighter">{formatAUD(data.currentPropertyValuation - data.currentLoanBalance)}</h3>
          </div>
          <div className="mt-4 flex items-center gap-3">
             <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${results.homeOwnership.youOwn}%` }} />
             </div>
             <span className="text-[10px] font-black text-[#250B40]">{results.homeOwnership.youOwn.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Savings Efficiency</p>
            <h3 className="text-4xl font-black text-[#250B40] tracking-tighter">{results.savingsRate.toFixed(1)}%</h3>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-2 leading-tight">{results.savingsRateSentence}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Summary Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#250B40] flex items-center gap-2">
              <Zap size={16} className="text-amber-500" /> Review Period Snapshot
            </h4>
            <div className="group relative">
              <div className="text-[10px] font-black text-slate-400 border border-slate-200 px-2 py-1 rounded-md cursor-help">What is Net Progress?</div>
              <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-64 rounded-xl bg-slate-800 p-3 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 z-50 shadow-2xl">
                Net Progress is your actual debt reduction after accounting for any additional redraws taken during the period. It represents the "real" movement in your loan balance.
                <div className="absolute top-full right-4 border-8 border-transparent border-t-slate-800" />
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData} layout="vertical" margin={{ left: 20, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} width={100} />
                <ChartTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ownership Pie */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#250B40] mb-4 w-full text-left flex items-center gap-2">
            <Home size={16} className="text-indigo-500" /> Ownership Structure
          </h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ownershipData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                  {ownershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <p className="text-2xl font-black text-[#250B40]">{results.homeOwnership.youOwn.toFixed(1)}% OWNED</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress towards full ownership</p>
          </div>
        </div>
      </div>

      {/* Quick Actions / Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Top Achievement</p>
            <p className="text-sm font-bold text-emerald-900">You've reduced your debt by {formatAUD(results.totalDebtReduction)} this period!</p>
          </div>
        </div>
        <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Target size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Next Milestone</p>
            <p className="text-sm font-bold text-indigo-900">Complete Step {Object.values(results.stepsStatus).filter(s => s === 'YES').length + 1} to unlock more security.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
