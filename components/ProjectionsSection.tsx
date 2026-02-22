
import React, { useMemo } from 'react';
import { CoachingData, CalculationResults } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend, Line, LineChart, ReferenceLine
} from 'recharts';
import { TrendingUp, Clock, DollarSign, Zap, Info, CreditCard, Target } from 'lucide-react';
import { format, addMonths, parseISO, differenceInMonths } from 'date-fns';
import { modelCurvedOOD } from '../utils/calculations';

interface ProjectionsSectionProps {
  data: CoachingData;
  results: CalculationResults;
  setData: React.Dispatch<React.SetStateAction<CoachingData>>;
}

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1 align-middle">
    <Info size={14} className="text-slate-400 cursor-help" />
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-[1.5rem] bg-slate-900 p-4 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-50 shadow-2xl border border-slate-700 leading-relaxed">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
    </div>
  </div>
);

const ProjectionsSection: React.FC<ProjectionsSectionProps> = ({ data, results, setData }) => {
  const formatAUD = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  // Model Impacts
  const wsaImpact = (data.weeklySpendingAmount - data.proposedWeeklySpendingAmount) * 4.33; 
  const flexImpact = data.proposedFlexAmount;
  
  // 1. Base Trajectory (Current Results)
  const baseModel = useMemo(() => modelCurvedOOD(data.currentLoanBalance, results.avgMonthlyDebtReduction), [data.currentLoanBalance, results.avgMonthlyDebtReduction]);
  
  // 2. Flex Scenario (Current + Flex + WSA)
  const flexModel = useMemo(() => {
    const totalMonthlyImpact = results.avgMonthlyDebtReduction + flexImpact + wsaImpact;
    return modelCurvedOOD(data.currentLoanBalance, totalMonthlyImpact);
  }, [data.currentLoanBalance, results.avgMonthlyDebtReduction, flexImpact, wsaImpact]);

  // 3. Previous Loan Trajectory
  const prevModel = useMemo(() => {
    const prevMonths = differenceInMonths(parseISO(data.previousOODDate || '2050-01-01'), new Date());
    const prevMonthlyReduction = prevMonths > 0 ? data.currentLoanBalance / prevMonths : 1000;
    return modelCurvedOOD(data.currentLoanBalance, prevMonthlyReduction);
  }, [data.currentLoanBalance, data.previousOODDate]);

  // Combined Data for Comparison Charts
  const comparisonData = useMemo(() => {
    const points = [];
    // Calculate for next 20 years or until debt free
    const maxMonths = Math.max(baseModel.monthsToZero, flexModel.monthsToZero, prevModel.monthsToZero, 240);
    for (let i = 0; i <= Math.min(maxMonths, 480); i += 12) {
      const date = format(addMonths(new Date(), i), 'yyyy');
      points.push({
        name: date,
        base: baseModel.points.find(p => p.name === date)?.balance ?? 0,
        flex: flexModel.points.find(p => p.name === date)?.balance ?? 0,
        previous: prevModel.points.find(p => p.name === date)?.balance ?? 0
      });
    }
    return points;
  }, [baseModel, flexModel, prevModel]);

  const currentOODDate = format(addMonths(new Date(), baseModel.monthsToZero), 'MMM yyyy');
  const flexOODDate = format(addMonths(new Date(), flexModel.monthsToZero), 'MMM yyyy');
  const prevOODDate = format(parseISO(data.previousOODDate || '2050-01-01'), 'MMM yyyy');

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[#250B40] uppercase tracking-tight flex items-center gap-2">
              <Zap className="text-amber-500" /> FLEX Modelling
              <Tooltip text="FLEX (Flexible Extra Repayments): Surpluses taken out of the loan. Lowering FLEX results in more principal reduction." />
            </h3>
            <span className="bg-slate-50 px-4 py-2 rounded-2xl text-[#250B40] font-black text-lg shadow-inner">
              {formatAUD(data.proposedFlexAmount)}<span className="text-[10px] ml-1 text-slate-400">/mo</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-bold leading-relaxed">Adjust your FLEX (redraw usage) to see the impact on your OOD (Out of Debt) timeline. Lower redraw = Faster debt freedom.</p>
          <input 
            type="range" min="0" max="5000" step="100" className="w-full accent-[#250B40] h-3 bg-slate-100 rounded-full"
            value={data.proposedFlexAmount}
            onChange={(e) => setData(prev => ({ ...prev, proposedFlexAmount: Number(e.target.value) }))}
          />
          <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest">
            <span>$0</span>
            <span>$2,500</span>
            <span>$5,000</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[#250B40] uppercase tracking-tight flex items-center gap-2">
              <CreditCard className="text-indigo-500" /> Weekly Spending (WSA)
              <Tooltip text="WSA (Weekly Spending Amount): Your discretionary weekly budget. Lowering this increases your monthly surplus." />
            </h3>
            <span className="bg-slate-50 px-4 py-2 rounded-2xl text-[#250B40] font-black text-lg shadow-inner">
              {formatAUD(data.proposedWeeklySpendingAmount)}<span className="text-[10px] ml-1 text-slate-400">/wk</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-bold leading-relaxed">Lowering your WSA directly improves your OOD trajectory by increasing the monthly debt reduction capacity.</p>
          <input 
            type="range" min="0" max="1000" step="10" className="w-full accent-[#250B40] h-3 bg-slate-100 rounded-full"
            value={data.proposedWeeklySpendingAmount}
            onChange={(e) => setData(prev => ({ ...prev, proposedWeeklySpendingAmount: Number(e.target.value) }))}
          />
          <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest">
            <span>$0</span>
            <span>$500</span>
            <span>$1,000</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 lg:col-span-1">
          <StatCard 
            title="Current OOD Date" 
            value={currentOODDate} 
            subtitle="Trajectory at current performance"
            icon={<Target size={20} className="text-blue-500" />}
            info="OOD (Out of Debt): The calculated date your loan balance reaches $0."
          />
          <StatCard 
            title="Accelerated OOD" 
            value={flexOODDate} 
            subtitle="With proposed adjustments"
            icon={<Zap size={20} className="text-amber-500" />}
            highlight
            info="Accelerated Date: The OOD date based on your selected FLEX and WSA adjustments."
          />
          <StatCard 
            title="Previous OOD Goal" 
            value={prevOODDate} 
            subtitle="Previous loan trajectory"
            icon={<Clock size={20} className="text-slate-400" />}
          />
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Chart 1: Base vs Previous */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" /> Base Projection vs Previous Loan Path
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(v) => `$${v/1000}k`} />
                  <ChartTooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '16px' }} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="base" name="Base Projection (Current)" stroke="#250B40" strokeWidth={5} dot={false} />
                  <Line type="monotone" dataKey="previous" name="Previous Loan Trajectory" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="8 8" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: FLEX Scenario Modelling */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Zap size={16} className="text-amber-500" /> FLEX Scenario Modelling (Interest Accelerated)
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={comparisonData}>
                  <defs>
                    <linearGradient id="colorFlex" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(v) => `$${v/1000}k`} />
                  <ChartTooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '16px' }} />
                  <Area type="monotone" dataKey="flex" name="Proposed Accelerated Path" stroke="#f59e0b" strokeWidth={5} fillOpacity={1} fill="url(#colorFlex)" />
                  <Line type="monotone" dataKey="base" name="Current Base Path" stroke="#250B40" strokeWidth={2} strokeDasharray="10 10" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest text-center mt-6">Trajectory includes interest savings acceleration as principal reduces.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, highlight, info }: any) => (
  <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${highlight ? 'bg-[#250B40] border-[#250B40] text-white shadow-2xl shadow-purple-900/20 scale-[1.02]' : 'bg-white border-slate-200 shadow-sm hover:shadow-lg'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${highlight ? 'bg-white/10' : 'bg-slate-50'}`}>{icon}</div>
      {info && <Tooltip text={info} />}
    </div>
    <p className={`text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-[#E6DEEE]/60' : 'text-slate-400'}`}>{title}</p>
    <p className="text-3xl font-black tracking-tighter mt-1">{value}</p>
    <p className={`text-[10px] font-bold mt-2 ${highlight ? 'text-[#E6DEEE]/40' : 'text-slate-300'}`}>{subtitle}</p>
  </div>
);

export default ProjectionsSection;
