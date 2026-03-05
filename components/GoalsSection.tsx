
import React from 'react';
import { CoachingData, CalculationResults } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Target, Quote, TrendingUp, CheckCircle2 } from 'lucide-react';

interface GoalsSectionProps {
  data: CoachingData;
  results: CalculationResults;
}

const GoalsSection: React.FC<GoalsSectionProps> = ({ data, results }) => {
  const goalData = data.financialGoals.map(g => ({
    name: g.goal.length > 20 ? g.goal.substring(0, 20) + '...' : g.goal,
    fullName: g.goal,
    progress: g.progress
  }));

  return (
    <div className="space-y-8 animate-in slide-in-from-left duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goals List & Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-[#250B40] flex items-center gap-3">
                 <Target className="text-indigo-500" /> Financial Goals Progress
               </h3>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                  <ChartTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 max-w-xs">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Goal</p>
                            <p className="text-xs font-bold text-[#250B40] mb-2">{payload[0].payload.fullName}</p>
                            <p className="text-xl font-black text-indigo-600">{payload[0].value}% Complete</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="progress" radius={[10, 10, 0, 0]} barSize={50}>
                    {goalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.progress === 100 ? '#10b981' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.financialGoals.map((goal) => (
              <div key={goal.id} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-xl ${goal.progress === 100 ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'}`}>
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-xs font-black text-slate-300">{goal.progress}%</span>
                </div>
                <p className="font-bold text-[#250B40] text-sm leading-tight mb-4">{goal.goal}</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${goal.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${goal.progress}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coach Strategy Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#250B40] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <Quote size={48} className="text-purple-400/20 mb-6" />
            <h3 className="text-2xl font-black mb-6 relative z-10">Coach's Strategy</h3>
            <p className="text-lg text-purple-100 leading-relaxed font-medium italic relative z-10 flex-1">
              "{data.closingThoughts}"
            </p>
            <div className="mt-12 pt-8 border-t border-white/10 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-black">CM</div>
                  <div>
                    <p className="text-xs font-black text-white">Crown Money Coach</p>
                    <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Partnering in your success</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsSection;
