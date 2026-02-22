
import React from 'react';
import { CoachingData, CalculationResults, StepStatus } from '../types';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Target, DollarSign, Percent, ShieldCheck, Home, Info, Zap } from 'lucide-react';
import { COLORS, CHART_PALETTE, BENCHMARKS } from '../constants';

interface DashboardSectionProps {
  data: CoachingData;
  results: CalculationResults;
}

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1 align-middle">
    <Info size={14} className="text-slate-300 cursor-help" />
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-800 p-2 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 z-50">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
    </div>
  </div>
);

const DashboardSection: React.FC<DashboardSectionProps> = ({ data, results }) => {
  const formatAUD = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);
  
  // Updated to use monthlyData correctly from CoachingData
  const balanceData = data.monthlyData.map((m) => ({
    month: m.month,
    income: m.credit,
    expenses: m.debit,
    reduction: m.actualDebtReduction
  }));

  const ownershipData = [
    { name: 'You Own', value: results.homeOwnership.youOwn, color: COLORS.owner },
    { name: 'Bank Owns', value: results.homeOwnership.bankOwns, color: COLORS.bank }
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Debt Reduced By" 
          value={formatAUD(results.totalDebtReduction)} 
          subtitle="During Review Period"
          icon={<DollarSign className="text-emerald-500" />}
          trend={results.totalDebtReduction > 0 ? 'up' : 'down'}
        />
        <StatCard 
          title="Avg. Monthly Result" 
          value={formatAUD(results.avgMonthlyDebtReduction)} 
          subtitle="Monthly Momentum"
          icon={<TrendingUp className="text-blue-500" />}
        />
        <StatCard 
          title="Beating Previous" 
          value={`${results.beatingPreviousPercent.toFixed(1)}%`} 
          subtitle="Versus Past Report"
          icon={<Zap className="text-purple-500" />}
          trend={results.beatingPreviousPercent > 0 ? 'up' : 'down'}
        />
        <StatCard 
          title="Savings Rate" 
          value={`${results.savingsRate.toFixed(1)}%`} 
          subtitle={results.savingsRateSentence}
          icon={<Percent className="text-amber-500" />}
          info="Savings Rate: (Income - Expenses) / Income"
        />
        <StatCard 
          title="Current LVR" 
          value={`${results.currentLVR.toFixed(1)}%`} 
          subtitle="Loan to Value Ratio"
          icon={<Target className="text-indigo-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[#250B40] font-black uppercase text-xs tracking-widest">Efficiency Trend</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"/> <span className="text-[10px] font-bold text-slate-400">Income: {formatAUD(results.avgMonthlyIncome)}/mo</span></div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"/> <span className="text-[10px] font-bold text-slate-400">Expenses: {formatAUD(results.avgMonthlyExpenses)}/mo</span></div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => `$${v/1000}k`} />
                <ChartTooltip />
                <Line type="monotone" dataKey="income" stroke={COLORS.success} strokeWidth={4} dot={{ r: 4, fill: COLORS.success }} />
                <Line type="monotone" dataKey="expenses" stroke={COLORS.error} strokeWidth={4} dot={{ r: 4, fill: COLORS.error }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h3 className="text-[#250B40] font-black mb-6 uppercase text-xs tracking-widest">Equity Summary</h3>
          <div className="h-[250px]">
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
            <p className="text-xs font-black text-[#250B40] uppercase">You own {results.homeOwnership.youOwn.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, trend, info }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">{icon}</div>
      <div className="flex flex-col items-end">
        {info && <Tooltip text={info} />}
        {trend && (
          <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend === 'up' ? '↑ Increasing' : '↓ Falling'}
          </span>
        )}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-[#250B40] tracking-tighter">{value}</p>
      <p className="text-[10px] text-slate-400 font-bold leading-tight h-8">{subtitle}</p>
    </div>
  </div>
);

export default DashboardSection;
