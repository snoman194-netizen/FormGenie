
import React, { useState } from 'react';
import { Sparkles, ArrowRight, User, ShieldCheck } from 'lucide-react';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const handleStart = () => {
    if (name.trim()) {
      setIsFinishing(true);
      // Brief delay for aesthetic transition effect
      setTimeout(() => {
        onComplete(name.trim());
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mt-24 -mr-24 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-[600px] h-[600px] bg-violet-50 rounded-full blur-[120px] opacity-60" />

      <div className="relative w-full max-w-xl text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="flex justify-center">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-5 rounded-[32px] shadow-2xl shadow-indigo-200">
            <Sparkles className="text-white" size={48} />
          </div>
        </div>

        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Welcome to FormGenie</h1>
            <p className="text-gray-500 font-medium text-lg">Enter your name to start building intelligent Google Forms.</p>
          </div>
          
          <div className="relative max-w-sm mx-auto">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleStart()}
              placeholder="Your name"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-[24px] pl-14 pr-6 py-5 text-xl font-bold text-black shadow-sm transition-all focus:outline-none placeholder:text-gray-300"
              autoFocus
              disabled={isFinishing}
            />
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleStart}
              disabled={!name.trim() || isFinishing}
              className="group bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black text-lg flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100 w-full max-w-sm"
            >
              {isFinishing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Get Started <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={24} />
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center space-x-2 text-gray-400 font-medium text-xs uppercase tracking-widest">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Private & Secure Session</span>
            </div>
          </div>
        </div>

        <div className="pt-20">
          <p className="text-xs text-gray-300 font-black uppercase tracking-[0.3em]">FormGenie AI • Version 2026.4</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
