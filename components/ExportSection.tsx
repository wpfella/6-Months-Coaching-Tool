
import React, { useState } from 'react';
import { CoachingData, CalculationResults } from '../types';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface ExportSectionProps {
  data: CoachingData;
  results: CalculationResults;
}

const ExportSection: React.FC<ExportSectionProps> = ({ data, results }) => {
  const [copied, setCopied] = useState(false);
  const today = format(new Date(), 'dd.MM.yy');
  const periodDays = data.reviewPeriodType === '90 Days' ? 90 : (data.reviewPeriodType === '6 Months' ? 183 : 365);
  
  const exportValue = `${today} (${periodDays} days) – $${results.totalDebtReduction.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(exportValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stepsSummary = Object.entries(results.stepsStatus)
    .filter(([_, status]) => status === 'YES')
    .map(([id]) => id)
    .join(', ');

  const hubspotData = [
    { label: "Last Review Debt Reduction", value: `$${results.totalDebtReduction.toFixed(2)}` },
    { label: "Average Monthly Expenses", value: `$${results.avgMonthlyExpenses.toFixed(2)}` },
    { label: "Current Savings Rate", value: `${results.savingsRate.toFixed(1)}%` },
    { label: "12 Steps Completed", value: stepsSummary || "None" },
    { label: "Current LVR", value: `${results.currentLVR.toFixed(1)}%` }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800">HubSpot "All Review Results" Entry</h3>
          <p className="text-slate-500 text-sm mt-1">Copy this string and append it to the client's multi-line property in HubSpot.</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <code className="flex-1 font-mono text-lg text-[#250B40] font-bold">{exportValue}</code>
          <button 
            onClick={handleCopy}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
              copied ? 'bg-emerald-500 text-white' : 'bg-[#250B40] text-white hover:bg-slate-800'
            }`}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied' : 'Copy String'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4">Export Values Reference</h4>
          <div className="space-y-3">
            {hubspotData.map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#F7F5F9] p-6 rounded-xl border border-[#E6DEEE] flex flex-col justify-center text-center">
          <Download size={40} className="mx-auto text-[#250B40] mb-4 opacity-20" />
          <h4 className="font-bold text-[#250B40] mb-2">Automated HubSpot Sync</h4>
          <p className="text-xs text-slate-600 max-w-[240px] mx-auto leading-relaxed">
            Direct HubSpot API integration is currently in development. Please use the manual copy method above for now.
          </p>
          <button className="mt-6 px-4 py-2 bg-white border border-[#E6DEEE] rounded-lg text-xs font-bold text-[#250B40] hover:bg-slate-50 transition-colors flex items-center gap-2 mx-auto">
            <ExternalLink size={14} /> Open HubSpot CRM
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSection;
