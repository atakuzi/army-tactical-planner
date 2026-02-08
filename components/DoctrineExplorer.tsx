
import React, { useState, useRef, useEffect } from 'react';
import { getDoctrineResponse } from '../services/gemini';
import { Message } from '../types';
import { ARMY_ADPS } from '../constants';

interface DoctrineExplorerProps {
  onSelectSnippet?: (snippet: string) => void;
}

const SUGGESTED_QUERIES = [
  "Principles of Combined Arms",
  "Warfighting Functions",
  "Mission Command philosophy",
  "Steps of the MDMP",
  "ATP 3-21.8 defense"
];

const DoctrineExplorer: React.FC<DoctrineExplorerProps> = ({ onSelectSnippet }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPubMap, setShowPubMap] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (queryOverride?: string) => {
    const query = queryOverride || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowPubMap(false);
    setLoading(true);

    try {
      const response = await getDoctrineResponse(query, messages.map(m => ({ role: m.role, content: m.content })));
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.text,
        groundingChunks: response.groundingChunks
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "ERROR: Communication link timeout. Please retry query." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      <div className="p-3 md:p-4 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
          <span className="text-[10px] md:text-xs font-bold text-slate-100 uppercase tracking-widest truncate">Doctrine Repository</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowPubMap(!showPubMap)}
            className={`text-[9px] px-2 py-0.5 rounded border font-mono transition-colors ${showPubMap ? 'bg-green-700 text-white border-green-600' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'}`}
          >
            PUB MAP {showPubMap ? '▲' : '▼'}
          </button>
          <span className="hidden sm:inline-block text-[9px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">GND SEARCH v3</span>
        </div>
      </div>

      {/* Publication Map Overlay */}
      {showPubMap && (
        <div className="bg-slate-950 border-b border-slate-800 p-4 max-h-64 overflow-y-auto animate-in slide-in-from-top duration-300">
          <h4 className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em] mb-3">Army Doctrine Publication (ADP) Map</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {ARMY_ADPS.map(adp => (
              <button
                key={adp.id}
                onClick={() => handleSend(`Summarize the core concepts of ${adp.id}: ${adp.title}`)}
                className="flex flex-col text-left p-2 rounded border border-slate-800 hover:bg-slate-900 hover:border-green-800 transition-all group"
              >
                <span className="text-[10px] font-bold text-green-500 group-hover:text-green-400">{adp.id}</span>
                <span className="text-[9px] text-slate-400 truncate">{adp.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scroll-smooth"
      >
        {messages.length === 0 && !showPubMap && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 max-w-lg mx-auto p-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/10 blur-2xl rounded-full"></div>
              <div className="relative w-16 h-16 md:w-20 md:h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-2xl border border-slate-700">📖</div>
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold text-slate-100 mb-2">Army Tactical Planner Doctrine AI</p>
              <p className="text-xs md:text-sm text-slate-400 mb-4 md:mb-6">Access the full breadth of Army doctrine. Search by publication number or conceptual query.</p>
              
              <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                {SUGGESTED_QUERIES.map(q => (
                  <button 
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[9px] md:text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-slate-700 transition-all active:scale-95"
                  >
                    {q}
                  </button>
                ))}
                <button 
                    onClick={() => setShowPubMap(true)}
                    className="text-[9px] md:text-[10px] bg-green-900/20 hover:bg-green-900/40 text-green-400 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-green-800/30 transition-all"
                  >
                    View All ADPs
                  </button>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`w-full sm:max-w-[85%] rounded-2xl px-4 py-3 md:px-5 md:py-4 ${
              msg.role === 'user' 
                ? 'bg-green-700/20 text-green-100 border border-green-700/30 rounded-tr-none' 
                : 'bg-slate-800/80 backdrop-blur-sm text-slate-200 border border-slate-700 rounded-tl-none relative shadow-xl'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div className={`text-[9px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-green-500' : 'text-slate-500'}`}>
                  {msg.role === 'user' ? 'USER' : 'ARMY PLANNER'}
                </div>
                {msg.role === 'assistant' && onSelectSnippet && (
                  <button 
                    onClick={() => onSelectSnippet(msg.content)}
                    className="text-[9px] bg-green-900/40 text-green-400 border border-green-800/50 px-2 py-0.5 rounded hover:bg-green-800 transition-colors uppercase font-bold"
                  >
                    Extract
                  </button>
                )}
              </div>
              
              <div className="prose prose-invert prose-xs md:prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-slate-300 font-serif overflow-hidden">
                {msg.content}
              </div>
              
              {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Sources</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {msg.groundingChunks.map((chunk, cIdx) => chunk.web && (
                      <a 
                        key={cIdx} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col p-2 bg-slate-950/50 hover:bg-slate-950 border border-slate-800 rounded transition-all"
                      >
                        <span className="text-[9px] text-green-500 font-bold truncate">
                          {chunk.web.title}
                        </span>
                        <span className="text-[8px] text-slate-600 truncate opacity-70">
                          {chunk.web.uri}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-2">
              <div className="flex space-x-1 shrink-0">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">Querying...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="relative flex items-center max-w-4xl mx-auto w-full">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Search ADPs, FMs, or Tactical Concepts..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-20 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-600/50 transition-all text-slate-200 shadow-inner"
          />
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="absolute right-1.5 px-4 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-lg active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctrineExplorer;
