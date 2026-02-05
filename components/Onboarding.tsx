
import React, { useState } from 'react';
import { Sparkles, ArrowRight, User, Mail, ShieldCheck } from 'lucide-react';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleNext = () => {
    if (name.trim()) setStep(2);
  };

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    // Simulating a high-end login experience
    setTimeout(() => {
      onComplete(name);
    }, 1500);
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

        {step === 1 ? (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-gray-900 tracking-tight">Who's building today?</h1>
              <p className="text-gray-500 font-medium text-lg">We'd love to know your name to personalize your experience.</p>
            </div>
            
            <div className="relative max-w-sm mx-auto">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                placeholder="Enter your name"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-[24px] pl-14 pr-6 py-5 text-xl font-bold text-gray-900 shadow-sm transition-all focus:outline-none placeholder:text-gray-300"
                autoFocus
              />
            </div>

            <button 
              onClick={handleNext}
              disabled={!name.trim()}
              className="group bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black text-lg flex items-center mx-auto shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
            >
              Continue <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={24} />
            </button>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-gray-900 tracking-tight">Welcome, {name}!</h1>
              <p className="text-gray-500 font-medium text-lg">Please sign in with your Google account to save your forms and access legal cloud documents.</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full bg-white border-2 border-gray-100 text-gray-700 px-8 py-5 rounded-[24px] font-bold text-xl flex items-center justify-center space-x-4 hover:border-indigo-200 hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <div className="w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />
                )}
                <span>{isLoggingIn ? 'Signing you in...' : 'Sign in with Google'}</span>
              </button>
              
              <div className="flex items-center justify-center space-x-2 text-gray-400 font-medium text-sm">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Your data is protected by Google OAuth 2.0</span>
              </div>
            </div>

            <button 
              onClick={() => setStep(1)}
              className="text-gray-400 font-black text-sm uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              Back to name
            </button>
          </div>
        )}

        <div className="pt-20">
          <p className="text-xs text-gray-300 font-black uppercase tracking-[0.3em]">FormGenie Pro • Version 2026.4</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
