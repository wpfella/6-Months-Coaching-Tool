
import React from 'react';
import { CoachingData, CalculationResults, StepStatus } from '../types';
import { CheckCircle2, XCircle, HelpCircle, Info, RotateCcw } from 'lucide-react';

interface StepsSectionProps {
  data: CoachingData;
  results: CalculationResults;
  setData: React.Dispatch<React.SetStateAction<CoachingData>>;
}

const STEP_DETAILS = [
  { 
    id: 1, 
    title: "$2,000 Emergency Buffer", 
    desc: "Available redraw exceeds $2,000 for unexpected costs.",
    criteria: "Condition: Current available redraw > $2,000. This baseline buffer ensures small emergencies don't derail the plan."
  },
  { 
    id: 2, 
    title: "1 Month Living Expenses", 
    desc: "Redraw covers one month of average expenses.",
    criteria: "Condition: Available redraw > Average monthly expenses. Provides 30 days of liquidity security."
  },
  { 
    id: 3, 
    title: "Pay Off External Debts", 
    desc: "No non-Crown debts remaining.",
    criteria: "Condition: 'Has External Debts' flag set to NO. Focuses all cashflow onto the primary home loan."
  },
  { 
    id: 4, 
    title: "Save 3 Months Expenses", 
    desc: "A robust safety net in redraw.",
    criteria: "Condition: Available redraw > 3x average monthly expenses. The 'Golden Standard' for safety nets."
  },
  { 
    id: 5, 
    title: "Debt Down 10%", 
    desc: "Total loan balance reduced by 10% from settlement.",
    criteria: "Condition: Current balance < 90% of settlement loan amount. First major milestone of ownership."
  },
  { 
    id: 6, 
    title: "Super Contributions to 15%", 
    desc: "Strategy to maximize retirement savings.",
    criteria: "Status: Always 'AT YOUR DISCRETION'. Coaches provide coaching, not specific financial product advice."
  },
  { 
    id: 7, 
    title: "Debt Down 25%", 
    desc: "Quarter-way to total debt freedom.",
    criteria: "Condition: Current balance < 75% of original settlement amount. Momentum is clearly established."
  },
  { 
    id: 8, 
    title: "Savings Rate +10% vs Start", 
    desc: "Efficiency improved by 10% from first report.",
    criteria: "Condition: Current savings rate > (Original savings rate * 1.1). Measures improved cashflow discipline."
  },
  { 
    id: 9, 
    title: "Debt Down 50%", 
    desc: "Half-way point! Owning more than the bank.",
    criteria: "Condition: Current balance < 50% of settlement amount. The psychological turning point."
  },
  { 
    id: 10, 
    title: "Investment Readiness", 
    desc: "Equity leverage readiness for wealth building.",
    criteria: "Status: Manually updated based on client readiness and pre-approval for secondary investments."
  },
  { 
    id: 11, 
    title: "Debt Down 75%", 
    desc: "The finish line is in sight.",
    criteria: "Condition: Current balance < 25% of original settlement. Final stretch to financial freedom."
  },
  { 
    id: 12, 
    title: "Debt Down 100% (DEBT FREE)", 
    desc: "Complete financial security achieved.",
    criteria: "Condition: Loan balance = 0. The ultimate objective of the Crown Money program."
  }
];

const StepsSection: React.FC<StepsSectionProps> = ({ data, results, setData }) => {
  const handleOverride = (stepId: number, status: StepStatus) => {
    setData(prev => ({
      ...prev,
      manualOverrides: { ...prev.manualOverrides, [stepId]: status }
    }));
  };

  const clearOverride = (stepId: number) => {
    const newOverrides = { ...data.manualOverrides };
    delete newOverrides[stepId];
    setData(prev => ({ ...prev, manualOverrides: newOverrides }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-[#250B40] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-purple-900/10">
            {Object.values(results.stepsStatus).filter(s => s === StepStatus.YES).length}
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#250B40] tracking-tight">12 Steps to Security</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Crown Money Methodology</p>
          </div>
        </div>
        <div className="hidden md:block text-right flex-1 max-w-xs">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Program Progress</div>
           <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
             <div 
               className="h-full bg-[#250B40] transition-all duration-1000 ease-out" 
               style={{ width: `${(Object.values(results.stepsStatus).filter(s => s === StepStatus.YES).length / 12) * 100}%` }}
             />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STEP_DETAILS.map((step) => {
          const autoStatus = results.stepsStatus[step.id];
          const manualStatus = data.manualOverrides[step.id];
          const currentStatus = manualStatus || autoStatus;

          return (
            <div key={step.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-[#250B40] transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-slate-100 group-hover:text-[#250B40]/10 transition-colors">
                    {step.id.toString().padStart(2, '0')}
                  </span>
                  <div>
                    <h4 className="font-black text-sm text-[#250B40] flex items-center gap-2 uppercase tracking-tight">
                      {step.title}
                      <StepInfo criteria={step.criteria} />
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">{step.desc}</p>
                  </div>
                </div>
                <StatusBadge status={currentStatus} />
              </div>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                <div className="flex-1 flex gap-1 p-1 bg-slate-50 rounded-2xl">
                  {[StepStatus.YES, StepStatus.NO, StepStatus.DISCRETION].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleOverride(step.id, s)}
                      className={`flex-1 text-[9px] py-2 rounded-xl font-black uppercase tracking-widest transition-all ${
                        manualStatus === s 
                          ? 'bg-[#250B40] text-white shadow-lg scale-[1.02]' 
                          : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                      }`}
                    >
                      {s === StepStatus.DISCRETION ? 'Disc.' : s}
                    </button>
                  ))}
                </div>
                {manualStatus && (
                  <button 
                    onClick={() => clearOverride(step.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    title="Clear Override"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StepInfo = ({ criteria }: { criteria: string }) => (
  <div className="group relative">
    <Info size={14} className="text-slate-300 hover:text-slate-600 cursor-help" />
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 rounded-2xl bg-[#250B40] p-4 text-[10px] text-[#E6DEEE] opacity-0 transition-opacity group-hover:opacity-100 z-50 shadow-2xl leading-relaxed font-bold border border-white/10">
      <div className="text-white uppercase tracking-widest text-[9px] mb-2 border-b border-white/10 pb-1">Coaching Criteria</div>
      {criteria}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#250B40]" />
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: StepStatus }) => {
  switch (status) {
    case StepStatus.YES:
      return (
        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border border-emerald-100">
          <CheckCircle2 size={14} /> YES
        </div>
      );
    case StepStatus.NO:
      return (
        <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border border-red-100">
          <XCircle size={14} /> NO
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border border-slate-200">
          <HelpCircle size={14} /> DISC.
        </div>
      );
  }
};

export default StepsSection;
