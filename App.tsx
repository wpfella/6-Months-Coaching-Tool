
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
import ClientPortal from './components/ClientPortal';
import { 
  Download, Eye, LogOut, FileText, Image as ImageIcon, ChevronLeft, ChevronRight, CheckCircle2, Target, DollarSign, TrendingUp, Clock, Info, Shield, Users, Goal, Calendar, Zap, Sparkles, Trash2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Cell, PieChart, Pie, Legend, ReferenceLine } from 'recharts';

const INITIAL_DATA: CoachingData = {
  clientEmail: 'jason.davis@example.com',
  settlementDate: '2023-01-15',
  settlementLoanAmount: 235351.43,
  householdNames: 'Davis, Jason and Kathleen',
  loanIdentifier: 'Main Account Loan Number: 123456789',
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
  weeklySpendingDay: WeeklySpendingDay.WEDNESDAY,
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

const EMPTY_DATA: CoachingData = {
  clientEmail: '',
  settlementDate: '',
  settlementLoanAmount: 0,
  householdNames: '',
  loanIdentifier: '',
  propertyAddress: '',
  propertyImageUrl: '',
  startDate: '',
  endDate: '',
  originalDebtFreeDate: '',
  previousOODDate: '',
  firstReportSavingsRate: 0,
  previousBalance90Days: 0,
  previousBalance6Months: 0,
  previousLoan90Days: 0,
  previousLoan6Months: 0,
  monthlyData: [],
  currentLoanBalance: 0,
  currentAvailableRedraw: 0,
  additionalRedraws: [],
  uploadedStatements: [],
  weeklySpendingAmount: 0,
  proposedWeeklySpendingAmount: 0,
  weeklySpendingDay: WeeklySpendingDay.MONDAY,
  hasExternalDebts: false,
  currentPropertyValuation: 0,
  proposedFlexAmount: 0,
  reviewPeriodType: ReviewPeriodType.TWELVE_MONTHS,
  recommendations: [],
  closingThoughts: '',
  financialGoals: [],
  rawRedrawsText: '',
  coachNotes: '',
  manualOverrides: {}
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<{ type: 'staff' | 'client' | null, session: boolean }>({ type: null, session: false });
  const [activeTab, setActiveTab] = useState('inputs');
  const [coachingData, setCoachingData] = useState<CoachingData>(INITIAL_DATA);
  const [isClientView, setIsClientView] = useState(false);
  const [isGeneratingThoughts, setIsGeneratingThoughts] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const results = useMemo(() => performCalculations(coachingData), [coachingData]);
  const formatAUD = (v: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 }).format(v);

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setCoachingData(EMPTY_DATA);
    }
  };

  const handleGenerateClosingThoughts = async () => {
    setIsGeneratingThoughts(true);
    try {
      const { generateClosingThoughts } = await import('./services/geminiService');
      const summary = await generateClosingThoughts(coachingData, results);
      setCoachingData(prev => ({ ...prev, closingThoughts: summary }));
    } catch (error) {
      alert('Failed to generate closing thoughts.');
    } finally {
      setIsGeneratingThoughts(false);
    }
  };

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

  const handleExportPDF = async (sectionId?: string) => {
    let elementToExport: HTMLElement | null = null;
    
    if (sectionId && sectionId !== 'full-report') {
      // For individual sections, we find the section in the DOM
      elementToExport = document.getElementById(`section-${sectionId}`);
    } else {
      elementToExport = reportRef.current;
    }

    if (!elementToExport) return;

    const pdf = new jsPDF('p', 'px', [794, 1123]);
    
    if (sectionId && sectionId !== 'full-report') {
      const canvas = await html2canvas(elementToExport, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 794;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      const pages = Array.from(elementToExport.children);
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i] as HTMLElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, 794, 1123);
      }
    }
    
    pdf.save(`Crown_Money_${sectionId || 'Full_Report'}_${coachingData.householdNames}.pdf`);
  };

  if (!auth.session) {
    return <Login onLogin={(type) => setAuth({ type, session: true })} onImport={importScenario} />;
  }

  const baseProj = modelCurvedOOD(coachingData.currentLoanBalance, results.avgMonthlyDebtReduction);
  const flexProj = modelCurvedOOD(coachingData.currentLoanBalance, results.avgMonthlyDebtReduction + coachingData.proposedFlexAmount);

  return (
    <div className="min-h-screen bg-[#F7F5F9] flex flex-col font-sans text-[#250B40]">
      {isClientView ? (
        <ClientPortal 
          data={coachingData} 
          results={results} 
          setData={setCoachingData} 
          onExportPDF={handleExportPDF}
          reportRef={reportRef}
          isStaff={auth.type === 'staff'}
          onBackToCoach={() => setIsClientView(false)}
        />
      ) : (
        <>
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
                    onClick={handleClearData}
                    className="flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-sm"
                  >
                    <Trash2 size={12} /> Clear All Data
                  </button>
                )}
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
                  <button onClick={() => handleExportPDF()} className="p-2 hover:bg-white rounded-xl transition-all text-red-600" title="Export PDF"><FileText size={18} /></button>
                </div>
                <button onClick={() => setAuth({ type: null, session: false })} className="p-2 text-slate-400 hover:text-red-500 transition-all"><LogOut size={20} /></button>
              </div>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
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

            <main className="flex-1 overflow-y-auto p-8">
              <div className="container mx-auto max-w-6xl">
                <div className="space-y-12 pb-32">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
                    <div className="flex gap-4 border-b border-slate-100 mb-10 overflow-x-auto">
                      {['inputs', 'redraws', 'dashboard', 'projections', 'steps', 'export'].map(tab => (
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
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black flex items-center gap-3"><Goal className="text-purple-500" /> Report Content Editor</h3>
                        <div className="flex gap-4">
                          <button 
                            onClick={handleGenerateClosingThoughts}
                            disabled={isGeneratingThoughts}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:shadow-lg transition-all disabled:opacity-50"
                          >
                            {isGeneratingThoughts ? <Zap size={14} className="animate-pulse" /> : <Sparkles size={14} />}
                            {isGeneratingThoughts ? 'Generating...' : 'Generate with AI'}
                          </button>
                          <button 
                            onClick={handleClearData}
                            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all"
                          >
                            <Trash2 size={14} /> Clear All Data
                          </button>
                        </div>
                      </div>
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
              </div>
            </main>
          </div>
        </>
      )}
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
