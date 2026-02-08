
import React, { useState, useEffect } from 'react';
import { PlanningPhase, MissionData, COA } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DoctrineExplorer from './components/DoctrineExplorer';
import MissionPlanner from './components/MissionPlanner';
import OPORDDisplay from './components/OPORDDisplay';

const App: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState<PlanningPhase>(PlanningPhase.DOCTRINE_EXPLORER);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snippetForPlanning, setSnippetForPlanning] = useState<string | null>(null);
  const [missionData, setMissionData] = useState<MissionData>({
    missionName: '',
    operationType: 'Offensive Operations',
    areaOfOperations: '',
    enemyForce: '',
    friendlyForce: '',
    commanderIntent: '',
    coas: [],
    sustainmentLogistics: '',
    sustainmentPersonnel: '',
    sustainmentMedical: ''
  });
  const [opord, setOpord] = useState<any | null>(null);

  const handleUseSnippet = (snippet: string) => {
    setSnippetForPlanning(snippet);
    setCurrentPhase(PlanningPhase.MISSION_ANALYSIS);
    setSidebarOpen(false);
  };

  const handlePhaseChange = (phase: PlanningPhase) => {
    setCurrentPhase(phase);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (currentPhase) {
      case PlanningPhase.DOCTRINE_EXPLORER:
        return <DoctrineExplorer onSelectSnippet={handleUseSnippet} />;
      case PlanningPhase.MISSION_ANALYSIS:
      case PlanningPhase.COA_DEV:
      case PlanningPhase.COA_ANALYSIS:
      case PlanningPhase.COA_COMPARISON:
      case PlanningPhase.COA_APPROVAL:
      case PlanningPhase.OPORD_GEN: // Use Planner for the multi-step process
        return (
          <MissionPlanner 
            data={missionData} 
            updateData={setMissionData} 
            activeSnippet={snippetForPlanning}
            onConsumeSnippet={() => setSnippetForPlanning(null)}
            onGenerate={(generatedOpord) => {
              setOpord(generatedOpord);
              // After generation, explicitly move to display phase
              setCurrentPhase(PlanningPhase.OPORD_GEN); 
            }} 
          />
        );
      default:
        // When phase is specifically OPORD_GEN and opord exists, show the display
        if (currentPhase === PlanningPhase.OPORD_GEN && opord) {
          return <OPORDDisplay opord={opord} />;
        }
        return <DoctrineExplorer onSelectSnippet={handleUseSnippet} />;
    }
  };

  // Special handling to allow returning to the planner if opord is cleared or specifically requested
  const actualContent = (currentPhase === PlanningPhase.OPORD_GEN && opord) 
    ? <OPORDDisplay opord={opord} /> 
    : renderContent();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 relative">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 transform 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar activePhase={currentPhase} onPhaseChange={handlePhaseChange} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header activePhase={currentPhase} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        {snippetForPlanning && (
          <div className="bg-green-900/40 border-b border-green-800/50 px-4 md:px-6 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300 sticky top-0 z-30">
            <div className="flex items-center space-x-3 overflow-hidden">
              <span className="bg-green-600 text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded text-white whitespace-nowrap">STAGED SNIPPET</span>
              <p className="text-[10px] md:text-xs text-green-200 truncate italic">"{snippetForPlanning.substring(0, 100)}..."</p>
            </div>
            <button 
              onClick={() => setSnippetForPlanning(null)}
              className="text-green-400 hover:text-green-200 text-[10px] md:text-xs font-bold uppercase ml-4 whitespace-nowrap"
            >Clear</button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto w-full h-full">
            {actualContent}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
