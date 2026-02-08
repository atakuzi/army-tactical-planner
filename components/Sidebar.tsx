
import React from 'react';
import { PlanningPhase } from '../types';

interface SidebarProps {
  activePhase: PlanningPhase;
  onPhaseChange: (phase: PlanningPhase) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePhase, onPhaseChange }) => {
  const menuItems = [
    { id: PlanningPhase.DOCTRINE_EXPLORER, label: 'Doctrine', icon: '📚' },
    { id: PlanningPhase.MISSION_ANALYSIS, label: 'Planner', icon: '🗺️' },
    { id: PlanningPhase.OPORD_GEN, label: 'Repository', icon: '📝' },
  ];

  return (
    <div className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-700 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-green-900/40">A</div>
          <h1 className="text-lg font-bold tracking-tight">ARMY<span className="text-green-600">.PLANNER</span></h1>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Tactical Suite</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPhaseChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-[0.98] ${
              activePhase === item.id 
                ? 'bg-green-800/20 text-green-400 border border-green-800/50 shadow-inner' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1">
            <span className="font-bold tracking-widest">ENCRYPTION</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <p className="text-[8px] text-slate-700 uppercase font-mono truncate">AES-256 Link Active</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
