import React, { useState } from 'react';

interface Props {
  onLoginSuccess: (user: { uid: string; phoneNumber: string }) => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('+880');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Smart formatting for Bangladeshi numbers
      let formattedPhone = phoneNumber.trim().replace(/\s/g, '');
      
      if (formattedPhone.startsWith('01') && formattedPhone.length === 11) {
        formattedPhone = '+88' + formattedPhone;
      } else if (formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '+880' + formattedPhone;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      if (formattedPhone.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      // Simple login: just use the phone number as the UID
      const user = {
        uid: formattedPhone.replace('+', ''),
        phoneNumber: formattedPhone
      };

      // Persist to local storage
      localStorage.setItem('procash_simple_user', JSON.stringify(user));
      
      // Artificial delay for UX
      setTimeout(() => {
        onLoginSuccess(user);
        setLoading(false);
      }, 800);

    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mesh-gradient rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-lg shadow-indigo-200">
            P
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome to Pro Cash
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Enter your mobile number to access your vault
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
            <input
              type="tel"
              placeholder="017XX XXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !phoneNumber}
            className="w-full mesh-gradient text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? 'Accessing Vault...' : 'Login & Access Vault'}
          </button>
        </form>

        <p className="mt-8 text-[10px] text-slate-400 text-center leading-relaxed">
          By continuing, you agree to our <span className="text-slate-600 font-bold">Terms of Service</span> and <span className="text-slate-600 font-bold">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};

export default Login;
