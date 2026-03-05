
import React from 'react';
import { CoachingData, CalculationResults, StepStatus } from '../types';
import { LOGOS, COLORS } from '../constants';
import { format, addMonths } from 'date-fns';
import { modelCurvedOOD } from '../utils/calculations';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, ReferenceLine, BarChart, Bar
} from 'recharts';

interface FullReportProps {
  data: CoachingData;
  results: CalculationResults;
  reportRef: React.RefObject<HTMLDivElement>;
}

const PageWrapper: React.FC<{ children: React.ReactNode; pageNum: number; totalPages: number; loanIdentifier?: string }> = ({ children, pageNum, totalPages, loanIdentifier }) => (
  <div className="bg-white min-h-[1123px] w-[794px] mx-auto shadow-2xl relative mb-12 flex flex-col overflow-hidden border border-slate-100 print:shadow-none print:mb-0">
    <div className="flex-1 p-10 flex flex-col">
      {children}
    </div>
    <div className="h-4 bg-[#250B40] w-full" />
    <div className="absolute bottom-6 right-10 text-slate-400 text-[8px] font-bold uppercase tracking-widest flex flex-col items-end">
      <span>Crown Money | Page {pageNum} of {totalPages}</span>
      {loanIdentifier && <span className="mt-1 opacity-60">{loanIdentifier}</span>}
    </div>
  </div>
);

const AchievementTile = ({ label, value, primary, icon }: any) => (
  <div className={`p-8 rounded-2xl border flex items-center gap-6 transition-all ${primary ? 'bg-[#250B40] text-white border-[#250B40] shadow-xl' : 'bg-white border-slate-100 shadow-sm'}`}>
    <div className={`p-4 rounded-2xl ${primary ? 'bg-white/10' : 'bg-[#F7F5F9]'}`}>{icon}</div>
    <div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${primary ? 'text-[#E6DEEE]' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-4xl font-black tracking-tighter leading-none ${primary ? 'text-white' : 'text-[#250B40]'}`}>{value}</p>
    </div>
  </div>
);

const RedrawTile = ({ label, value, highlight, icon }: any) => (
  <div className={`w-full max-w-md p-8 rounded-[2.5rem] border flex items-center gap-8 ${highlight ? 'bg-[#250B40] text-white border-[#250B40] shadow-xl' : 'bg-white border-slate-100 shadow-sm'}`}>
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${highlight ? 'bg-white/10' : 'bg-slate-50'}`}>
       {icon === 'flex' && <span className="text-2xl">⚡</span>}
       {icon === 'total' && <span className="text-2xl">💰</span>}
       {icon === 'avg' && <span className="text-2xl">📈</span>}
    </div>
    <div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-purple-200' : 'text-slate-400'}`}>{label}</p>
      <p className="text-3xl font-black tracking-tighter">{value}</p>
    </div>
  </div>
);

