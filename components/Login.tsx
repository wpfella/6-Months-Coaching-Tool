
import React, { useState } from 'react';
import { LOGOS } from '../constants';
import { Shield, User, Upload, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (type: 'staff' | 'client') => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onImport }) => {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleStaffLogin = () => {
    if (pass === 'Crown') {
      onLogin('staff');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F9] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-12 rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#250B40] rounded-2xl flex items-center justify-center text-[#E6DEEE] mb-6">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black text-[#250B40] mb-2 uppercase tracking-tight">Staff Portal</h2>
          <p className="text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest">Coaching & Analysis</p>
          
          <div className="w-full space-y-4">
            <input 
              type="password" 
              placeholder="Enter Staff Password" 
              className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold ${error ? 'border-red-400 shake' : 'border-slate-100 focus:border-[#250B40]'}`}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStaffLogin()}
            />
            <button 
              onClick={handleStaffLogin}
              className="w-full bg-[#250B40] text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-purple-900/10"
            >
              Access Engine <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="bg-[#250B40] p-12 rounded-[2rem] shadow-2xl text-white flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#E6DEEE] rounded-2xl flex items-center justify-center text-[#250B40] mb-6">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Client Portal</h2>
          <p className="text-[#E6DEEE]/60 text-sm font-bold mb-8 uppercase tracking-widest">Review Your Results</p>
          
          <label className="w-full h-40 border-2 border-dashed border-[#E6DEEE]/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#E6DEEE]/50 transition-all bg-white/5">
            <Upload size={32} className="mb-2" />
            <span className="text-sm font-bold uppercase tracking-widest">Upload Scenario (.json)</span>
            <input type="file" className="hidden" accept=".json" onChange={onImport} />
          </label>
          <p className="mt-6 text-xs text-[#E6DEEE]/40 font-medium">To view your analysis, upload the file provided by your Crown Money coach.</p>
        </div>
      </div>
      
      <div className="fixed bottom-8">
        <img src={LOGOS.dark} alt="Crown Money" className="h-8 opacity-20" />
      </div>
    </div>
  );
};

export default Login;
