
import React, { useState } from 'react';
import { CoachingData, CalculationResults } from '../types';
import { 
  LayoutDashboard, 
  TrendingUp, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  Download,
  ChevronRight,
  Menu,
  X,
  PieChart as PieChartIcon,
  Target
} from 'lucide-react';
import OverviewSection from './OverviewSection';
import DashboardSection from './DashboardSection';
import ProjectionsSection from './ProjectionsSection';
import StepsSection from './StepsSection';
import RedrawsSection from './RedrawsSection';
import GoalsSection from './GoalsSection';
import FullReport from './FullReport';
import { LOGOS } from '../constants';

interface ClientPortalProps {
  data: CoachingData;
  results: CalculationResults;
  setData: React.Dispatch<React.SetStateAction<CoachingData>>;
  onExportPDF: (sectionId?: string) => void;
  reportRef: React.RefObject<HTMLDivElement>;
  isStaff?: boolean;
  onBackToCoach?: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ data, results, setData, onExportPDF, reportRef, isStaff, onBackToCoach }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const clientFirstName = data.householdNames.split(',')[1]?.trim().split(' ')[0] || data.householdNames.split(' ')[0];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'performance', label: 'Performance', icon: <TrendingUp size={18} /> },
    { id: 'redraws', label: 'Redraws', icon: <DollarSign size={18} /> },
    { id: 'projections', label: 'Projections', icon: <PieChartIcon size={18} /> },
    { id: 'steps', label: '12 Steps', icon: <CheckCircle2 size={18} /> },
    { id: 'goals', label: 'Goals & Strategy', icon: <Target size={18} /> },
    { id: 'full-report', label: 'Full Report', icon: <FileText size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <div id="section-overview"><OverviewSection data={data} results={results} /></div>;
      case 'performance':
        return <div id="section-performance"><DashboardSection data={data} results={results} /></div>;
      case 'redraws':
        return <div id="section-redraws"><RedrawsSection data={data} setData={setData} results={results} readOnly={true} /></div>;
      case 'projections':
        return <div id="section-projections"><ProjectionsSection data={data} results={results} setData={setData} readOnly={true} /></div>;
      case 'steps':
        return <div id="section-steps"><StepsSection data={data} results={results} setData={setData} readOnly={true} /></div>;
      case 'goals':
        return <div id="section-goals"><GoalsSection data={data} results={results} /></div>;
      case 'full-report':
        return (
          <div className="flex flex-col items-center space-y-8">
            <div className="w-full flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm gap-6">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-[#250B40] flex items-center justify-center text-white shadow-xl">
                    <FileText size={32} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-[#250B40]">Complete Home Ownership Report</h3>
                    <p className="text-sm font-bold text-slate-400">All sections combined into a single PDF document.</p>
                 </div>
              </div>
              <button 
                onClick={() => onExportPDF()}
                className="w-full md:w-auto px-10 py-5 bg-[#250B40] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <Download size={18} /> Download Full PDF Report
              </button>
            </div>
            <div className="w-full overflow-x-auto pb-10">
               <FullReport data={data} results={results} reportRef={reportRef} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-500 ${isDarkMode ? 'bg-[#0F0A1A] text-white' : 'bg-[#F7F5F9] text-[#250B40]'}`}>
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex w-72 border-r flex-col sticky top-0 h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#1A1425] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="p-8 flex items-center justify-between">
          <img src={isDarkMode ? LOGOS.light : LOGOS.dark} alt="Crown Money" className="h-10" />
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                activeTab === tab.id 
                  ? (isDarkMode ? 'bg-purple-500 text-white shadow-xl shadow-purple-500/20' : 'bg-[#250B40] text-white shadow-xl shadow-purple-900/20')
                  : (isDarkMode ? 'text-slate-500 hover:bg-white/5 hover:text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-[#250B40]')
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-100/10 space-y-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>

          {isStaff && (
            <button 
              onClick={onBackToCoach}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
            >
              <ChevronRight size={14} className="rotate-180" /> Back to Coach
            </button>
          )}

          <div className={`${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} p-4 rounded-2xl`}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Client Profile</p>
            <p className={`text-xs font-black truncate ${isDarkMode ? 'text-white' : 'text-[#250B40]'}`}>{data.householdNames}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={`lg:hidden border-b p-4 sticky top-0 z-50 flex justify-between items-center transition-colors duration-500 ${isDarkMode ? 'bg-[#1A1425] border-white/5' : 'bg-white border-slate-200'}`}>
        <img src={isDarkMode ? LOGOS.light : LOGOS.dark} alt="Crown Money" className="h-8" />
        <div className="flex items-center gap-2">
          {isStaff && (
            <button onClick={onBackToCoach} className="p-2 text-indigo-500"><ChevronRight size={20} className="rotate-180" /></button>
          )}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 ${isDarkMode ? 'text-white' : 'text-[#250B40]'}`}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={`lg:hidden fixed inset-0 z-40 pt-20 px-6 space-y-4 animate-in slide-in-from-top duration-300 ${isDarkMode ? 'bg-[#0F0A1A]' : 'bg-white'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                activeTab === tab.id 
                  ? 'bg-purple-500 text-white shadow-xl' 
                  : (isDarkMode ? 'text-slate-400 bg-white/5' : 'text-slate-400 bg-slate-50')
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <button 
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-center gap-2 px-6 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-purple-500 font-black uppercase tracking-[0.3em] text-[10px] mb-1">Welcome Back</p>
              <h1 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#250B40]'}`}>
                Hi {clientFirstName}
              </h1>
              <p className="text-slate-400 font-bold text-sm">Reviewing: {tabs.find(t => t.id === activeTab)?.label}</p>
            </div>
            {activeTab !== 'full-report' && (
              <button 
                onClick={() => onExportPDF(activeTab)}
                className={`px-6 py-3 border rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-sm ${
                  isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-[#250B40] hover:bg-slate-50'
                }`}
              >
                <Download size={14} /> Export Section PDF
              </button>
            )}
          </div>

          <div className={`pb-20 ${isDarkMode ? 'dark' : ''}`}>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientPortal;
