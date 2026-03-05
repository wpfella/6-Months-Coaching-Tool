
import React, { useState, useMemo } from 'react';
import { CoachingData, RedrawRecord, CalculationResults } from '../types';
import { format } from 'date-fns';
import { Plus, Trash2, Clipboard, AlertCircle, TrendingUp, DollarSign, Calendar, FileText, Sparkles, Zap, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell } from 'recharts';
import { parseRedrawsFromText } from '../services/geminiService';

interface RedrawsSectionProps {
  data: CoachingData;
  setData: React.Dispatch<React.SetStateAction<CoachingData>>;
  results: CalculationResults;
  readOnly?: boolean;
}

const RedrawsSection: React.FC<RedrawsSectionProps> = ({ data, setData, results, readOnly }) => {
  const [pasteBuffer, setPasteBuffer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualEntry, setManualEntry] = useState({ date: '', amount: '', description: '' });

  const monthlyChartData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    data.additionalRedraws.forEach(r => {
      if (!r.excluded) {
        monthMap[r.month] = (monthMap[r.month] || 0) + r.amount;
      }
    });
    return Object.entries(monthMap).map(([name, total]) => ({ name, total }));
  }, [data.additionalRedraws]);

  const handleClearRedraws = () => {
    if (window.confirm('Are you sure you want to clear all redraw transactions?')) {
      setData(prev => ({ ...prev, additionalRedraws: [] }));
    }
  };

  const handleProcessWithAI = async () => {
    if (!pasteBuffer.trim()) return;
    setIsProcessing(true);
    try {
      const newRedraws = await parseRedrawsFromText(pasteBuffer);
      if (newRedraws && newRedraws.length > 0) {
        setData(prev => {
          const updatedRedraws = [...prev.additionalRedraws, ...newRedraws];
          const updatedMonthlyData = prev.monthlyData.map(m => {
            const monthRedraws = updatedRedraws
              .filter(r => r.month.toLowerCase() === m.month.toLowerCase() && !r.excluded)
              .reduce((sum, r) => sum + r.amount, 0);
            return { ...m, redraws: monthRedraws };
          });
          return {
            ...prev,
            additionalRedraws: updatedRedraws,
            monthlyData: updatedMonthlyData
          };
        });
        setPasteBuffer('');
      } else {
        alert('AI could not find any redraw records in the text.');
      }
    } catch (error) {
      alert('Failed to process with AI.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = () => {
    const lines = pasteBuffer.split('\n');
    const newRedraws: RedrawRecord[] = lines.filter(l => l.trim()).map(line => {
      const parts = line.split(/\t|\s{2,}/);
      const date = parts[0] || new Date().toISOString().split('T')[0];
      return {
        id: crypto.randomUUID(),
        date,
        amount: parseFloat(parts[1]?.replace(/[^0-9.]/g, '') || '0'),
        description: parts[2] || 'Imported Redraw',
        month: format(new Date(date), 'MMMM'),
        excluded: false
      };
    });
    setData(prev => {
      const updatedRedraws = [...prev.additionalRedraws, ...newRedraws];
      const updatedMonthlyData = prev.monthlyData.map(m => {
        const monthRedraws = updatedRedraws
          .filter(r => r.month.toLowerCase() === m.month.toLowerCase() && !r.excluded)
          .reduce((sum, r) => sum + r.amount, 0);
        return { ...m, redraws: monthRedraws };
      });
      return { ...prev, additionalRedraws: updatedRedraws, monthlyData: updatedMonthlyData };
    });
    setPasteBuffer('');
  };

  const addManualRedraw = () => {
    if (!manualEntry.amount) return;
    const date = manualEntry.date || new Date().toISOString().split('T')[0];
    const newRedraw: RedrawRecord = {
      id: crypto.randomUUID(),
      date,
      amount: parseFloat(manualEntry.amount),
      description: manualEntry.description || 'Manual Entry',
      month: format(new Date(date), 'MMMM'),
      excluded: false
    };
    setData(prev => {
      const updatedRedraws = [...prev.additionalRedraws, newRedraw];
      const updatedMonthlyData = prev.monthlyData.map(m => {
        const monthRedraws = updatedRedraws
          .filter(r => r.month.toLowerCase() === m.month.toLowerCase() && !r.excluded)
          .reduce((sum, r) => sum + r.amount, 0);
        return { ...m, redraws: monthRedraws };
      });
      return { ...prev, additionalRedraws: updatedRedraws, monthlyData: updatedMonthlyData };
    });
    setManualEntry({ date: '', amount: '', description: '' });
  };

  const toggleExclude = (id: string) => {
    setData(prev => {
      const updatedRedraws = prev.additionalRedraws.map(r => r.id === id ? { ...r, excluded: !r.excluded } : r);
      const updatedMonthlyData = prev.monthlyData.map(m => {
        const monthRedraws = updatedRedraws
          .filter(r => r.month.toLowerCase() === m.month.toLowerCase() && !r.excluded)
          .reduce((sum, r) => sum + r.amount, 0);
        return { ...m, redraws: monthRedraws };
      });
      return { ...prev, additionalRedraws: updatedRedraws, monthlyData: updatedMonthlyData };
    });
  };

  const deleteRedraw = (id: string) => {
    setData(prev => {
      const updatedRedraws = prev.additionalRedraws.filter(r => r.id !== id);
      const updatedMonthlyData = prev.monthlyData.map(m => {
        const monthRedraws = updatedRedraws
          .filter(r => r.month.toLowerCase() === m.month.toLowerCase() && !r.excluded)
          .reduce((sum, r) => sum + r.amount, 0);
        return { ...m, redraws: monthRedraws };
      });
      return { ...prev, additionalRedraws: updatedRedraws, monthlyData: updatedMonthlyData };
    });
  };

  const formatAUD = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[#250B40] font-black uppercase text-xs tracking-widest flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-500" /> Monthly Redraw Distribution
            </h3>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <ChartTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {monthlyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#8b5cf6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Additional Redraws</p>
            <h3 className="text-2xl font-black text-[#250B40] tracking-tighter">{formatAUD(results.totalAdditionalRedraws)}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Monthly Redraw</p>
            <h3 className="text-2xl font-black text-[#250B40] tracking-tighter">{formatAUD(results.avgMonthlyAdditionalRedraws)}</h3>
          </div>
          <div className="bg-[#F7F5F9] p-6 rounded-[2rem] border border-[#E6DEEE] shadow-sm relative group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transactions Count</p>
            <h3 className="text-2xl font-black text-[#250B40] tracking-tighter">{data.additionalRedraws.length} Events</h3>
            <button 
              onClick={handleClearRedraws}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              title="Clear all redraws"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Clipboard size={20} className="text-[#250B40]" />
              <h3 className="text-xl font-black text-[#250B40] uppercase tracking-tight">Bulk Import (HubSpot)</h3>
            </div>
            <textarea 
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none focus:ring-2 focus:ring-[#250B40]"
              placeholder="Paste redraw list from HubSpot notes here... (Date   Amount   Description)"
              value={pasteBuffer}
              onChange={(e) => setPasteBuffer(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button 
                onClick={handleProcessWithAI}
                disabled={isProcessing || !pasteBuffer}
                className="flex-1 py-4 bg-[#250B40] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-slate-800 transition-all shadow-lg shadow-purple-900/10"
              >
                {isProcessing ? <Zap size={16} className="animate-pulse" /> : <Sparkles size={16} />}
                {isProcessing ? 'Processing...' : 'Process with AI'}
              </button>
              <button 
                onClick={handlePaste}
                disabled={!pasteBuffer}
                className="px-6 py-4 border-2 border-[#250B40] text-[#250B40] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
              >
                Manual Parse
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <FileText size={20} className="text-[#250B40]" />
              <h3 className="text-xl font-black text-[#250B40] uppercase tracking-tight">Manual Entry</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                <input 
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-1 focus:ring-[#250B40] text-sm"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                  placeholder="Holiday, Car Repair, etc."
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</label>
                <input 
                  type="number"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-1 focus:ring-[#250B40] text-sm font-bold"
                  value={manualEntry.amount}
                  onChange={(e) => setManualEntry({ ...manualEntry, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                <input 
                  type="date"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-1 focus:ring-[#250B40] text-sm"
                  value={manualEntry.date}
                  onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                />
              </div>
            </div>
            <button 
              onClick={addManualRedraw}
              className="mt-6 w-full py-4 border-2 border-[#250B40] text-[#250B40] rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#250B40] hover:text-white transition-all"
            >
              <Plus size={16} /> Add Transaction
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Include?</th>
              {!readOnly && <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.additionalRedraws.map((r) => (
              <tr key={r.id} className={`hover:bg-slate-50/50 transition-colors ${r.excluded ? 'opacity-30' : ''}`}>
                <td className="px-8 py-5 text-sm font-medium text-slate-500">{r.date}</td>
                <td className="px-8 py-5 text-sm font-bold text-[#250B40]">{r.description}</td>
                <td className="px-8 py-5 text-sm font-black text-[#250B40]">{formatAUD(r.amount)}</td>
                <td className="px-8 py-5 text-center">
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 accent-[#250B40] cursor-pointer rounded-lg border-slate-200" 
                    checked={!r.excluded} 
                    onChange={() => !readOnly && toggleExclude(r.id)}
                    disabled={readOnly}
                    title={r.excluded ? "Excluded from calculation" : "Included in calculation"}
                  />
                </td>
                {!readOnly && (
                  <td className="px-8 py-5">
                    <button onClick={() => deleteRedraw(r.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {data.additionalRedraws.length === 0 && (
          <div className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-xs">
            No redraw events recorded for this period.
          </div>
        )}
      </div>
    </div>
  );
};

export default RedrawsSection;
