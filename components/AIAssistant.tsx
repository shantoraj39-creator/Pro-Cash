
import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { geminiService } from '../services/geminiService';
import { ChatMessage, AIServiceMode, Denomination } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../services/audioUtils';

interface Props {
  denominations: Denomination[];
  onCommand: (command: { action: string; label?: string; count?: number }) => void;
  onLiveStateChange?: (isActive: boolean) => void;
}

export interface AIAssistantRef {
  toggleLive: () => Promise<void>;
  isLiveActive: boolean;
}

const AIAssistant = forwardRef<AIAssistantRef, Props>(({ denominations, onCommand, onLiveStateChange }, ref) => {
  const [mode, setMode] = useState<AIServiceMode>(AIServiceMode.CHAT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isDictating, setIsDictating] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const dictationSessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);

  const updateLiveState = (active: boolean) => {
    setIsLiveActive(active);
    onLiveStateChange?.(active);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      if (mode === AIServiceMode.SEARCH) {
        const result = await geminiService.searchMarket(input);
        setMessages(prev => [...prev, { role: 'model', content: result.text, sources: result.sources }]);
      } else {
        const text = await geminiService.chat(input, useThinking);
        setMessages(prev => [...prev, { role: 'model', content: text || '', isThinking: useThinking }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResult = async (text: string) => {
    try {
      const base64Audio = await geminiService.generateSpeech(text);
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (e) { console.error(e); }
  };

  const toggleDictation = async () => {
    if (isDictating) {
      dictationSessionRef.current?.close();
      setIsDictating(false);
      return;
    }

    setIsDictating(true);
    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = geminiService.connectLive({
        onopen: () => {
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e: any) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);
            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onmessage: (message: any) => {
          if (message.serverContent?.inputTranscription) {
            const transcript = message.serverContent.inputTranscription.text;
            setInput(prev => prev.trim() + " " + transcript);
          }
        },
        onerror: () => setIsDictating(false),
        onclose: () => setIsDictating(false)
      }, []);
      
      dictationSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Dictation error", err);
      setIsDictating(false);
    }
  };

  const toggleLive = async () => {
    if (isLiveActive) {
      liveSessionRef.current?.close();
      updateLiveState(false);
      return;
    }

    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = geminiService.connectLive({
        onopen: () => {
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e: any) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);
            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
          updateLiveState(true);
          setMode(AIServiceMode.LIVE);
        },
        onmessage: async (message: any) => {
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'controlCalculator') {
                onCommand(fc.args);
                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                  });
                });
              }
            }
          }

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
          if (base64Audio) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(source);
          }
          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: () => updateLiveState(false),
        onclose: () => updateLiveState(false)
      }, denominations.map(d => d.label));
      
      liveSessionRef.current = await sessionPromise;
    } catch (err) { 
      console.error(err); 
      updateLiveState(false);
    }
  };

  useImperativeHandle(ref, () => ({
    toggleLive,
    isLiveActive
  }));

  return (
    <div className="flex flex-col h-full bg-slate-50/50 backdrop-blur-md border-l border-slate-200">
      <div className="p-6 border-b border-slate-200 glass">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
            <div className={`relative flex items-center justify-center`}>
              <div className={`absolute inset-0 rounded-full blur-sm ${isLiveActive ? 'bg-red-400 animate-pulse' : 'bg-indigo-400 opacity-50'}`}></div>
              <span className={`relative w-2.5 h-2.5 rounded-full ${isLiveActive ? 'bg-red-500' : 'bg-indigo-600'}`}></span>
            </div>
            {isLiveActive ? 'Live Command' : 'AI Financial Expert'}
          </h3>
          {mode !== AIServiceMode.LIVE && (
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-indigo-600 transition-colors">Thinking</span>
              <input 
                type="checkbox" 
                checked={useThinking} 
                onChange={(e) => setUseThinking(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          )}
        </div>
        <div className="flex gap-1.5 p-1 bg-slate-200/50 rounded-xl">
          {Object.values(AIServiceMode).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest transition-all duration-300 ${
                mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !isLiveActive && (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-200 animate-float">
               <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.527 3.653 1.438 5.16L2 22l4.84-1.438C8.347 21.473 10.109 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.731 0-3.334-.486-4.698-1.328l-.337-.208-2.903.864.864-2.903-.208-.337A7.946 7.946 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
              Pro-Level Financial Intelligence<br/>
              <span className="font-normal normal-case opacity-60">Speak or type your commands.</span>
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-none'
            }`}>
              {m.content}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {m.sources.map((s, si) => (
                    <a key={si} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {m.role === 'model' && (
              <button 
                onClick={() => speakResult(m.content)}
                className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-indigo-500 hover:text-indigo-700 ml-1 uppercase tracking-tighter"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM16.5 12c0-1.77-1.02-3.29-2.5-4.03V16c1.48-.73 2.5-2.25 2.5-4.03zM3 9v6h4l5 5V4L7 9H3z"/></svg>
                Read Aloud
              </button>
            )}
          </div>
        ))}
        {isLiveActive && (
          <div className="flex flex-col items-center justify-center h-full space-y-8 py-10">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse scale-150"></div>
              <div className="relative flex gap-1.5 items-end h-16 w-32 justify-center">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className="w-2 bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s`, height: `${40 + Math.random() * 60}%` }}></div>
                ))}
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Live Voice Sync</p>
              <p className="text-[10px] text-slate-400 font-medium">Say "Add 10 fives" or "Search the Fed rates"</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-200 glass">
        {mode === AIServiceMode.LIVE ? (
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={toggleLive}
              className={`group relative overflow-hidden px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 transition-all duration-500 ${
                isLiveActive 
                  ? 'bg-red-500 text-white shadow-2xl shadow-red-200 ring-4 ring-red-100' 
                  : 'mesh-gradient text-white shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95'
              }`}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg className={`w-5 h-5 ${isLiveActive ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {isLiveActive ? 'Terminate Stream' : 'Activate Live Mode'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isDictating ? "Voice captured. Keep speaking..." : "Query financial records..."}
                  className={`w-full pl-5 pr-12 py-3.5 bg-white border rounded-2xl text-sm font-medium focus:outline-none transition-all shadow-sm ${
                    isDictating 
                      ? 'border-red-300 ring-4 ring-red-50 text-red-900 bg-red-50/30' 
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50'
                  }`}
                />
                <button
                  onClick={toggleDictation}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${
                    isDictating 
                      ? 'text-white bg-red-500 shadow-lg shadow-red-200' 
                      : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
              </div>
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default AIAssistant;
