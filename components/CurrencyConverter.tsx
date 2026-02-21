import React, { useState, useEffect } from 'react';
import { currencyService } from '../services/currencyService';
import { SUPPORTED_CURRENCIES } from '../constants';
import { ConversionRecord } from '../types';

interface CurrencyConverterProps {
  initialAmount?: number;
  initialCurrency?: string;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ initialAmount = 0, initialCurrency = 'USD' }) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [fromCurrency, setFromCurrency] = useState<string>(initialCurrency);
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<ConversionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('procash_conversion_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('procash_conversion_history', JSON.stringify(history));
  }, [history]);

  // Update local state when props change, but only if user hasn't interacted much? 
  // Actually, let's just use props as initial values or if they change significantly.
  // For now, let's just respect initial values on mount.
  
  const handleConvert = async () => {
    if (!amount || !fromCurrency || !toCurrency) return;
    
    setLoading(true);
    try {
      const rates = await currencyService.getRates(fromCurrency);
      const currentRate = rates.rates[toCurrency];
      
      if (currentRate) {
        const convertedAmount = amount * currentRate;
        setResult(convertedAmount);
        setRate(currentRate);
        
        const newRecord: ConversionRecord = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          fromCurrency,
          toCurrency,
          amount,
          result: convertedAmount,
          rate: currentRate
        };
        
        setHistory(prev => [newRecord, ...prev].slice(0, 10)); // Keep last 10
      }
    } catch (error) {
      console.error('Conversion failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-lg">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
        Quick Converter
        <div className="h-px flex-1 bg-slate-100"></div>
      </h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Amount</label>
             <input 
               type="number" 
               value={amount}
               onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
             />
           </div>
           <div className="space-y-1">
             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">From</label>
             <select 
               value={fromCurrency}
               onChange={(e) => setFromCurrency(e.target.value)}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
             >
               {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
             </select>
           </div>
        </div>

        <div className="flex justify-center -my-2 relative z-10">
          <button 
            onClick={() => {
                const temp = fromCurrency;
                setFromCurrency(toCurrency);
                setToCurrency(temp);
            }}
            className="bg-white border border-slate-200 p-1.5 rounded-full shadow-sm hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
           <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">To</label>
           <select 
             value={toCurrency}
             onChange={(e) => setToCurrency(e.target.value)}
             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
           >
             {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
           </select>
        </div>

        <button 
          onClick={handleConvert}
          disabled={loading || amount <= 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
        >
          {loading ? 'Converting...' : 'Convert'}
        </button>

        {result !== null && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
            <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Result</span>
            <div className="text-2xl font-black text-indigo-900 font-mono">
              {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm text-indigo-400">{toCurrency}</span>
            </div>
            <div className="text-[9px] font-mono text-indigo-400 mt-1">
              1 {fromCurrency} = {rate?.toFixed(4)} {toCurrency}
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-3">
             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recent</h4>
             <button onClick={() => setHistory([])} className="text-[9px] text-slate-400 hover:text-red-500 transition-colors">Clear</button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
            {history.map(rec => (
              <div key={rec.id} className="flex justify-between items-center text-xs p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700">{rec.amount} {rec.fromCurrency} → {rec.toCurrency}</span>
                  <span className="text-[9px] text-slate-400">{new Date(rec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <span className="font-mono font-bold text-slate-600">{rec.result.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyConverter;
