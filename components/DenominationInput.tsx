
import React from 'react';
import { Denomination } from '../types';

interface Props {
  denom: Denomination;
  count: number;
  symbol: string;
  onChange: (value: number) => void;
}

const DenominationInput: React.FC<Props> = ({ denom, count, symbol, onChange }) => {
  const subtotal = count * denom.value;
  const isSelected = count > 0;

  return (
    <div className={`relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${
      isSelected 
        ? 'bg-white border-indigo-500 shadow-lg shadow-indigo-100 ring-1 ring-indigo-500/20' 
        : 'bg-white/80 border-slate-200 hover:border-indigo-300 hover:shadow-md'
    }`}>
      {/* Decorative background pattern for bills */}
      {denom.type === 'bill' && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none currency-pattern"></div>
      )}

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-20 flex justify-center">
          <div className={`flex-shrink-0 shadow-md transition-transform group-hover:scale-105 overflow-hidden relative ${
            denom.type === 'bill' ? 'w-20 h-10 rounded-md' : 'w-12 h-12 rounded-full'
          }`}>
            {denom.image ? (
              <img 
                key={denom.image}
                src={denom.image} 
                alt={denom.label} 
                className="w-full h-full object-cover absolute inset-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('fallback-bg');
                }}
              />
            ) : null}
            
            {/* Fallback content that shows if image fails or is missing */}
            <div className={`w-full h-full flex flex-col items-center justify-center font-bold text-xs ${
              denom.type === 'bill' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              <span className="text-[10px] opacity-60 uppercase">{denom.type}</span>
              <span className="text-lg">{denom.label}</span>
            </div>
          </div>
        </div>
        <div>
          <span className="block text-slate-900 font-bold text-base">{denom.label} <span className="text-slate-400 font-normal text-xs ml-1">Notes</span></span>
          <span className="block text-slate-500 font-mono text-xs">{symbol}{denom.value.toFixed(2)} unit</span>
        </div>
      </div>

      <div className="flex items-center gap-6 relative z-10">
        <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => onChange(Math.max(0, count - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
          </button>
          <input
            type="number"
            value={count === 0 ? '' : count}
            placeholder="0"
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className="w-14 bg-transparent text-center font-mono font-bold text-slate-800 focus:outline-none placeholder:text-slate-300"
          />
          <button 
            onClick={() => onChange(count + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        
        <div className="w-28 text-right">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Subtotal</div>
          <div className={`font-mono font-bold text-lg transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
            {symbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DenominationInput;