const FullReport: React.FC<FullReportProps> = ({ data, results, reportRef }) => {
  const formatAUD = (v: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 }).format(v);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    // If it's already in DD/MM/YYYY format, return it
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    // If it's in YYYY-MM-DD format (from date input), convert it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    // Fallback to native parsing if possible
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-AU');
    } catch {
      return dateStr;
    }
  };

  return (
    <div ref={reportRef} className="flex flex-col items-center">
      {/* PAGE 1: COVER */}
      <PageWrapper pageNum={1} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex-1 flex flex-col -m-10">
          <div className="h-[60%] bg-[#250B40] p-20 text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-16 left-16 z-20"><img src={LOGOS.light} alt="Crown" className="h-10 brightness-0 invert" /></div>
            <div className="z-10 space-y-12 mt-10">
              <h1 className="text-7xl font-black tracking-tighter leading-[0.9] max-w-md">Home Ownership Report</h1>
              <div className="space-y-6">
                <div>
                  <p className="text-[#E6DEEE] uppercase tracking-[0.4em] text-[10px] font-black mb-2 opacity-40">Prepared For</p>
                  <p className="text-5xl font-black tracking-tight">{data.householdNames}</p>
                  {data.loanIdentifier && <p className="text-xl font-bold mt-2 opacity-60">{data.loanIdentifier}</p>}
                </div>
                <div>
                  <p className="text-[#E6DEEE] uppercase tracking-[0.4em] text-[10px] font-black mb-2 opacity-40">Review Period</p>
                  <p className="text-3xl font-black tracking-tight opacity-90">{formatDate(data.startDate)} - {formatDate(data.endDate)}</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          </div>
          <div className="flex-1 bg-white flex items-center justify-center p-20">
            {data.propertyImageUrl && (
              <div className="w-[450px] h-[450px] rounded-full border-[15px] border-slate-50 overflow-hidden shadow-2xl">
                <img src={data.propertyImageUrl} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </PageWrapper>

      {/* PAGE 2: ANNUAL REPORT TABLE */}
      <PageWrapper pageNum={2} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-10">
          <h2 className="text-5xl font-black text-[#854d9c]">Annual Report</h2>
          <img src={LOGOS.dark} className="h-8" />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-[8px] text-left border-collapse">
            <thead>
              <tr className="bg-[#250B40] text-white">
                <th className="p-2 font-bold uppercase tracking-wider">Month</th>
                <th className="p-2 font-bold uppercase tracking-wider text-right">Debit</th>
                <th className="p-2 font-bold uppercase tracking-wider text-right">Credit</th>
                <th className="p-2 font-bold uppercase tracking-wider text-right">Loan Balance</th>
                <th className="p-2 font-bold uppercase tracking-wider text-right">One-Off Credits</th>
                <th className="p-2 font-bold uppercase tracking-wider text-right">One-Off Debits</th>
                <th className="p-2 font-bold uppercase tracking-wider text-right">Actual Debt Reduction</th>
                <th className="p-2 font-bold uppercase tracking-wider text-right">Total Additional Redraws</th>
                <th className="p-2 font-bold uppercase tracking-wider text-right">Savings Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.monthlyData.map((m, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="p-2 font-bold text-[#250B40]">{m.month}</td>
                  <td className="p-2 text-right">{formatAUD(m.debit)}</td>
                  <td className="p-2 text-right">{formatAUD(m.credit)}</td>
                  <td className="p-2 text-right font-medium">{formatAUD(m.loanBalance)}</td>
                  <td className="p-2 text-right text-indigo-600">${(m.oneOffCreditsRemoved || 0).toLocaleString()}</td>
                  <td className="p-2 text-right text-orange-600">${(m.oneOffDebitsRemoved || 0).toLocaleString()}</td>
                  <td className="p-2 text-right font-black text-slate-600">${m.actualDebtReduction.toLocaleString('en-AU', {minimumFractionDigits:2})}</td>
                  <td className="p-2 text-right font-medium text-[#250B40]">${m.redraws.toLocaleString('en-AU', {minimumFractionDigits:2})}</td>
                  <td className="p-2 text-right font-bold">{m.savingsRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-[#250B40] flex items-center justify-center text-white text-lg font-black shrink-0">!</div>
           <p className="text-[10px] font-bold text-slate-500 leading-tight">
             Once-off debits and credits are removed from our projections to show a more accurate picture of underlying performance.
           </p>
        </div>
      </PageWrapper>

      {/* PAGE 3: ACHIEVEMENTS */}
      <PageWrapper pageNum={3} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-10">
          <h2 className="text-5xl font-black text-[#854d9c]">Key Achievements</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-10">
          <div className="h-[350px] flex items-center justify-center bg-slate-50 rounded-3xl p-6">
            <BarChart width={300} height={300} data={[{ name: 'Debt Reduction', value: results.totalDebtReduction }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
              <Bar dataKey="value" fill="#250B40" radius={[15, 15, 0, 0]} isAnimationActive={false}>
                <Cell fill="#250B40" />
              </Bar>
            </BarChart>
          </div>
          <div className="space-y-4">
            <AchievementTile label="Projected Debt Free Date" value={results.currentDebtFreeDate} primary icon="📅" />
            <AchievementTile label="Avg. Monthly Reduction" value={formatAUD(results.avgMonthlyDebtReduction)} icon="📈" />
            <AchievementTile label="Total Debt Reduced" value={formatAUD(results.totalDebtReduction)} icon="💰" />
          </div>
        </div>
      </PageWrapper>

      {/* PAGE 4: MONTHLY DEBT REDUCTION */}
      <PageWrapper pageNum={4} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-10">
          <h2 className="text-5xl font-black text-[#854d9c]">Monthly Debt Reduction</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="h-[400px] w-full bg-slate-50 rounded-3xl p-8 flex items-center justify-center">
          <BarChart width={650} height={350} data={data.monthlyData.map(m => ({ name: m.month.substring(0, 3), value: m.actualDebtReduction }))}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
            <Bar dataKey="value" fill="#250B40" radius={[10, 10, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </div>
        <div className="mt-8 p-8 bg-slate-50 rounded-2xl border border-slate-100">
           <p className="text-sm font-bold text-slate-600 leading-relaxed">
             This chart visualizes your actual debt reduction progress month-by-month. Positive bars indicate successful debt reduction, while negative bars (if any) show months where redraws or expenses exceeded income.
           </p>
        </div>
      </PageWrapper>

      {/* PAGE 5: LOAN BALANCE TREND */}
      <PageWrapper pageNum={5} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-10">
          <h2 className="text-5xl font-black text-[#854d9c]">Loan Balance Trend</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="h-[400px] w-full bg-slate-50 rounded-3xl p-8 flex items-center justify-center">
          <AreaChart width={650} height={350} data={data.monthlyData.map(m => ({ name: m.month.substring(0, 3), value: m.loanBalance }))}>
            <defs>
              <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#250B40" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#250B40" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Area type="monotone" dataKey="value" stroke="#250B40" strokeWidth={3} fillOpacity={1} fill="url(#colorBal)" isAnimationActive={false} />
          </AreaChart>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-8">
           <div className="p-6 bg-[#250B40] text-white rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Starting Balance</p>
              <p className="text-3xl font-black">{formatAUD(data.settlementLoanAmount)}</p>
           </div>
           <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Current Balance</p>
              <p className="text-3xl font-black text-[#250B40]">{formatAUD(data.monthlyData[data.monthlyData.length-1].loanBalance)}</p>
           </div>
        </div>
      </PageWrapper>

      {/* PAGE 6: SAVINGS RATE ANALYSIS */}
      <PageWrapper pageNum={6} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-10">
          <h2 className="text-5xl font-black text-[#854d9c]">Savings Rate Analysis</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="h-[400px] w-full bg-slate-50 rounded-3xl p-8 flex items-center justify-center">
          <LineChart width={650} height={350} data={data.monthlyData.map(m => ({ name: m.month.substring(0, 3), rate: m.savingsRate }))}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <ReferenceLine y={5} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'AU Avg (5%)', fill: '#10b981', fontSize: 10 }} />
            <Line type="monotone" dataKey="rate" stroke="#854d9c" strokeWidth={4} dot={{ r: 6, fill: '#854d9c', strokeWidth: 2, stroke: 'white' }} isAnimationActive={false} />
          </LineChart>
        </div>
        <div className="mt-8 p-8 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-8">
           <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl">🎯</div>
           <div>
              <p className="text-xl font-black text-emerald-900">Your Average Savings Rate: {results.savingsRate.toFixed(1)}%</p>
              <p className="text-sm font-bold text-emerald-700">
                {results.savingsRate >= 5 
                  ? `Excellent! You are saving more than the Australian average of 5%.`
                  : `You are currently saving less than the Australian average of 5%. Let's look for opportunities to improve this.`}
              </p>
           </div>
        </div>
      </PageWrapper>

      {/* PAGE 7: REDRAW ACTIVITY */}
      <PageWrapper pageNum={7} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-16">
          <h2 className="text-5xl font-black text-[#854d9c]">Redraw Activity</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-10 mb-16">
           <RedrawTile label="Total Redraws" value={formatAUD(results.totalAdditionalRedraws)} highlight icon="total" />
           <RedrawTile label="Avg. Monthly Redraw" value={formatAUD(results.avgMonthlyAdditionalRedraws)} icon="avg" />
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
           <table className="w-full text-[10px] text-left">
              <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest">
                 <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Description</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {data.additionalRedraws.slice(0, 10).map((r, i) => (
                    <tr key={i}>
                       <td className="p-4 font-bold">{formatDate(r.date)}</td>
                       <td className="p-4 font-black text-[#250B40]">{formatAUD(r.amount)}</td>
                       <td className="p-4 text-slate-500">{r.description}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </PageWrapper>

      {/* PAGE 8: OUT OF DEBT PROJECTION */}
      <PageWrapper pageNum={8} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-10">
          <h2 className="text-5xl font-black text-[#854d9c]">Out of Debt Projection</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-8 mb-10">
           <div className="p-8 bg-[#250B40] text-white rounded-3xl shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Years Saved</p>
              <p className="text-6xl font-black tracking-tighter">{results.yearsSavedBase} Years</p>
           </div>
           <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Interest Saved</p>
              <p className="text-5xl font-black text-[#250B40] tracking-tighter">{formatAUD(results.moneySavedBase)}</p>
           </div>
        </div>
        <div className="h-[400px] w-full bg-slate-50 rounded-3xl p-8 flex items-center justify-center">
           <AreaChart width={650} height={350} data={modelCurvedOOD(data.currentLoanBalance, results.avgMonthlyDebtReduction).points}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Area type="monotone" dataKey="balance" stroke="#854d9c" strokeWidth={3} fill="#E6DEEE" fillOpacity={0.5} isAnimationActive={false} />
           </AreaChart>
        </div>
      </PageWrapper>

      {/* PAGE 9: HOME OWNERSHIP */}
      <PageWrapper pageNum={9} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-5xl font-black text-[#854d9c]">Home Ownership</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="flex flex-col items-center space-y-6">
           {data.propertyImageUrl && (
             <div className="w-full h-72 rounded-3xl overflow-hidden shadow-lg border-4 border-white">
               <img src={data.propertyImageUrl} className="w-full h-full object-cover" />
             </div>
           )}
           <div className="w-56 h-56 relative bg-slate-50 rounded-full p-4 flex items-center justify-center">
              <PieChart width={200} height={200}>
                 <Pie isAnimationActive={false}
                    data={[
                       { name: 'You Own', value: results.homeOwnership.youOwn },
                       { name: 'Bank Owns', value: results.homeOwnership.bankOwns }
                    ]}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                 >
                    <Cell fill="#854d9c" />
                    <Cell fill="#E6DEEE" />
                 </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">You Own</p>
                 <p className="text-3xl font-black text-[#250B40]">{results.homeOwnership.youOwn.toFixed(1)}%</p>
              </div>
           </div>
           <div className="grid grid-cols-2 w-full gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                 <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-400">Property Value</p>
                 <p className="text-2xl font-black text-[#250B40]">{formatAUD(data.currentPropertyValuation)}</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                 <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-400">Your Equity</p>
                 <p className="text-2xl font-black text-[#854d9c]">{formatAUD(data.currentPropertyValuation - data.currentLoanBalance)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                 <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-400">Loan Balance</p>
                 <p className="text-2xl font-black text-slate-600">{formatAUD(data.currentLoanBalance)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                 <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-400">Bank Ownership</p>
                 <p className="text-2xl font-black text-slate-600">{formatAUD(data.currentLoanBalance)}</p>
              </div>
           </div>
        </div>
      </PageWrapper>

      {/* PAGE 10: 12 STEPS PROGRESS */}
      <PageWrapper pageNum={10} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-16">
          <h2 className="text-5xl font-black text-[#854d9c]">12 Steps Progress</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="grid grid-cols-3 gap-6 flex-1">
           {[1,2,3,4,5,6,7,8,9,10,11,12].map(step => (
              <div key={step} className={`p-6 rounded-2xl border flex flex-col justify-between ${results.stepsStatus[step] === StepStatus.YES ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                 <div className="flex justify-between items-start">
                    <span className={`text-2xl font-black ${results.stepsStatus[step] === StepStatus.YES ? 'text-emerald-500' : 'text-slate-200'}`}>{step}</span>
                    {results.stepsStatus[step] === StepStatus.YES && <span className="text-emerald-500">✅</span>}
                 </div>
                 <p className={`text-[10px] font-bold leading-tight ${results.stepsStatus[step] === StepStatus.YES ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {step === 1 && "Emergency Buffer"}
                    {step === 2 && "1 Month Expenses"}
                    {step === 3 && "External Debts Paid"}
                    {step === 4 && "3 Months Expenses"}
                    {step === 5 && "10% Debt Reduced"}
                    {step === 6 && "Super Contributions"}
                    {step === 7 && "25% Debt Reduced"}
                    {step === 8 && "Savings Rate Up"}
                    {step === 9 && "50% Debt Reduced"}
                    {step === 10 && "Investment Ready"}
                    {step === 11 && "75% Debt Reduced"}
                    {step === 12 && "DEBT FREE!"}
                 </p>
              </div>
           ))}
        </div>
      </PageWrapper>

      {/* PAGE 11: RECOMMENDATIONS */}
      <PageWrapper pageNum={11} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-16">
          <h2 className="text-5xl font-black text-[#854d9c]">Recommendations</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="flex-1 space-y-8">
           {data.recommendations.map((rec, i) => (
              <div key={i} className="p-8 bg-[#F7F5F9] rounded-3xl border border-slate-100 flex gap-8 items-start">
                 <div className="w-12 h-12 rounded-2xl bg-[#250B40] text-white flex items-center justify-center font-black shrink-0 shadow-lg">{i+1}</div>
                 <p className="text-xl font-bold text-[#250B40] leading-tight">{rec}</p>
              </div>
           ))}
        </div>
      </PageWrapper>

      {/* PAGE 12: FINANCIAL GOALS */}
      <PageWrapper pageNum={12} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-16">
          <h2 className="text-5xl font-black text-[#854d9c]">Financial Goals</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="flex-1 space-y-10">
           {data.financialGoals.map((goal, i) => (
              <div key={i} className="space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-xl font-black text-[#250B40]">{goal.goal}</p>
                    <p className="text-sm font-black text-[#854d9c]">{goal.progress}%</p>
                 </div>
                 <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#854d9c] rounded-full" style={{ width: `${goal.progress}%` }} />
                 </div>
              </div>
           ))}
        </div>
      </PageWrapper>

      {/* PAGE 13: COACH'S STRATEGY */}
      <PageWrapper pageNum={13} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-16">
          <h2 className="text-5xl font-black text-[#854d9c]">Coach's Strategy</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="flex-1 p-12 bg-[#250B40] text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
           <div className="z-10 relative space-y-10">
              <p className="text-3xl font-black leading-tight tracking-tight">
                 "Our focus for the next period is to maximize your redraw efficiency while maintaining a healthy buffer for life's unexpected moments."
              </p>
              <div className="h-1 w-20 bg-[#854d9c]" />
              <p className="text-lg font-medium text-purple-200 leading-relaxed">
                 By following the 12 steps and adhering to the recommended FLEX amounts, we are on track to save you over {results.yearsSavedBase} years on your mortgage. This is a significant achievement that puts you in the top 5% of homeowners.
              </p>
           </div>
        </div>
      </PageWrapper>

      {/* PAGE 14: CLOSING THOUGHTS */}
      <PageWrapper pageNum={14} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="flex justify-between items-start mb-16">
          <h2 className="text-5xl font-black text-[#854d9c]">Closing Thoughts</h2>
          <img src={LOGOS.dark} className="h-10" />
        </div>
        <div className="flex-1 flex flex-col justify-center space-y-12">
           <p className="text-4xl font-black text-[#250B40] leading-tight italic">
              "{data.closingThoughts}"
           </p>
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-slate-200" />
              <div>
                 <p className="text-xl font-black text-[#250B40]">Your Personal Coach</p>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Crown Money Coaching Team</p>
              </div>
           </div>
        </div>
      </PageWrapper>

      {/* PAGE 15: BACK COVER */}
      <PageWrapper pageNum={15} totalPages={15} loanIdentifier={data.loanIdentifier}>
        <div className="h-full flex flex-col bg-[#250B40] -m-10 p-16 text-white items-center justify-center text-center relative overflow-hidden">
           <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
           </div>
           <img src={LOGOS.light} alt="Crown" className="h-16 mb-12 brightness-0 invert" />
           <h2 className="text-6xl font-black tracking-tighter mb-6">Your Journey Continues</h2>
           <p className="text-xl font-medium text-purple-200 max-w-md mx-auto leading-relaxed">
              We are here to support you every step of the way. Together, we will achieve your financial freedom.
           </p>
           <div className="mt-20 pt-10 border-t border-white/10 w-full max-w-xs">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">www.crownmoney.com.au</p>
           </div>
        </div>
      </PageWrapper>
    </div>
  );
};

export default FullReport;
