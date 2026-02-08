
import React from 'react';
import { PlanningPhase } from '../types';

interface HeaderProps {
  activePhase: PlanningPhase;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ activePhase, onToggleSidebar }) => {
  const getPhaseName = () => {
    switch (activePhase) {
      case PlanningPhase.DOCTRINE_EXPLORER: return 'Doctrine Repository';
      case PlanningPhase.MISSION_ANALYSIS: return 'MDMP Step 2: Mission Analysis';
      case PlanningPhase.COA_DEV: return 'MDMP Step 3: COA Development';
      case PlanningPhase.COA_ANALYSIS: return 'MDMP Step 4: COA Analysis (Wargaming)';
      case PlanningPhase.COA_COMPARISON: return 'MDMP Step 5: COA Comparison';
      case PlanningPhase.COA_APPROVAL: return 'MDMP Step 6: COA Approval';
      case PlanningPhase.OPORD_GEN: return 'MDMP Step 7: Orders Production';
      default: return 'Tactical Planning';
    }
  };

  return (
    <header className="h-14 md:h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center space-x-3 md:space-x-4 overflow-hidden">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <div className="h-2 w-2 rounded-full bg-green-500 shrink-0"></div>
        <h2 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-slate-300 truncate">
          {getPhaseName()}
        </h2>
      </div>
      
      <div className="flex items-center space-x-4 md:space-x-6 text-[9px] md:text-xs text-slate-500 uppercase font-mono overflow-hidden">
        <div className="hidden sm:flex flex-col items-end whitespace-nowrap">
          <span>DTG: {new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}Z</span>
          <span className="text-slate-600">UNCLASSIFIED</span>
        </div>
        <div className="sm:hidden flex items-center">
          <span className="text-slate-600">UNCLASSIFIED</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
