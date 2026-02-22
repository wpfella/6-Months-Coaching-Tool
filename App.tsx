
// @google/genai guidelines followed in geminiService.ts
// Fixed missing imports in App.tsx (Calendar, Zap) and added missing dashboard sections (Projections, Export)

import React, { useState, useMemo, useRef } from 'react';
import { CoachingData, ReviewPeriodType, WeeklySpendingDay, StepStatus, CalculationResults, RedrawRecord, FinancialGoal, MonthlyGranularData } from './types';
import { NAV_ITEMS, LOGOS, COLORS } from './constants';
import { performCalculations, modelCurvedOOD } from './utils/calculations';
import InputSection from './components/InputSection';
import RedrawsSection from './components/RedrawsSection';
import Login from './components/Login';
import DashboardSection from './components/DashboardSection';
import StepsSection from './components/StepsSection';
import ProjectionsSection from './components/ProjectionsSection';
import ExportSection from './components/ExportSection';
import { 
  Download, Eye, LogOut, FileText, Image as ImageIcon, ChevronLeft, ChevronRight, CheckCircle2, Target, DollarSign, TrendingUp, Clock, Info, Shield, Users, Goal, Calendar, Zap
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Cell, PieChart, Pie, Legend, ReferenceLine } from 'recharts';

const INITIAL_DATA: CoachingData = {
  clientEmail: 'jason.davis@example.com',
  settlementDate: '2023-01-15',
  settlementLoanAmount: 235351.43,
  householdNames: 'Davis, Jason and Kathleen',
  propertyAddress: '16 Woodend Avenue, Eynesbury, VIC, 3338',
  propertyImageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800',
  startDate: '01/01/2025',
  endDate: '31/12/2025',
  originalDebtFreeDate: '2048-01-15',
  previousOODDate: '2043-01-06',
  firstReportSavingsRate: 2.0,
  previousBalance90Days: 235351.43,
  previousBalance6Months: 235351.43,
  previousLoan90Days: 251.28,
  previousLoan6Months: 3015.33,
  monthlyData: [
    { month: 'January', debit: 11951.14, credit: 11763.60, loanBalance: 235538.97, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 2780, actualDebtReduction: -187.54, savingsRate: -1.6 },
    { month: 'February', debit: 11955.13, credit: 154400.65, loanBalance: 93093.45, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 142869.13, redraws: 3960, actualDebtReduction: -423.61, savingsRate: -3.7 },
    { month: 'March', debit: 10802.92, credit: 8210.00, loanBalance: 95686.37, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 3937.39, actualDebtReduction: -2592.92, savingsRate: -31.6 },
    { month: 'April', debit: 11654.00, credit: 13507.86, loanBalance: 93832.51, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 4050, actualDebtReduction: 1853.86, savingsRate: 13.7 },
    { month: 'May', debit: 16868.03, credit: 8230.03, loanBalance: 102470.51, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 10350, actualDebtReduction: -8638.00, savingsRate: -105.0 },
    { month: 'June', debit: 8301.73, credit: 10604.64, loanBalance: 100167.60, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 700, actualDebtReduction: 2302.91, savingsRate: 21.7 },
    { month: 'July', debit: 7692.62, credit: 13538.63, loanBalance: 94321.59, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 0, actualDebtReduction: 5846.01, savingsRate: 43.2 },
    { month: 'August', debit: 9803.31, credit: 15158.09, loanBalance: 88966.81, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 1750, actualDebtReduction: 5354.78, savingsRate: 35.3 },
    { month: 'September', debit: 11522.86, credit: 12244.38, loanBalance: 88245.29, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 2836, actualDebtReduction: 721.52, savingsRate: 5.9 },
    { month: 'October', debit: 12375.58, credit: 18926.99, loanBalance: 81693.88, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 2596, actualDebtReduction: 6551.41, savingsRate: 34.6 },
    { month: 'November', debit: 13162.44, credit: 11751.97, loanBalance: 83104.35, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 5538, actualDebtReduction: -1410.47, savingsRate: -12.0 },
    { month: 'December', debit: 18558.24, credit: 12195.62, loanBalance: 89466.97, oneOffDebitsRemoved: 0, oneOffCreditsRemoved: 0, redraws: 11333, actualDebtReduction: -6362.62, savingsRate: -52.2 }
  ],
  currentLoanBalance: 89466.97,
  currentAvailableRedraw: 36162,
  additionalRedraws: [
    { id: '1', date: '28.01.25', amount: 100.00, description: '$50 hockey academy fees 1st installment for kids $50 to top up kids myki cards for school bus', excluded: false, month: 'January' },
    { id: '2', date: '20.01.25', amount: 1800.00, description: 'Dentist is $200, Water bill for investment property is $791 Flights and stuff for Kate (family funeral) $809', excluded: false, month: 'January' },
    { id: '3', date: '16.01.25', amount: 250.00, description: 'Kids school shoes', excluded: false, month: 'January' },
    { id: '4', date: '15.01.25', amount: 230.00, description: 'urgent appointment to the Osteo and our mobile phone bill is due later this week', excluded: false, month: 'January' },
    { id: '5', date: '08.01.25', amount: 150.00, description: 'daughters 15th birthday.', excluded: false, month: 'January' },
    { id: '6', date: '02.01.25', amount: 250.00, description: 'og food and flea and tick tablets', excluded: false, month: 'January' },
    { id: '7', date: '18.02.25', amount: 3000.00, description: 'credit card payment', excluded: false, month: 'February' },
    { id: '8', date: '13.02.25', amount: 160.00, description: 'Phone bills', excluded: false, month: 'February' },
    { id: '9', date: '11.02.25', amount: 500.00, description: '$400 for kids to be registered for hockey, $50 to top up kids myki cards, $50 to get gas bottles', excluded: false, month: 'February' },
    { id: '10', date: '05.02.25', amount: 300.00, description: '$100 for nephew 18th Birthday Gift, $100 for hockey coaching, $100 for medical stuff', excluded: false, month: 'February' }
  ],
  uploadedStatements: [],
  weeklySpendingAmount: 500,
  proposedWeeklySpendingAmount: 500,
  weeklySpendingDay: WeeklySpendingDay.WED,
  hasExternalDebts: false,
  currentPropertyValuation: 775000,
  proposedFlexAmount: 2000,
  reviewPeriodType: ReviewPeriodType.TWELVE_MONTHS,
  recommendations: [
    'Reduce OO debt by 75%',
    'Consider removing the credit card to avoid impulsive spending and aim to use cash in 2026!'
  ],
  closingThoughts: 'The sale of the investment property has certainly freed up some cash however an expensive couple of months towards the end of the year has undone some of the hard work you achieved in your previous 6 months. I suggest we reset for 2026 and start fresh, this means cutting up the credit card to avoid impulsive spending and rely on your cash only. This coupled with implementing a FLEX of $2,000 should see you on track to reduce debt significantly faster and pay your Owner Occupied debt off in 4 years time!',
  financialGoals: [
    { id: '1', goal: 'Remove credit card and use cash to push forward financially much faster', progress: 0 },
    { id: '2', goal: 'Commit to a FLEX of $2,000', progress: 0 }
  ],
  rawRedrawsText: '',
  coachNotes: '',
  manualOverrides: {}
};

