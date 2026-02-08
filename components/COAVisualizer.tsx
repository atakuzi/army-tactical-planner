
import React from 'react';
import { UnitTask } from '../types';

interface COAVisualizerProps {
  scheme: string;
  objective?: string;
  tasks?: string;
  unitTasks?: UnitTask[];
  branches?: string;
  summary?: string;
  riskMitigation?: string;
}

const COAVisualizer: React.FC<COAVisualizerProps> = ({ 
  scheme, 
  objective, 
  tasks, 
  unitTasks, 
  branches, 
  summary,
  riskMitigation 
}) => {
  // Simple parser for phases
  const getPhases = (text: string) => {
    if (!text) return [];
    const phases = text.split(/(Phase\s+[I|V|X|\d]+|PHASE\s+[I|V|X|\d]+|Phase\s+\d+|[Pp]hase\s+\d+)/g);
    const result: { title: string; content: string }[] = [];
    
    let currentTitle = "Phase I: Initiation";
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i].trim();
      if (!p) continue;
      if (p.toLowerCase().startsWith('phase')) {
        currentTitle = p;
      } else {
        result.push({ title: currentTitle, content: p.replace(/^[:\-\s]+/, '') });
      }
    }
    return result.length > 0 ? result : [{ title: "Main Maneuver", content: text }];
  };

  const phases = getPhases(scheme);
  const riskLines = riskMitigation?.split('\n').filter(l => l.trim().length > 0) || [];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 font-mono text-[10px] space-y-4 shadow-inner h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2 shrink-0">
        <span className="text-green-500 font-bold uppercase tracking-widest">Tactical Visualization</span>
        <span className="text-slate-600">FM 6-0 COMPLIANT</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {/* High-Level AI Summary - PROMINENT AT TOP */}
        {summary && (
          <div className="bg-green-950/40 border border-green-600/50 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500 shadow-lg shadow-green-900/20 border-l-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-[9px] bg-green-600 text-white px-2.5 py-1 rounded-md font-black uppercase tracking-widest">AI TACTICAL SUMMARY</span>
              <div className="h-px flex-1 bg-green-800/30"></div>
            </div>
            <p className="text-[11px] text-green-100 font-serif italic leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        )}

        {/* Tactical Objective */}
        {objective && (
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg border-l-4 border-l-amber-600">
            <div className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Decisive Objective</div>
            <p className="text-[10px] text-slate-100 font-bold leading-tight">
              {objective}
            </p>
          </div>
        )}

        {/* Maneuver Flowchart */}
        <div className="space-y-3">
          <div className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Scheme of Maneuver Flow</div>
          {phases.map((p, idx) => (
            <div key={idx} className="relative pl-6 border-l-2 border-green-900/50 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-green-600 flex items-center justify-center text-[8px] font-bold text-green-500">
                {idx + 1}
              </div>
              <div className="bg-slate-950/50 border border-slate-800 p-2 rounded">
                <div className="text-green-400 font-bold uppercase mb-1">{p.title}</div>
                <div className="text-slate-400 line-clamp-3 italic leading-snug">{p.content || "Awaiting maneuver description..."}</div>
              </div>
              {idx < phases.length - 1 && (
                <div className="h-4 flex items-center justify-center -mb-2 mt-1">
                  <div className="text-green-900/40">▼</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Structured Unit Assignment Grid */}
        {unitTasks && unitTasks.length > 0 && (
          <div className="mt-6">
            <div className="text-slate-500 font-bold uppercase mb-2 text-[9px] tracking-widest">Unit Assignments</div>
            <div className="grid grid-cols-1 gap-1.5">
              {unitTasks.map((ut) => (
                <div key={ut.id} className="bg-slate-800/40 p-2 rounded border border-slate-700/50 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-green-500 font-bold">⊛ {ut.unit || 'UNASSIGNED'}</span>
                    <span className="bg-green-900/40 text-green-400 px-1.5 rounded text-[8px] border border-green-800/30 font-black uppercase">{ut.task}</span>
                  </div>
                  {ut.purpose && (
                    <p className="text-[9px] text-slate-500 italic truncate ml-3">{ut.purpose}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Mitigation Section */}
        {riskLines.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-cyan-500 font-bold uppercase mb-2 text-[9px] flex items-center space-x-2">
              <span className="text-xs">🛡️</span>
              <span>ATP 5-19 Risk Assessment</span>
            </div>
            <div className="space-y-1.5 pl-4 border-l border-cyan-900/30">
              {riskLines.map((line, idx) => (
                <div key={idx} className={`text-slate-400 text-[9px] leading-tight ${line.startsWith('RISK:') || line.startsWith('HAZARD:') ? 'font-bold text-slate-200 mt-2' : 'italic text-slate-400'}`}>
                  {line.startsWith('•') || line.startsWith('-') ? line : `• ${line}`}
                </div>
              ))}
            </div>
          </div>
        )}

        {!scheme && !objective && (!unitTasks || unitTasks.length === 0) && !summary && (
          <div className="h-32 flex flex-col items-center justify-center text-slate-700 text-center uppercase tracking-tighter italic">
            <p>Awaiting COA Input</p>
            <p className="text-[8px]">Visualization will populate as you draft</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default COAVisualizer;
