
import React, { useState, useRef } from 'react';
import { CoachingData, ReviewPeriodType, MonthlyGranularData, WeeklySpendingDay } from '../types';
import { Home, Calculator, Table, Edit3, Trash2, Plus, Info, Sparkles, Upload, Link as LinkIcon, Calendar, DollarSign, Zap, FileText } from 'lucide-react';
import { analyzeHubSpotData, parseRedrawsFromText, extractStatementData } from '../services/geminiService';

interface InputSectionProps {
  data: CoachingData;
  setData: React.Dispatch<React.SetStateAction<CoachingData>>;
}

const InputSection: React.FC<InputSectionProps> = ({ data, setData }) => {
  const [isProcessingRedraws, setIsProcessingRedraws] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzingHubSpot, setIsAnalyzingHubSpot] = useState(false);
  const [hubspotText, setHubspotText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof CoachingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleClearHubSpot = () => {
    if (window.confirm('Clear all HubSpot input fields?')) {
      setData(prev => ({
        ...prev,
        householdNames: '',
        loanIdentifier: '',
        clientEmail: '',
        settlementDate: '',
        propertyAddress: '',
        settlementLoanAmount: 0,
        propertyImageUrl: '',
        previousLoan6Months: 0,
        previousLoan90Days: 0,
        originalDebtFreeDate: '',
        firstReportSavingsRate: 0,
        weeklySpendingAmount: 0,
        weeklySpendingDay: WeeklySpendingDay.MONDAY,
        currentPropertyValuation: 0,
        hasExternalDebts: false,
        previousOODDate: ''
      }));
    }
  };

  const handleClearCoachInput = () => {
    if (window.confirm('Clear all Coach input fields?')) {
      setData(prev => ({
        ...prev,
        currentAvailableRedraw: 0,
        startDate: '',
        endDate: '',
        rawRedrawsText: ''
      }));
    }
  };

  const handleClearMonthlyLogs = () => {
    if (window.confirm('Clear all monthly performance logs?')) {
      setData(prev => ({
        ...prev,
        monthlyData: []
      }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsExtracting(true);
    try {
      const newMonthlyRows: MonthlyGranularData[] = [];
      let lastBalance = data.currentLoanBalance;
      let lastRedraw = data.currentAvailableRedraw;
      let lastStartDate = data.startDate;
      let lastEndDate = data.endDate;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });

        const result = await extractStatementData({
          base64Data: fileData,
          mimeType: file.type,
          prompt: "Extract loan balance, available redraw, monthly totals, and review period dates."
        });

        if (result) {
          if (result.redraw) lastRedraw = result.redraw;
          if (result.startDate) lastStartDate = result.startDate;
          if (result.endDate) lastEndDate = result.endDate;
          if (result.balance) lastBalance = result.balance;
          
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const currentMonth = months[new Date().getMonth()];
          
          newMonthlyRows.push({
            month: currentMonth,
            debit: result.totalDebits || 0,
            credit: result.totalCredits || 0,
            loanBalance: result.balance || lastBalance,
            oneOffDebitsRemoved: 0,
            oneOffCreditsRemoved: 0,
            redraws: 0,
            actualDebtReduction: (result.totalCredits || 0) - (result.totalDebits || 0),
            savingsRate: result.totalCredits > 0 ? ((result.totalCredits - result.totalDebits) / result.totalCredits) * 100 : 0
          });
        }
      }

      setData(prev => ({
        ...prev,
        monthlyData: [...prev.monthlyData, ...newMonthlyRows],
        currentAvailableRedraw: lastRedraw,
        startDate: lastStartDate,
        endDate: lastEndDate,
        currentLoanBalance: lastBalance
      }));

      alert(`Successfully processed ${files.length} statements!`);
    } catch (error) {
      alert('Failed to extract data from one or more statements.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateMonthlyData = (index: number, field: keyof MonthlyGranularData, value: any) => {
    const newData = [...data.monthlyData];
    newData[index] = { ...newData[index], [field]: value };
    
    // Auto-calculate reduction and savings rate if needed
    if (field === 'credit' || field === 'debit' || field === 'oneOffCreditsRemoved' || field === 'oneOffDebitsRemoved') {
      const credit = field === 'credit' ? Number(value) : newData[index].credit;
      const debit = field === 'debit' ? Number(value) : newData[index].debit;
      const removedCredits = field === 'oneOffCreditsRemoved' ? Number(value) : newData[index].oneOffCreditsRemoved;
      const removedDebits = field === 'oneOffDebitsRemoved' ? Number(value) : newData[index].oneOffDebitsRemoved;
      
      newData[index].actualDebtReduction = (credit - removedCredits) - (debit - removedDebits);
      newData[index].savingsRate = credit > 0 ? ((credit - debit) / credit) * 100 : 0;
    }
    
    setData(prev => ({ ...prev, monthlyData: newData }));
  };

  const addMonth = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const nextIdx = data.monthlyData.length % 12;
    const newRow: MonthlyGranularData = {
      month: months[nextIdx],
      debit: 0,
      credit: 0,
      loanBalance: data.monthlyData[data.monthlyData.length-1]?.loanBalance || data.settlementLoanAmount,
      oneOffDebitsRemoved: 0,
      oneOffCreditsRemoved: 0,
      redraws: 0,
      actualDebtReduction: 0,
      savingsRate: 0
    };
    setData(prev => ({ ...prev, monthlyData: [...prev.monthlyData, newRow] }));
  };

  const handleProcessRedraws = async () => {
    if (!data.rawRedrawsText.trim()) return;
    setIsProcessingRedraws(true);
    try {
      const parsed = await parseRedrawsFromText(data.rawRedrawsText);
      if (parsed && Array.isArray(parsed)) {
        setData(prev => {
          const newAdditionalRedraws = [...prev.additionalRedraws, ...parsed];
          
          // Auto-update monthlyData redraws based on the new additionalRedraws
          const updatedMonthlyData = prev.monthlyData.map(m => {
            const monthRedraws = newAdditionalRedraws
              .filter(r => r.month.toLowerCase() === m.month.toLowerCase() && !r.excluded)
              .reduce((sum, r) => sum + r.amount, 0);
            return { ...m, redraws: monthRedraws };
          });

          return {
            ...prev,
            additionalRedraws: newAdditionalRedraws,
            monthlyData: updatedMonthlyData
          };
        });
        alert(`Successfully parsed ${parsed.length} redraw records!`);
      }
    } catch (error) {
      alert('Failed to parse redraws. Please try again.');
    } finally {
      setIsProcessingRedraws(false);
    }
  };

  const handleAnalyzeHubSpot = async () => {
    if (!hubspotText.trim()) return;
    setIsAnalyzingHubSpot(true);
    try {
      const result = await analyzeHubSpotData(hubspotText);
      setData(prev => ({ ...prev, ...result }));
      alert('HubSpot data analyzed and fields populated!');
      setHubspotText('');
    } catch (error) {
      alert('Failed to analyze HubSpot data.');
    } finally {
      setIsAnalyzingHubSpot(false);
    }
  };

  const inputClasses = "w-full mt-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#250B40] transition-all outline-none text-[#250B40] font-black";
  const labelClasses = "text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5";

  return (
    <div className="space-y-12">
      {/* SECTION 1: HUBSPOT INPUT */}
      <section className="bg-slate-50 p-10 rounded-[2.5rem] space-y-8 border border-slate-100">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#250B40] flex items-center gap-3">
            <Home size={28} className="text-indigo-500" /> HubSpot Input
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={handleClearHubSpot}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
            >
              Clear Section
            </button>
            <button 
              onClick={handleAnalyzeHubSpot}
              disabled={isAnalyzingHubSpot || !hubspotText.trim()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isAnalyzingHubSpot ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:shadow-lg active:scale-95'}`}
            >
              {isAnalyzingHubSpot ? <Zap size={12} className="animate-pulse" /> : <Sparkles size={12} />}
              {isAnalyzingHubSpot ? 'Analyzing...' : 'Analyze Paste'}
            </button>
            <span className="px-4 py-1.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Core Data</span>
          </div>
        </div>

        <div className="space-y-4">
          <label className={labelClasses}>Paste HubSpot Client Data (Names, Address, Loan Details)</label>
          <textarea 
            className="w-full h-32 p-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-[#250B40] text-xs"
            placeholder="Paste raw text from HubSpot here..."
            value={hubspotText}
            onChange={(e) => setHubspotText(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className={labelClasses}>Household First Names</label>
            <input className={inputClasses} value={data.householdNames} onChange={(e) => handleChange('householdNames', e.target.value)} placeholder="e.g. Jason and Kathleen" />
          </div>
          <div className="md:col-span-1">
            <label className={labelClasses}>Loan Name / Account Number</label>
            <input className={inputClasses} value={data.loanIdentifier} onChange={(e) => handleChange('loanIdentifier', e.target.value)} placeholder="e.g. Main Account Loan Number: 123456" />
          </div>
          <div>
            <label className={labelClasses}>Client Email Address</label>
            <input className={inputClasses} value={data.clientEmail} onChange={(e) => handleChange('clientEmail', e.target.value)} placeholder="client@example.com" />
          </div>
          
          <div>
            <label className={labelClasses}>Settlement Date</label>
            <input type="date" className={inputClasses} value={data.settlementDate} onChange={(e) => handleChange('settlementDate', e.target.value)} />
          </div>
          
          <div className="md:col-span-2">
            <label className={labelClasses}>Street Address</label>
            <input className={inputClasses} value={data.propertyAddress} onChange={(e) => handleChange('propertyAddress', e.target.value)} />
          </div>
          <div>
            <label className={labelClasses}>Actual OO Loan Amount at Settlement</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
              <input type="number" className={`${inputClasses} pl-8`} value={data.settlementLoanAmount} onChange={(e) => handleChange('settlementLoanAmount', Number(e.target.value))} />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className={labelClasses}><LinkIcon size={12} /> Link to House Photo</label>
            <input className={inputClasses} value={data.propertyImageUrl} onChange={(e) => handleChange('propertyImageUrl', e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <label className={labelClasses}>Previous Loan 6 Months</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
              <input type="number" className={`${inputClasses} pl-8`} value={data.previousLoan6Months} onChange={(e) => handleChange('previousLoan6Months', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Previous Loan 90 Days</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
              <input type="number" className={`${inputClasses} pl-8`} value={data.previousLoan90Days} onChange={(e) => handleChange('previousLoan90Days', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Original Debt Free Date</label>
            <input type="date" className={inputClasses} value={data.originalDebtFreeDate} onChange={(e) => handleChange('originalDebtFreeDate', e.target.value)} />
          </div>

          <div>
            <label className={labelClasses}>Savings Rate from First Report (%)</label>
            <input type="number" className={inputClasses} value={data.firstReportSavingsRate} onChange={(e) => handleChange('firstReportSavingsRate', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClasses}>Weekly Spending Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
              <input type="number" className={`${inputClasses} pl-8`} value={data.weeklySpendingAmount} onChange={(e) => handleChange('weeklySpendingAmount', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Weekly Spending Day</label>
            <select className={inputClasses} value={data.weeklySpendingDay} onChange={(e) => handleChange('weeklySpendingDay', e.target.value)}>
              {Object.values(WeeklySpendingDay).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Current House Valuation</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
              <input type="number" className={`${inputClasses} pl-8`} value={data.currentPropertyValuation} onChange={(e) => handleChange('currentPropertyValuation', Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center gap-4 pt-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${data.hasExternalDebts ? 'bg-[#250B40] border-[#250B40]' : 'border-slate-300 group-hover:border-slate-400'}`}>
                {data.hasExternalDebts && <Plus size={14} className="text-white" />}
              </div>
              <input type="checkbox" className="hidden" checked={data.hasExternalDebts} onChange={(e) => handleChange('hasExternalDebts', e.target.checked)} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Has External Debts?</span>
            </label>
          </div>
          <div>
            <label className={labelClasses}>Prev. OOD Goal Date (Internal)</label>
            <input type="date" className={inputClasses} value={data.previousOODDate} onChange={(e) => handleChange('previousOODDate', e.target.value)} />
          </div>
        </div>
      </section>

      {/* SECTION 2: COACH INPUT */}
      <section className="bg-slate-50 p-10 rounded-[2.5rem] space-y-8 border border-slate-100">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#250B40] flex items-center gap-3">
            <Calculator size={28} className="text-emerald-500" /> Coach Input
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={handleClearCoachInput}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
            >
              Clear Section
            </button>
            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Analysis Tools</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className={labelClasses}>Current Available Redraw</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                <input type="number" className={`${inputClasses} pl-8`} value={data.currentAvailableRedraw} onChange={(e) => handleChange('currentAvailableRedraw', Number(e.target.value))} />
              </div>
              <p className="mt-2 text-[9px] font-bold text-slate-400 italic">Enter manually or overwrite after statement extraction.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Review Start Date</label>
                <input className={inputClasses} value={data.startDate} onChange={(e) => handleChange('startDate', e.target.value)} placeholder="01/01/2025" />
              </div>
              <div>
                <label className={labelClasses}>Review End Date</label>
                <input className={inputClasses} value={data.endDate} onChange={(e) => handleChange('endDate', e.target.value)} placeholder="31/12/2025" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className={labelClasses}>Redraws List (Paste from HubSpot)</label>
              <button 
                onClick={handleProcessRedraws}
                disabled={isProcessingRedraws || !data.rawRedrawsText.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isProcessingRedraws ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#250B40] text-white hover:shadow-lg active:scale-95'}`}
              >
                {isProcessingRedraws ? <Zap size={12} className="animate-pulse" /> : <Sparkles size={12} />}
                {isProcessingRedraws ? 'Processing...' : 'Process with AI'}
              </button>
            </div>
            <textarea 
              className="w-full h-40 p-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#250B40] font-bold text-[#250B40] text-xs"
              placeholder="Paste notes from HubSpot here... e.g. 28.01.25 $100 hockey academy fees..."
              value={data.rawRedrawsText}
              onChange={(e) => handleChange('rawRedrawsText', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: MONTHLY PERFORMANCE LOGS */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-black text-[#250B40] flex items-center gap-3">
            <Table size={28} className="text-purple-500" /> Monthly Performance Logs
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={handleClearMonthlyLogs}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
            >
              Clear Logs
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*,application/pdf,text/csv" 
              multiple
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all ${isExtracting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {isExtracting ? <Zap size={14} className="animate-pulse" /> : <Upload size={14} />}
              {isExtracting ? 'Extracting...' : 'Upload Bank Statements'}
            </button>
            <button onClick={addMonth} className="px-6 py-3 bg-[#250B40] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:shadow-lg transition-all">
              <Plus size={14} /> Add Performance Row
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400">
                <th className="px-4 py-4 font-black uppercase tracking-widest">Month</th>
                <th className="px-4 py-4 font-black uppercase tracking-widest text-right">Debit</th>
                <th className="px-4 py-4 font-black uppercase tracking-widest text-right">Credit</th>
                <th className="px-4 py-4 font-black uppercase tracking-widest text-right">Balance</th>
                <th className="px-4 py-4 font-black uppercase tracking-widest text-right">One-Off Credits</th>
                <th className="px-4 py-4 font-black uppercase tracking-widest text-right">One-Off Debits</th>
                <th className="px-4 py-4 font-black uppercase tracking-widest text-right">Total Additional Redraws</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {data.monthlyData.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-2 py-3"><input className="w-full bg-slate-50 border-none rounded-lg p-3 font-black" value={m.month} onChange={(e) => updateMonthlyData(i, 'month', e.target.value)} /></td>
                  <td className="px-2 py-3"><input type="number" className="w-full bg-slate-50 border-none rounded-lg p-3 text-right font-bold text-red-600" value={m.debit} onChange={(e) => updateMonthlyData(i, 'debit', Number(e.target.value))} /></td>
                  <td className="px-2 py-3"><input type="number" className="w-full bg-slate-50 border-none rounded-lg p-3 text-right font-bold text-emerald-600" value={m.credit} onChange={(e) => updateMonthlyData(i, 'credit', Number(e.target.value))} /></td>
                  <td className="px-2 py-3"><input type="number" className="w-full bg-slate-50 border-none rounded-lg p-3 text-right font-black" value={m.loanBalance} onChange={(e) => updateMonthlyData(i, 'loanBalance', Number(e.target.value))} /></td>
                  <td className="px-2 py-3"><input type="number" className="w-full bg-slate-50 border-none rounded-lg p-3 text-right text-indigo-600" value={m.oneOffCreditsRemoved} onChange={(e) => updateMonthlyData(i, 'oneOffCreditsRemoved', Number(e.target.value))} /></td>
                  <td className="px-2 py-3"><input type="number" className="w-full bg-slate-50 border-none rounded-lg p-3 text-right text-orange-600" value={m.oneOffDebitsRemoved} onChange={(e) => updateMonthlyData(i, 'oneOffDebitsRemoved', Number(e.target.value))} /></td>
                  <td className="px-2 py-3"><input type="number" className="w-full bg-slate-50 border-none rounded-lg p-3 text-right text-purple-600" value={m.redraws} readOnly /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 flex gap-4 p-8 bg-slate-50 rounded-2xl text-base font-black text-slate-500 border border-slate-100 items-center">
           <Info size={24} className="text-indigo-500" /> 
           <span>Once-off debits and credits are removed from our projections to show a more accurate picture of underlying performance</span>
        </div>
      </section>
    </div>
  );
};

export default InputSection;