const PageWrapper: React.FC<{ children: React.ReactNode; pageNum: number; totalPages: number }> = ({ children, pageNum, totalPages }) => (
  <div className="bg-white min-h-[1123px] w-[794px] mx-auto shadow-2xl relative mb-12 flex flex-col overflow-hidden border border-slate-100 print:shadow-none print:mb-0">
    <div className="flex-1 p-10 flex flex-col">
      {children}
    </div>
    <div className="h-4 bg-[#250B40] w-full" />
    <div className="absolute bottom-6 right-10 text-slate-400 text-[8px] font-bold uppercase tracking-widest">
      Crown Money | Page {pageNum} of {totalPages}
    </div>
  </div>
);

const App: React.FC = () => {
  const [auth, setAuth] = useState<{ type: 'staff' | 'client' | null, session: boolean }>({ type: null, session: false });
  const [activeTab, setActiveTab] = useState('inputs');
  const [coachingData, setCoachingData] = useState<CoachingData>(INITIAL_DATA);
  const [isClientView, setIsClientView] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const results = useMemo(() => performCalculations(coachingData), [coachingData]);
  const formatAUD = (v: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 }).format(v);

  const exportScenario = () => {
    const dataStr = JSON.stringify(coachingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Crown_Scenario_${coachingData.householdNames.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importScenario = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setCoachingData(json);
        setAuth({ type: 'client', session: true });
        setIsClientView(true);
      } catch (err) { alert('Invalid Scenario File'); }
    };
    reader.readAsText(file);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const pdf = new jsPDF('p', 'px', [794, 1123]);
    const pages = Array.from(reportRef.current.children);
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i] as HTMLElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, 794, 1123);
    }
    pdf.save(`Home_Ownership_Report_${coachingData.householdNames}.pdf`);
  };

  if (!auth.session) {
    return <Login onLogin={(type) => setAuth({ type, session: true })} onImport={importScenario} />;
  }

  const baseProj = modelCurvedOOD(coachingData.currentLoanBalance, results.avgMonthlyDebtReduction);
  const flexProj = modelCurvedOOD(coachingData.currentLoanBalance, results.avgMonthlyDebtReduction + coachingData.proposedFlexAmount);

  return (
    <div className="min-h-screen bg-[#F7F5F9] flex flex-col font-sans text-[#250B40]">
      <header className="bg-white text-[#250B40] border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LOGOS.dark} alt="Crown Money" className="h-8" />
            <div className="h-6 w-[1px] bg-slate-200" />
            <h1 className="font-extrabold text-xs tracking-tight uppercase">{auth.type === 'staff' ? 'Coach Engine' : 'Client Review'}</h1>
          </div>
          <div className="flex items-center gap-3">
            {auth.type === 'staff' && (
              <button 
                onClick={() => setIsClientView(!isClientView)} 
                className={`flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase rounded-full transition-all shadow-sm ${isClientView ? 'bg-[#250B40] text-white' : 'bg-slate-100 text-[#250B40]'}`}
              >
                <Eye size={12} /> {isClientView ? 'Coach Dashboard' : 'Client Preview'}
              </button>
            )}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              <button onClick={exportScenario} className="p-2 hover:bg-white rounded-xl transition-all" title="Export JSON"><Download size={18} /></button>
              <button onClick={handleExportPDF} className="p-2 hover:bg-white rounded-xl transition-all text-red-600" title="Export PDF"><FileText size={18} /></button>
            </div>
            <button onClick={() => setAuth({ type: null, session: false })} className="p-2 text-slate-400 hover:text-red-500 transition-all"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isClientView && (
          <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col shadow-sm z-40">
            <nav className="flex-1 p-6 space-y-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-xs font-black transition-all ${activeTab === item.id ? 'bg-[#250B40] text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        )}

        <main className={`flex-1 overflow-y-auto ${isClientView ? 'bg-[#F1EDF5] py-12' : 'p-8'}`}>
          <div className={`container mx-auto ${isClientView ? 'max-w-[800px]' : 'max-w-6xl'}`}>
            {isClientView ? (
              <div ref={reportRef} className="flex flex-col items-center">
                
                {/* PAGE 1: COVER */}
                <PageWrapper pageNum={1} totalPages={15}>
                  <div className="h-full flex flex-col bg-[#250B40] -m-10 p-16 text-white justify-center relative overflow-hidden">
                    <div className="absolute top-16 left-16"><img src={LOGOS.light} alt="Crown" className="h-10 brightness-0 invert" /></div>
                    <div className="z-10 space-y-20 mt-10">
                      <h1 className="text-8xl font-black tracking-tighter leading-[0.8] max-w-sm">Home Ownership Report</h1>
                      <div className="space-y-10">
                        <div>
                          <p className="text-[#E6DEEE] uppercase tracking-[0.4em] text-[10px] font-black mb-2 opacity-40">Name</p>
                          <p className="text-5xl font-black tracking-tight">{coachingData.householdNames}</p>
                        </div>
                        <div>
                          <p className="text-[#E6DEEE] uppercase tracking-[0.4em] text-[10px] font-black mb-2 opacity-40">Date Range</p>
                          <p className="text-4xl font-black tracking-tight opacity-90">{coachingData.startDate} - {coachingData.endDate}</p>
                        </div>
                      </div>
                    </div>
                    {coachingData.propertyImageUrl && (
                      <div className="absolute top-1/2 -translate-y-1/2 -right-10 w-[450px] h-[450px] rounded-full border-[15px] border-white/5 overflow-hidden shadow-2xl">
                        <img src={coachingData.propertyImageUrl} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full border-[60px] border-white/5" />
                  </div>
                </PageWrapper>

                {/* PAGE 2: ANNUAL REPORT TABLE */}
                <PageWrapper pageNum={2} totalPages={15}>
                  <div className="flex justify-between items-start mb-10">
                    <h2 className="text-5xl font-black text-[#854d9c]">Annual Report</h2>
                    <img src={LOGOS.dark} className="h-8" />
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    <table className="w-full text-[9px] text-left border-collapse">
                      <thead>
                        <tr className="bg-[#250B40] text-white">
                          <th className="p-3 font-bold uppercase tracking-wider">Month</th>
                          <th className="p-3 font-bold uppercase tracking-wider text-right">Debit</th>
                          <th className="p-3 font-bold uppercase tracking-wider text-right">Credit</th>
                          <th className="p-3 font-bold uppercase tracking-wider text-right">Loan Balance</th>
                          <th className="p-3 font-bold uppercase tracking-wider text-right">One-off Debits Removed*</th>
                          <th className="p-3 font-bold uppercase tracking-wider text-right">One-off Credits Removed*</th>
                          <th className="p-3 font-bold uppercase tracking-wider text-right">Actual Debt Reduction</th>
                          <th className="p-3 font-bold uppercase tracking-wider text-right">Additional Redraws</th>
                          <th className="p-3 font-bold uppercase tracking-wider text-right">Savings Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="bg-slate-50 font-bold">
                          <td className="p-3 uppercase">Opening Balance</td>
                          <td colSpan={2}></td>
                          <td className="p-3 text-right">{formatAUD(coachingData.settlementLoanAmount)}</td>
                          <td colSpan={5}></td>
                        </tr>
                        {coachingData.monthlyData.map((m, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="p-3 font-bold text-[#250B40]">{m.month}</td>
                            <td className="p-3 text-right">{formatAUD(m.debit)}</td>
                            <td className="p-3 text-right">{formatAUD(m.credit)}</td>
                            <td className="p-3 text-right font-medium">{formatAUD(m.loanBalance)}</td>
                            <td className="p-3 text-right text-slate-400">$0.00</td>
                            <td className="p-3 text-right text-[#854d9c] font-black">${m.oneOffCreditsRemoved.toLocaleString('en-AU', {minimumFractionDigits:2})}</td>
                            <td className="p-3 text-right font-black text-slate-600">${m.actualDebtReduction.toLocaleString('en-AU', {minimumFractionDigits:2})}</td>
                            <td className="p-3 text-right font-medium text-[#250B40]">${m.redraws.toLocaleString('en-AU', {minimumFractionDigits:2})}</td>
                            <td className="p-3 text-right font-bold">{m.savingsRate.toFixed(1)}%</td>
                          </tr>
                        ))}
                        <tr className="bg-[#250B40] text-white font-black">
                          <td className="p-3 uppercase">Total</td>
                          <td className="p-3 text-right">{formatAUD(coachingData.monthlyData.reduce((s,m)=>s+m.debit,0))}</td>
                          <td className="p-3 text-right">{formatAUD(coachingData.monthlyData.reduce((s,m)=>s+m.credit,0))}</td>
                          <td className="p-3 text-right"></td>
                          <td className="p-3 text-right">$0.00</td>
                          <td className="p-3 text-right">{formatAUD(coachingData.monthlyData.reduce((s,m)=>s+m.oneOffCreditsRemoved,0))}</td>
                          <td className="p-3 text-right">{formatAUD(coachingData.monthlyData.reduce((s,m)=>s+m.actualDebtReduction,0))}</td>
                          <td className="p-3 text-right">$0.00</td>
                          <td className="p-3 text-right">{(coachingData.monthlyData.reduce((s,m)=>s+m.savingsRate,0)/coachingData.monthlyData.length).toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#854d9c] mb-2">Amounts Removed:</p>
                    <p className="text-[10px] font-medium leading-relaxed">Surplus from the sale of the Investment property</p>
                  </div>
                </PageWrapper>

                {/* PAGE 3: ACHIEVEMENTS */}
                <PageWrapper pageNum={3} totalPages={15}>
                  <div className="flex justify-between items-start mb-16">
                    <h2 className="text-5xl font-black text-[#854d9c]">Your results & key achievements</h2>
                    <img src={LOGOS.dark} className="h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-16 flex-1">
                    <div className="flex flex-col justify-center h-[450px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Last 12 Months Debt Reduction', value: results.totalDebtReduction }]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                          <Bar dataKey="value" fill="#E6DEEE" radius={[15, 15, 0, 0]} label={{ position: 'top', formatter: (v: number) => formatAUD(v), fontSize: 20, fontWeight: 900, fill: '#250B40', offset: 10 }}>
                            <Cell fill="#E6DEEE" stroke="#250B40" strokeWidth={0.5} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-6 flex flex-col justify-center">
                      <AchievementTile label="Projected Debt Free Date" value={results.currentDebtFreeDate} primary icon={<Calendar size={24}/>} />
                      <AchievementTile label="Avg. Monthly Debt Reduction" value={formatAUD(results.avgMonthlyDebtReduction)} icon={<TrendingUp size={24}/>} />
                      <AchievementTile label="Last 6 Months Reduction" value={formatAUD(results.last6MonthsReduction)} icon={<DollarSign size={24}/>} />
                      <AchievementTile label="Average Monthly Income" value={formatAUD(results.avgMonthlyIncome)} icon={<DollarSign size={24}/>} />
                      <AchievementTile label="Average Monthly Expenses" value={formatAUD(results.avgMonthlyExpenses)} icon={<DollarSign size={24}/>} />
                    </div>
                  </div>
                </PageWrapper>

                {/* PAGE 4 & 5: GRAPHS */}
                <PageWrapper pageNum={4} totalPages={15}>
                  <div className="flex justify-between items-start mb-16">
                    <h2 className="text-6xl font-black text-[#854d9c]">Monthly Debt Reduction</h2>
                    <img src={LOGOS.dark} className="h-10" />
                  </div>
                  <div className="flex-1 min-h-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={coachingData.monthlyData.map(m => ({ name: m.month, value: m.actualDebtReduction }))} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                        <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#250B40' }} angle={-45} textAnchor="end" />
                        <YAxis axisLine={true} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#250B40' }} tickFormatter={(v) => formatAUD(v)} />
                        <Bar dataKey="value" radius={[2, 2, 2, 2]} label={{ position: 'top', formatter: (v: number) => `$${(v/1000).toFixed(1)}k`, fontSize: 10, fontWeight: 800 }}>
                          {coachingData.monthlyData.map((m, i) => (
                            <Cell key={i} fill={m.actualDebtReduction > 0 ? "#E6DEEE" : "white"} stroke="#250B40" strokeWidth={1} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </PageWrapper>

                <PageWrapper pageNum={5} totalPages={15}>
                  <div className="flex justify-between items-start mb-16">
                    <h2 className="text-6xl font-black text-[#854d9c]">Loan Balance Over the Year</h2>
                    <img src={LOGOS.dark} className="h-10" />
                  </div>
                  <div className="flex-1 min-h-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={coachingData.monthlyData.map(m => ({ name: m.month, value: m.loanBalance }))} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <defs>
                          <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#250B40" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#250B40" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                        <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#250B40' }} angle={-45} textAnchor="end" />
                        <YAxis axisLine={true} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#250B40' }} tickFormatter={(v) => `$${v/1000}k`} />
                        <Area type="monotone" dataKey="value" stroke="#854d9c" strokeWidth={2} fillOpacity={1} fill="url(#colorBal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </PageWrapper>

                {/* PAGE 6: SAVINGS RATE */}
                <PageWrapper pageNum={6} totalPages={15}>
                  <div className="flex justify-between items-start mb-10">
                    <h2 className="text-6xl font-black text-[#854d9c]">Savings Rate</h2>
                    <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl flex gap-10 shadow-sm">
                       <div className="text-center">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Savings Rate<br/>for the year</p>
                          <p className="text-6xl font-black text-[#250B40] mt-2">{results.savingsRate.toFixed(1)}%</p>
                       </div>
                       <div className="h-full w-[1px] bg-slate-100" />
                       <div className="text-center flex flex-col justify-center">
                          <p className="text-xs font-bold text-slate-500 leading-tight">For every $100 you earn,<br/><span className="text-[#854d9c] text-xl font-black">you save $2.04</span><br/>and you spend $97.96</p>
                       </div>
                    </div>
                  </div>
                  <div className="flex-1 h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={coachingData.monthlyData.map(m => ({ name: m.month, rate: m.savingsRate }))} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis axisLine={true} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" />
                        <Line type="monotone" dataKey="rate" name="Savings Rate" stroke="#854d9c" strokeWidth={3} dot={{r: 6, fill: '#854d9c', strokeWidth: 2, stroke: 'white'}} />
                        <ReferenceLine y={5} label={{ position: 'right', value: 'AU Avg', fill: '#10b981', fontSize: 10, fontWeight: 800 }} stroke="#10b981" strokeWidth={2} />
                        <ReferenceLine y={20} label={{ position: 'right', value: 'Goal', fill: '#f59e0b', fontSize: 10, fontWeight: 800 }} stroke="#f59e0b" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-10 overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-[10px] text-center">
                      <thead className="bg-[#250B40] text-white uppercase font-black tracking-widest">
                        <tr><th className="p-3">Month</th>{coachingData.monthlyData.map(m=><th key={m.month} className="p-3">{m.month}</th>)}</tr>
                      </thead>
                      <tbody>
                        <tr className="bg-slate-50"><td className="p-3 font-bold text-[#854d9c] uppercase">Additional Redraws</td>{coachingData.monthlyData.map(m=><td key={m.month} className="p-3 font-medium">${m.redraws.toLocaleString('en-AU', {minimumFractionDigits:2})}</td>)}</tr>
                      </tbody>
                    </table>
                  </div>
                </PageWrapper>

                {/* PAGE 7: REDRAW OVERVIEW */}
                <PageWrapper pageNum={7} totalPages={15}>
                  <div className="flex justify-between items-start mb-20">
                    <h2 className="text-6xl font-black text-[#854d9c]">Redraw Activity</h2>
                    <img src={LOGOS.dark} className="h-10" />
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center space-y-12">
                     <RedrawTile label="Your Current Flex Amount" value={formatAUD(0)} icon="flex" />
                     <RedrawTile label="Total Additional Redraws for the year" value={formatAUD(results.totalAdditionalRedraws)} icon="total" highlight />
                     <RedrawTile label="Average Monthly Additional Redraws" value={formatAUD(results.avgMonthlyAdditionalRedraws)} icon="avg" />
                     <RedrawTile label="Your Proposed Flex Amount" value={formatAUD(coachingData.proposedFlexAmount)} icon="flex" />
                  </div>
                </PageWrapper>

                {/* PAGE 8 & 9: MONTHLY REDRAWS */}
                <PageWrapper pageNum={8} totalPages={15}>
                   <div className="flex justify-between items-start mb-10">
                    <h2 className="text-5xl font-black text-[#854d9c]">Monthly Redraw Activity</h2>
                    <img src={LOGOS.dark} className="h-8" />
                  </div>
                   <div className="grid grid-cols-2 gap-x-10 gap-y-12">
                      {['January', 'February', 'March', 'April', 'May', 'June'].map(month => (
                        <div key={month} className="space-y-1">
                           <div className="bg-[#854d9c] text-white px-4 py-2 flex justify-between items-center rounded-t-xl">
                              <span className="font-black uppercase text-xs tracking-[0.2em]">{month}</span>
                              <div className="flex gap-4 text-[9px] font-bold">
                                <span>Date</span><span>Amount</span><span className="flex-1 text-center">Purpose</span>
                              </div>
                           </div>
                           <div className="border border-slate-200 min-h-[140px] rounded-b-xl overflow-hidden">
                             <table className="w-full text-[8px] text-left border-collapse">
                               <tbody>
                                 {coachingData.additionalRedraws.filter(r => r.month === month).map((r,idx) => (
                                   <tr key={idx} className="border-b border-slate-100">
                                     <td className="p-2 border-r border-slate-100 whitespace-nowrap">{r.date}</td>
                                     <td className="p-2 border-r border-slate-100 font-bold whitespace-nowrap">{formatAUD(r.amount)}</td>
                                     <td className="p-2 leading-relaxed">{r.description}</td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                           <div className="flex justify-between p-2 bg-slate-50 text-[9px] font-black uppercase border-x border-b border-slate-200 rounded-b-xl">
                              <span className="text-slate-400">Total</span>
                              <span>{formatAUD(coachingData.additionalRedraws.filter(r => r.month === month).reduce((s,c)=>s+c.amount,0))}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </PageWrapper>

                {/* PAGE 10: OOD BASE */}
                <PageWrapper pageNum={10} totalPages={15}>
                  <div className="flex justify-between items-start mb-16">
                    <h2 className="text-5xl font-black text-[#854d9c]">Out of Debt Projection</h2>
                    <img src={LOGOS.dark} className="h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-10 mb-16">
                     <div className="p-10 bg-white border-2 border-slate-50 rounded-3xl shadow-sm text-center flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Years Saved</p>
                          <p className="text-8xl font-black text-[#250B40] leading-none mt-2">{results.yearsSavedBase}</p>
                        </div>
                        <div className="p-4 bg-[#F7F5F9] rounded-2xl"><TrendingUp size={48} className="text-[#854d9c]"/></div>
                     </div>
                     <div className="p-10 bg-white border-2 border-slate-50 rounded-3xl shadow-sm text-center flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Money Saved</p>
                          <p className="text-5xl font-black text-[#250B40] leading-none mt-2">{formatAUD(results.moneySavedBase)}</p>
                        </div>
                        <div className="p-4 bg-[#F7F5F9] rounded-2xl"><DollarSign size={48} className="text-[#854d9c]"/></div>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-10">
                     <div className="col-span-2 h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={baseProj.points}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="year" axisLine={true} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                              <YAxis axisLine={true} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} tickFormatter={(v) => `$${v/1000}k`} />
                              <Area type="monotone" dataKey="balance" stroke="#854d9c" fill="#E6DEEE" fillOpacity={0.6} />
                           </AreaChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-10 mt-6">
                           <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-200 border border-slate-300"/> <span className="text-[10px] font-bold">Previous Loan</span></div>
                           <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#854d9c]"/> <span className="text-[10px] font-bold">Crown Money</span></div>
                        </div>
                     </div>
                     <div className="col-span-1 overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-[10px] text-left border-collapse">
                           <thead className="bg-slate-50 text-[#854d9c] font-black uppercase">
                              <tr><th className="p-3">Year</th><th className="p-3 text-right">Projected Debt Reduction</th></tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {baseProj.points.slice(0, 15).map((p,i)=>(<tr key={i} className={i%2===0?'bg-white':'bg-slate-50/30'}><td className="p-3 font-bold">{p.name}</td><td className="p-3 text-right font-medium">{formatAUD(p.balance)}</td></tr>))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                  <div className="mt-8 text-[8px] text-slate-400 font-medium italic">
                    * Assumptions: Interest rate remains at 6.0% p.a., monthly repayment capacity continues at the current calculated average, and no further lump sum redraws occur.
                  </div>
                </PageWrapper>

                {/* PAGE 12: PROPERTY */}
                <PageWrapper pageNum={12} totalPages={15}>
                  <div className="flex justify-between items-start mb-16">
                    <h2 className="text-6xl font-black text-[#854d9c]">Your Property</h2>
                    <img src={LOGOS.dark} className="h-10" />
                  </div>
                  <div className="space-y-16 flex-1 flex flex-col items-center justify-center">
                     {coachingData.propertyImageUrl && <img src={coachingData.propertyImageUrl} className="w-full max-h-[400px] object-cover rounded-[1rem] shadow-xl" />}
                     <div className="grid grid-cols-3 w-full items-center gap-20 text-center">
                        <div className="space-y-4">
                           <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">The banks owns</p>
                           <p className="text-7xl font-black text-red-500 leading-none">{results.homeOwnership.bankOwns.toFixed(0)}%</p>
                           <p className="text-[10px] font-bold text-slate-400">of your Home</p>
                        </div>
                        <div className="relative w-full h-16 bg-slate-100 rounded-full overflow-hidden flex border-4 border-white shadow-inner p-1">
                           <div className="h-full bg-red-500 rounded-l-full" style={{width: `${results.homeOwnership.bankOwns}%`}} />
                           <div className="h-full bg-[#854d9c] rounded-r-full flex-1" style={{width: `${results.homeOwnership.youOwn}%`}} />
                        </div>
                        <div className="space-y-4">
                           <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">You own</p>
                           <p className="text-7xl font-black text-[#854d9c] leading-none">{results.homeOwnership.youOwn.toFixed(0)}%</p>
                           <p className="text-[10px] font-bold text-slate-400">of your Home</p>
                        </div>
                     </div>
                     <div className="text-center space-y-6">
                        <p className="text-3xl font-black tracking-tight text-slate-800">{coachingData.propertyAddress}</p>
                        <div className="flex items-center justify-center gap-10">
                           <div className="text-center">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Valuation:</p>
                              <p className="text-5xl font-black text-[#250B40] mt-1">{formatAUD(coachingData.currentPropertyValuation)}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </PageWrapper>

                {/* PAGE 13: 12 STEPS */}
                <PageWrapper pageNum={13} totalPages={15}>
                  <div className="flex justify-between items-start mb-12">
                    <h2 className="text-5xl font-black text-[#854d9c]">The 12 Steps to Financial Security</h2>
                    <img src={LOGOS.dark} className="h-10" />
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-12">
                     <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-[#854d9c] text-white font-black uppercase tracking-wider">
                           <tr><th className="p-4 border-r border-white/10">Step</th><th className="p-4 border-r border-white/10">Description</th><th className="p-4 border-r border-white/10 text-center">Target</th><th className="p-4 text-center">Achieved</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {[
                             {id:1, d:"Build up a $2,000 emergency buffer", t:"$2,000.00"},
                             {id:2, d:"Save 1 Month's Living Expenses and Debt Payments", t:formatAUD(results.avgMonthlyExpenses)},
                             {id:3, d:"Pay off all External Debts", t:"No External Debts"},
                             {id:4, d:"Save 3 Month's Expenses and Debt Repayments", t:formatAUD(results.avgMonthlyExpenses*3)},
                             {id:5, d:"Debt down by 10% since start", t:formatAUD(coachingData.settlementLoanAmount*0.9)},
                             {id:6, d:"Increase contributions into Superannuation to 15%*", t:""},
                             {id:7, d:"Debt down by 25% since the start", t:formatAUD(coachingData.settlementLoanAmount*0.75)},
                             {id:8, d:"Increased savings rate by 10% since starting the program", t:(coachingData.firstReportSavingsRate*1.1).toFixed(1)+"%"},
                             {id:9, d:"Debt down by 50% since start", t:formatAUD(coachingData.settlementLoanAmount*0.5)},
                             {id:10, d:"Pre-approval for an investment property, or other investment*", t:""},
                             {id:11, d:"Debt down by 75% since start", t:formatAUD(coachingData.settlementLoanAmount*0.25)},
                             {id:12, d:"Debt down by 100% since start - DEBT FREE!", t:"$0.00"}
                           ].map(step => (
                             <tr key={step.id} className={results.stepsStatus[step.id] === StepStatus.YES ? 'bg-emerald-50/50' : 'bg-white'}>
                               <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-100">{step.id}</td>
                               <td className="p-3 font-medium text-slate-700 border-r border-slate-100">{step.d}</td>
                               <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-100">{step.t}</td>
                               <td className={`p-3 text-center font-black uppercase text-[10px] ${results.stepsStatus[step.id] === StepStatus.YES ? 'text-emerald-600' : (step.id === 6 ? 'text-[#854d9c]' : 'text-slate-300')}`}>
                                  {step.id === 6 ? 'At your discretion' : (results.stepsStatus[step.id] || 'NO')}
                               </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="p-10 bg-[#F7F5F9] rounded-3xl border border-slate-100">
                     <h3 className="text-2xl font-black mb-8 text-[#854d9c] uppercase tracking-tight">Our Recommendation for the next 12 months:</h3>
                     <ul className="space-y-6">
                        {coachingData.recommendations.map((r,i)=>(
                          <li key={i} className="flex gap-6 text-xl font-bold items-start text-slate-700">
                            <span className="w-10 h-10 rounded-full bg-[#854d9c] text-white flex items-center justify-center shrink-0 text-sm font-black shadow-lg shadow-purple-900/10">{i+1}</span>
                            <span className="mt-1 leading-tight">{r}</span>
                          </li>
                        ))}
                     </ul>
                  </div>
                </PageWrapper>

                {/* PAGE 14: GOALS */}
                <PageWrapper pageNum={14} totalPages={15}>
                   <div className="flex-1 flex flex-col">
                      <div className="mb-10">
                        <h2 className="text-7xl font-black text-[#854d9c]">Financial Goals</h2>
                        <p className="text-2xl font-bold text-slate-400 mt-2">Specific, Measurable, Achievable, Realistic, Timely</p>
                      </div>
                      <div className="flex flex-1 gap-12">
                        <div className="flex-1 space-y-2">
                           <div className="bg-[#E6DEEE] p-5 flex justify-between items-center rounded-t-xl">
                              <span className="font-black uppercase text-xs tracking-widest text-[#854d9c]">Financial Goals</span>
                              <span className="font-black uppercase text-xs tracking-widest text-[#854d9c]">% Progress</span>
                           </div>
                           <div className="flex-1 space-y-2">
                              {coachingData.financialGoals.map(g => (
                                <div key={g.id} className="border-b-2 border-[#E6DEEE] py-6 flex justify-between items-center group">
                                  <span className="text-2xl font-bold text-slate-700 leading-tight pr-10">{g.goal}</span>
                                  <span className="text-4xl font-black text-[#854d9c] opacity-0 group-hover:opacity-100 transition-opacity">{g.progress}%</span>
                                </div>
                              ))}
                              {[...Array(8)].map((_,i)=>(<div key={i} className="border-b-2 border-[#E6DEEE] h-16" />))}
                           </div>
                        </div>
                        <div className="w-[30%] h-full rounded-[2rem] overflow-hidden grayscale">
                           <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" />
                        </div>
                      </div>
                   </div>
                </PageWrapper>

                {/* PAGE 15: CLOSING */}
                <PageWrapper pageNum={15} totalPages={15}>
                   <div className="flex h-full gap-16">
                      <div className="w-[40%] h-full rounded-[4rem] overflow-hidden shadow-2xl relative">
                         <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#250B40]/40 to-transparent" />
                      </div>
                      <div className="w-[60%] flex flex-col justify-center space-y-16">
                         <h2 className="text-8xl font-black tracking-tighter leading-none text-[#854d9c]">Closing Thoughts</h2>
                         <div className="space-y-10">
                            {coachingData.closingThoughts.split('\n').map((para, i) => (
                              <p key={i} className="text-2xl leading-relaxed font-bold text-slate-600 italic">
                                "{para}"
                              </p>
                            ))}
                         </div>
                         <div className="pt-20 border-t-4 border-[#F7F5F9] flex items-center justify-between">
                            <img src={LOGOS.dark} className="h-10" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">New Year, New Strategy</p>
                         </div>
                      </div>
                   </div>
                </PageWrapper>

              </div>
            ) : (
              <div className="space-y-12 pb-32">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
                   <div className="flex gap-4 border-b border-slate-100 mb-10 overflow-x-auto">
                    {['inputs', 'dashboard', 'projections', 'steps', 'redraws', 'export'].map(tab => (
                      <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === tab ? 'border-[#250B40] text-[#250B40]' : 'border-transparent text-slate-300 hover:text-slate-400'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  {activeTab === 'inputs' && <InputSection data={coachingData} setData={setCoachingData} />}
                  {activeTab === 'dashboard' && <DashboardSection data={coachingData} results={results} />}
                  {activeTab === 'projections' && <ProjectionsSection data={coachingData} results={results} setData={setCoachingData} />}
                  {activeTab === 'steps' && <StepsSection data={coachingData} results={results} setData={setCoachingData} />}
                  {activeTab === 'redraws' && <RedrawsSection data={coachingData} setData={setCoachingData} results={results} />}
                  {activeTab === 'export' && <ExportSection data={coachingData} results={results} />}
                </div>
                
                <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl space-y-10">
                   <h3 className="text-2xl font-black flex items-center gap-3"><Goal className="text-purple-500" /> Report Content Editor</h3>
                   <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next 12m Recommendations (Line Separated)</label>
                         <textarea className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#250B40] font-bold text-[#250B40]" value={coachingData.recommendations.join('\n')} onChange={e => setCoachingData(prev=>({...prev, recommendations: e.target.value.split('\n')}))} />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Closing Thoughts Summary</label>
                         <textarea className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#250B40] font-bold text-[#250B40]" value={coachingData.closingThoughts} onChange={e => setCoachingData(prev=>({...prev, closingThoughts: e.target.value}))} />
                      </div>
                   </div>
                   <div className="space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest">Financial Goals & Progress Tracker</h4>
                      <div className="space-y-3">
                         {coachingData.financialGoals.map((g,idx)=>(
                           <div key={idx} className="flex gap-4 items-center">
                              <input className="flex-1 px-4 py-3 bg-slate-50 rounded-xl font-bold" value={g.goal} onChange={e => {
                                 const next = [...coachingData.financialGoals]; next[idx].goal = e.target.value; setCoachingData(p=>({...p, financialGoals: next}));
                              }} />
                              <div className="relative">
                                 <input type="number" className="w-32 px-4 py-3 bg-slate-50 rounded-xl font-black text-right" value={g.progress} onChange={e => {
                                    const next = [...coachingData.financialGoals]; next[idx].progress = Number(e.target.value); setCoachingData(p=>({...p, financialGoals: next}));
                                 }} />
                                 <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const AchievementTile = ({ label, value, primary, icon }: { label: string; value: string; primary?: boolean; icon?: React.ReactNode }) => (
  <div className={`p-8 rounded-2xl border flex items-center gap-6 transition-all ${primary ? 'bg-[#250B40] text-white border-[#250B40] shadow-xl' : 'bg-white border-slate-100 shadow-sm'}`}>
    <div className={`p-4 rounded-2xl ${primary ? 'bg-white/10' : 'bg-[#F7F5F9]'}`}>{icon}</div>
    <div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${primary ? 'text-[#E6DEEE]' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-4xl font-black tracking-tighter leading-none ${primary ? 'text-white' : 'text-[#250B40]'}`}>{value}</p>
    </div>
  </div>
);

const RedrawTile = ({ label, value, highlight, icon }: { label: string; value: string; highlight?: boolean; icon: string }) => (
  <div className={`w-full max-w-[600px] p-8 rounded-3xl border flex items-center justify-between transition-all ${highlight ? 'bg-white border-[#854d9c] border-[3px] shadow-2xl scale-105' : 'bg-white border-slate-100 shadow-sm'}`}>
     <div className="flex items-center gap-8">
        <div className={`p-5 rounded-2xl ${highlight ? 'bg-[#E6DEEE]' : 'bg-slate-50'}`}>
           {icon === 'flex' ? <TrendingUp size={32} className="text-[#854d9c]" /> : (icon === 'avg' ? <Clock size={32} className="text-[#854d9c]" /> : <DollarSign size={32} className="text-[#854d9c]" />)}
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#854d9c] leading-none mb-2">{label}</p>
          <p className="text-6xl font-black tracking-tighter text-[#250B40]">{value}</p>
        </div>
     </div>
  </div>
);

export default App;
