
import React, { useState, useEffect } from 'react';
import { MissionData, GroundingChunk, UnitTask, COA } from '../types';
import { OPERATION_TYPES, TACTICAL_TASKS, STANDARD_COMPARISON_CRITERIA, ARMY_UNIT_DESIGNATIONS } from '../constants';
import { generateOPORD, analyzeMETTTC, simulateWargame, compareCOAs, getStepGuidance, generateCOASummary, getSustainmentGuidance, generateMissionStatement, generateRiskAnalysis, refineCommanderIntent, getUnitTaskPurposeGuidance, generateMissionNameSuggestions, generateSustainmentDraft, suggestComparisonCriteria, generateSchemeOfManeuver, generateCommandSignalDraft } from '../services/gemini';
import COAVisualizer from './COAVisualizer';

interface MissionPlannerProps {
  data: MissionData;
  updateData: (data: MissionData) => void;
  onGenerate: (opord: any) => void;
  activeSnippet?: string | null;
  onConsumeSnippet?: () => void;
}

const MissionPlanner: React.FC<MissionPlannerProps> = ({ data, updateData, onGenerate, activeSnippet, onConsumeSnippet }) => {
  const [step, setStep] = useState(1);
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [analyzingRiskId, setAnalyzingRiskId] = useState<string | null>(null);
  const [generatingSchemeId, setGeneratingSchemeId] = useState<string | null>(null);
  const [generatingMission, setGeneratingMission] = useState(false);
  const [generatingSustainment, setGeneratingSustainment] = useState(false);
  const [generatingCmdSignal, setGeneratingCmdSignal] = useState(false);
  const [suggestingCriteria, setSuggestingCriteria] = useState(false);
  const [suggestedCriteriaList, setSuggestedCriteriaList] = useState<string[]>([]);
  const [refiningIntent, setRefiningIntent] = useState(false);
  const [intentRefinement, setRefiningRefinement] = useState<{ refined: string, critique: string, purposeScore: number, tasksScore: number, stateScore: number } | null>(null);
  const [loadingTaskGuidance, setLoadingTaskGuidance] = useState<Record<string, boolean>>({});
  const [taskPurposeSuggestions, setTaskPurposeSuggestions] = useState<Record<string, string[]>>({});
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [grounding, setGrounding] = useState<GroundingChunk[] | undefined>(undefined);
  const [comparisonText, setComparisonText] = useState<string | null>(null);
  const [fieldGuidance, setFieldGuidance] = useState<Record<string, string>>({});
  const [guidingField, setGuidingField] = useState<string | null>(null);
  
  const [suggestingMissionName, setSuggestingMissionName] = useState(false);
  const [missionNameSuggestions, setMissionNameSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!data.coas || data.coas.length === 0) {
      const initialCOA: COA = {
        id: Math.random().toString(36).substring(7),
        name: 'COA 1 (Main Effort)',
        objective: '',
        scheme: '',
        unitTasks: [],
        riskMitigation: ''
      };
      updateData({ ...data, coas: [initialCOA] });
    }
    
    if (!data.comparisonCriteria || data.comparisonCriteria.length === 0) {
      updateData({ ...data, comparisonCriteria: [...STANDARD_COMPARISON_CRITERIA] });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    updateData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSuggestMissionNames = async () => {
    setSuggestingMissionName(true);
    try {
      const suggestions = await generateMissionNameSuggestions(data);
      setMissionNameSuggestions(suggestions);
    } catch (e) {
      console.error("Failed to get mission name suggestions");
    } finally {
      setSuggestingMissionName(false);
    }
  };

  const handleSuggestCriteria = async () => {
    setSuggestingCriteria(true);
    try {
      const suggestions = await suggestComparisonCriteria(data);
      setSuggestedCriteriaList(suggestions);
    } catch (e) {
      console.error("Failed to suggest comparison criteria");
    } finally {
      setSuggestingCriteria(false);
    }
  };

  const acceptCriterion = (crit: string) => {
    if (!data.comparisonCriteria?.includes(crit)) {
      updateData({ ...data, comparisonCriteria: [...(data.comparisonCriteria || []), crit] });
    }
    setSuggestedCriteriaList(prev => prev.filter(c => c !== crit));
  };

  const handleGenerateSustainment = async () => {
    setGeneratingSustainment(true);
    try {
      const draft = await generateSustainmentDraft(data);
      updateData({ 
        ...data, 
        sustainmentLogistics: draft.logistics,
        sustainmentPersonnel: draft.personnel,
        sustainmentMedical: draft.medical
      });
    } catch (e) {
      console.error("Failed to generate sustainment draft");
    } finally {
      setGeneratingSustainment(false);
    }
  };

  const handleGenerateCmdSignal = async () => {
    setGeneratingCmdSignal(true);
    try {
      const draft = await generateCommandSignalDraft(data);
      updateData({ 
        ...data, 
        commandLocation: draft.command,
        successionOfCommand: `Succession of Command:\n${draft.command}\n\n${draft.signal}`, // merging logic if needed
        signalPacePlan: draft.pace,
        callSigns: draft.callsigns
      });
    } catch (e) {
      console.error("Failed to generate command/signal draft");
    } finally {
      setGeneratingCmdSignal(false);
    }
  };

  const handleGenerateScheme = async (coa: COA) => {
    if (!coa.objective) {
      alert("Please provide a Decisive Objective before generating a scheme.");
      return;
    }
    setGeneratingSchemeId(coa.id);
    try {
      const scheme = await generateSchemeOfManeuver(data, coa);
      updateCOA(coa.id, { scheme });
    } catch (e) {
      console.error("Failed to generate scheme of maneuver", e);
    } finally {
      setGeneratingSchemeId(null);
    }
  };

  const handleRefineIntent = async () => {
    setRefiningIntent(true);
    try {
      const result = await refineCommanderIntent(data);
      setRefiningRefinement(result);
    } catch (e) {
      console.error("Intent refinement failed");
    } finally {
      setRefiningIntent(false);
    }
  };

  const applyRefinedIntent = () => {
    if (intentRefinement) {
      updateData({ ...data, commanderIntent: intentRefinement.refined });
      setRefiningRefinement(null);
    }
  };

  const fetchGuidance = async (fieldName: string) => {
    setGuidingField(fieldName);
    try {
      const guidance = await getStepGuidance(fieldName, data);
      setFieldGuidance(prev => ({ ...prev, [fieldName]: guidance }));
    } catch (e) {
      setFieldGuidance(prev => ({ ...prev, [fieldName]: "Focus on doctrinal definitions." }));
    } finally {
      setGuidingField(null);
    }
  };

  const fetchTaskPurposeGuidance = async (coa: COA, task: UnitTask) => {
    if (!task.unit || !task.task) {
      alert("Specify Unit and Task before requesting Purpose guidance.");
      return;
    }
    setLoadingTaskGuidance(prev => ({ ...prev, [task.id]: true }));
    try {
      const suggestions = await getUnitTaskPurposeGuidance(data, coa, task);
      setTaskPurposeSuggestions(prev => ({ ...prev, [task.id]: suggestions }));
    } finally {
      setLoadingTaskGuidance(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const selectTaskPurpose = (coaId: string, taskId: string, purpose: string) => {
    updateUnitTask(coaId, taskId, { purpose });
    setTaskPurposeSuggestions(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const fetchSustainmentGuidance = async (category: 'Logistics' | 'Personnel' | 'Medical') => {
    setGuidingField(`sustainment${category}`);
    try {
      const guidance = await getSustainmentGuidance(category, data);
      setFieldGuidance(prev => ({ ...prev, [`sustainment${category}`]: guidance }));
    } finally {
      setGuidingField(null);
    }
  };

  const handleGenerateMission = async () => {
    setGeneratingMission(true);
    try {
      const statement = await generateMissionStatement(data);
      updateData({ ...data, missionStatement: statement });
    } finally {
      setGeneratingMission(false);
    }
  };

  const handleSummarizeCOA = async (coa: COA) => {
    setSummarizingId(coa.id);
    try {
      const summary = await generateCOASummary(coa);
      updateCOA(coa.id, { coaSummary: summary });
    } catch (e) {
      console.error("Failed to generate COA summary", e);
    } finally {
      setSummarizingId(null);
    }
  };

  const handleAnalyzeRisk = async (coa: COA) => {
    setAnalyzingRiskId(coa.id);
    try {
      const result = await generateRiskAnalysis(coa, data);
      updateCOA(coa.id, { riskMitigation: result });
    } catch (e) {
      console.error("Failed to analyze risk", e);
    } finally {
      setAnalyzingRiskId(null);
    }
  };

  const handleRunWargame = async (coa: COA) => {
    setSimulatingId(coa.id);
    try {
      const res = await simulateWargame(data, coa);
      const currentLog = coa.wargameResults ? coa.wargameResults + "\n\n--- NEXT CYCLE ---\n\n" : "";
      updateCOA(coa.id, { 
        wargameResults: currentLog + res,
        wargameInputEnemyAction: '',
        wargameInputFriendlyReaction: '' 
      });
    } catch (e) {
      console.error("Wargame failed", e);
    } finally {
      setSimulatingId(null);
    }
  };

  const updateCOA = (id: string, updates: Partial<COA>) => {
    updateData({ ...data, coas: data.coas.map(c => c.id === id ? { ...c, ...updates } : c) });
  };

  const addCOA = () => {
    const nextNum = data.coas.length + 1;
    const newCOA: COA = {
      id: Math.random().toString(36).substring(7),
      name: `COA ${nextNum} (${nextNum === 2 ? 'Supporting Effort' : 'Alternative'})`,
      objective: '',
      scheme: '',
      unitTasks: [],
      riskMitigation: ''
    };
    updateData({ ...data, coas: [...data.coas, newCOA] });
  };

  const addUnitTask = (coaId: string) => {
    const coa = data.coas.find(c => c.id === coaId);
    if (coa) {
      const newTask: UnitTask = {
        id: Math.random().toString(36).substring(7),
        unit: '',
        task: '',
        purpose: ''
      };
      updateCOA(coaId, { unitTasks: [...(coa.unitTasks || []), newTask] });
    }
  };

  const updateUnitTask = (coaId: string, taskId: string, updates: Partial<UnitTask>) => {
    const coa = data.coas.find(c => c.id === coaId);
    if (coa) {
      updateCOA(coaId, {
        unitTasks: coa.unitTasks.map(ut => ut.id === taskId ? { ...ut, ...updates } : ut)
      });
    }
  };

  const removeUnitTask = (coaId: string, taskId: string) => {
    const coa = data.coas.find(c => c.id === coaId);
    if (coa) {
      updateCOA(coaId, {
        unitTasks: coa.unitTasks.filter(ut => ut.id !== taskId)
      });
    }
  };

  const handleAddCriterion = () => {
    const newCriteria = [...(data.comparisonCriteria || []), "New Criterion"];
    updateData({ ...data, comparisonCriteria: newCriteria });
  };

  const handleRemoveCriterion = (index: number) => {
    const newCriteria = (data.comparisonCriteria || []).filter((_, i) => i !== index);
    updateData({ ...data, comparisonCriteria: newCriteria });
  };

  const handleUpdateCriterion = (index: number, value: string) => {
    const newCriteria = [...(data.comparisonCriteria || [])];
    newCriteria[index] = value;
    updateData({ ...data, comparisonCriteria: newCriteria });
  };

  const nextStep = async () => {
    if (showReview) {
      setShowReview(false);
      return;
    }

    setLoading(true);
    try {
      if (step === 1) {
        const res = await analyzeMETTTC(data);
        setAnalysis(res.text);
        setGrounding(res.groundingChunks);
        if (res.drafts) {
          updateData({
            ...data,
            essentialTasks: res.drafts.essentialTasks || data.essentialTasks,
            assumptions: res.drafts.assumptions || data.assumptions,
            missionStatement: res.drafts.mission || data.missionStatement,
            constraints: res.drafts.constraints || data.constraints,
            ccir: res.drafts.ccir || data.ccir
          });
        }
        setStep(2);
      } else if (step === 2) setStep(3);
      else if (step === 3) setStep(4);
      else if (step === 4) {
        const res = await compareCOAs(data, data.comparisonCriteria || STANDARD_COMPARISON_CRITERIA);
        setComparisonText(res);
        setStep(5);
      } else if (step === 5) setStep(6);
      else if (step === 6) setStep(7);
      else if (step === 7) {
        const opord = await generateOPORD(data);
        onGenerate(opord);
      }
    } catch (e) {
      alert("Execution failed. Verify API configuration.");
    } finally {
      setLoading(false);
    }
  };

  const jumpToStep = (s: number) => {
    if (loading) return;
    setStep(s);
    setShowReview(false);
  };

  const GuidanceIcon = ({ field }: { field: string }) => (
    <button 
      onClick={() => field.startsWith('sustainment') ? fetchSustainmentGuidance(field.replace('sustainment', '') as any) : fetchGuidance(field)}
      className="ml-2 text-green-600 hover:text-green-400"
    >
      {guidingField === field ? <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div> : <span className="text-[10px] bg-green-900/20 px-1 py-0.5 rounded font-bold uppercase">AI</span>}
    </button>
  );

  const ReviewSection = ({ title, children, editStep }: { title: string, children?: React.ReactNode, editStep: number }) => (
    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 relative group mb-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{title}</h4>
        <button 
          onClick={() => jumpToStep(editStep)}
          className="text-[10px] text-green-500 hover:text-green-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase"
        >
          [ Edit Section ]
        </button>
      </div>
      <div className="text-sm text-slate-300 space-y-2">{children}</div>
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col min-h-[600px] overflow-hidden shadow-2xl">
      <datalist id="army-units">
        {ARMY_UNIT_DESIGNATIONS.map(unit => <option key={unit} value={unit} />)}
      </datalist>
      <datalist id="tactical-tasks">
        {TACTICAL_TASKS.map(task => <option key={task} value={task} />)}
      </datalist>

      <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-800/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-100 uppercase tracking-widest flex items-center">
            <span className="bg-green-700 text-white px-2 py-0.5 rounded text-xs mr-3">MDMP</span>
            {showReview ? 'MISSION REVIEW' : `STEP ${step}: ${
              step === 1 ? 'Receipt of Mission' : 
              step === 2 ? 'Mission Analysis' :
              step === 3 ? 'COA Development' :
              step === 4 ? 'COA Analysis' :
              step === 5 ? 'COA Comparison' :
              step === 6 ? 'COA Approval' : 'Orders Production'
            }`}
          </h3>
          <button 
            onClick={() => setShowReview(!showReview)}
            className={`text-[10px] font-black tracking-widest px-4 py-1.5 rounded-lg border transition-all ${showReview ? 'bg-green-600 text-white border-green-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'}`}
          >
            {showReview ? 'CLOSE REVIEW' : 'REVIEW SUMMARY'}
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mt-6">
          {[1,2,3,4,5,6,7].map(s => (
            <button 
              key={s} 
              onClick={() => jumpToStep(s)}
              disabled={loading}
              className={`h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-green-600' : 'bg-slate-700'} ${loading ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-green-500/50'}`}
              title={`Jump to Step ${s}`}
            />
          ))}
        </div>
      </div>

      <div className="p-4 md:p-8 flex-1 overflow-y-auto">
        {showReview ? (
          <div className="max-w-4xl mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black uppercase tracking-[0.3em] text-slate-100">{data.missionName || 'UNNAMED OPERATION'}</h2>
              <p className="text-xs text-slate-500 mt-2 font-mono uppercase">Consolidated Tactical Review // DTG: {new Date().toISOString()}</p>
            </div>
            
            <ReviewSection title="Mission Statement" editStep={2}>
              <p className="font-bold text-slate-100 italic">{data.missionStatement || "Mission statement not finalized."}</p>
            </ReviewSection>

            <ReviewSection title="Commander's Intent & Guidance" editStep={1}>
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Commander's Intent</span>
                  <p className="whitespace-pre-wrap font-serif text-slate-200 leading-relaxed italic">{data.commanderIntent || "N/A"}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Priorities</span>
                    <p className="text-[11px] text-slate-400">{data.commanderPriorities || "None listed."}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Constraints</span>
                    <p className="text-[11px] text-slate-400">{data.commanderConstraints || "None listed."}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Expectations</span>
                    <p className="text-[11px] text-slate-400">{data.commanderExpectations || "None listed."}</p>
                  </div>
                </div>
              </div>
            </ReviewSection>

            <ReviewSection title="Sustainment Plan (Para 4)" editStep={7}>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Logistics</span>
                    <p className="text-[11px] text-slate-400 line-clamp-4">{data.sustainmentLogistics || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Personnel</span>
                    <p className="text-[11px] text-slate-400 line-clamp-4">{data.sustainmentPersonnel || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Medical</span>
                    <p className="text-[11px] text-slate-400 line-clamp-4">{data.sustainmentMedical || "N/A"}</p>
                  </div>
               </div>
            </ReviewSection>

            <ReviewSection title="Command & Signal (Para 5)" editStep={7}>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Command Location & Succession</span>
                    <p className="text-[11px] text-slate-400">{data.commandLocation || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">PACE Plan & Call Signs</span>
                    <p className="text-[11px] text-slate-400">{data.signalPacePlan || "N/A"}</p>
                  </div>
               </div>
            </ReviewSection>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">General Context</span>
                      <div className="h-px flex-1 bg-slate-800 ml-4"></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mission Name</span>
                        <button 
                          onClick={handleSuggestMissionNames}
                          disabled={suggestingMissionName}
                          className="text-[9px] bg-green-900/40 text-green-400 px-2 py-0.5 rounded font-black uppercase tracking-widest hover:bg-green-800/60 transition-colors flex items-center"
                        >
                          {suggestingMissionName ? <div className="w-2 h-2 border border-green-400 border-t-transparent rounded-full animate-spin mr-1"></div> : '⚡ SUGGEST'}
                        </button>
                      </div>
                      <input name="missionName" value={data.missionName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-sm focus:border-green-600 outline-none transition-all" placeholder="OP IRON SWORD" />
                    </div>

                    <label className="block">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enemy Disposition</span>
                      <textarea name="enemyForce" value={data.enemyForce} onChange={handleChange} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-sm mt-1 focus:border-green-600 outline-none" placeholder="Enemy composition, strength, and likely COA..." />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Friendly Forces</span>
                      <textarea name="friendlyForce" value={data.friendlyForce} onChange={handleChange} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-sm mt-1 focus:border-green-600 outline-none" placeholder="Adjacent units and Higher HQ intent..." />
                    </label>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Commander's Initial Guidance</span>
                      <div className="h-px flex-1 bg-slate-800 ml-4"></div>
                    </div>
                    
                    {/* Commander's Intent Box */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-1 shadow-inner relative">
                      <div className="flex items-center justify-between bg-slate-900 px-3 py-2 border-b border-slate-800">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Commander's Intent</span>
                         <div className="flex space-x-2">
                            <button onClick={handleRefineIntent} disabled={refiningIntent} className="text-[9px] text-green-400 hover:text-green-300 font-black uppercase transition-all flex items-center">
                              {refiningIntent ? <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-1"></div> : '⚡ AI REFINE'}
                            </button>
                            <GuidanceIcon field="commanderIntent" />
                         </div>
                      </div>
                      <textarea name="commanderIntent" value={data.commanderIntent} onChange={handleChange} rows={6} className="w-full bg-transparent border-none p-4 text-sm font-serif leading-relaxed focus:ring-0 outline-none text-slate-200 placeholder:text-slate-700" placeholder="PURPOSE: Why are we doing this?&#10;KEY TASKS: What critical tasks link purpose to end state?&#10;END STATE: What does success look like (Terrain, Enemy, Civil)?" />
                      
                      {/* Intent Refinement Scorecard Display */}
                      {intentRefinement && (
                        <div className="absolute inset-0 bg-slate-900/95 z-40 p-4 md:p-6 flex flex-col animate-in fade-in zoom-in duration-300 overflow-y-auto custom-scrollbar">
                           <div className="flex justify-between items-center mb-4 shrink-0">
                              <h5 className="text-[11px] font-black text-green-500 uppercase tracking-[0.2em]">Commander's Intent Scorecard</h5>
                              <button onClick={() => setRefiningRefinement(null)} className="text-slate-500 hover:text-white text-lg">×</button>
                           </div>
                           
                           <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
                              {[
                                { label: 'Purpose', score: intentRefinement.purposeScore },
                                { label: 'Key Tasks', score: intentRefinement.tasksScore },
                                { label: 'End State', score: intentRefinement.stateScore }
                              ].map(s => (
                                <div key={s.label} className="text-center space-y-1">
                                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{s.label}</div>
                                  <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`absolute inset-y-0 left-0 transition-all duration-1000 ${s.score > 7 ? 'bg-green-500' : s.score > 4 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                      style={{ width: `${s.score * 10}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-300">{s.score}/10</div>
                                </div>
                              ))}
                           </div>

                           <div className="space-y-4 mb-6">
                              <div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Critique</span>
                                <p className="text-[10px] text-slate-400 italic leading-relaxed">{intentRefinement.critique}</p>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1 block">Refined Draft</span>
                                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-serif italic text-slate-300 leading-relaxed whitespace-pre-wrap">
                                  {intentRefinement.refined}
                                </div>
                              </div>
                           </div>

                           <div className="mt-auto pt-4 border-t border-slate-800 flex space-x-3 shrink-0">
                              <button onClick={() => setRefiningRefinement(null)} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest rounded transition-all">Cancel</button>
                              <button onClick={applyRefinedIntent} className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-600 text-[10px] font-black uppercase tracking-widest rounded shadow-lg transition-all">Apply Refinement</button>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Specific Guidance Fields */}
                    <div className="grid grid-cols-1 gap-4">
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commander's Priorities</span>
                        <textarea name="commanderPriorities" value={data.commanderPriorities || ''} onChange={handleChange} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs mt-1 outline-none focus:border-green-600 transition-all" placeholder="Key tactical priorities (e.g. speed, security, civilians)..." />
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commander's Constraints</span>
                          <textarea name="commanderConstraints" value={data.commanderConstraints || ''} onChange={handleChange} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs mt-1 outline-none focus:border-green-600 transition-all" placeholder="Limitations or specific rules of engagement..." />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commander's Expectations</span>
                          <textarea name="commanderExpectations" value={data.commanderExpectations || ''} onChange={handleChange} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs mt-1 outline-none focus:border-green-600 transition-all" placeholder="Expected outcomes and reporting timelines..." />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-inner">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-6 bg-green-600 rounded-full"></div>
                        <h4 className="text-[11px] font-black text-slate-100 uppercase tracking-[0.2em]">MDMP Step 2: Mission Analysis Inputs (FM 6-0 Table 9-1)</h4>
                      </div>
                      <span className="text-[8px] text-slate-600 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">DOCTRINAL INPUTS</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {[
                        "Higher headquarters' plan or order",
                        "Intelligence and knowledge products",
                        "Standing operating procedures (SOPs)",
                        "Knowledge products (civil/other orgs)",
                        "Design methodology products (if applicable)",
                        "Updated running estimates"
                      ].map(item => (
                        <label key={item} className="flex items-center space-x-3 cursor-pointer group p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:border-green-800/50 hover:bg-slate-900 transition-all">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-green-600 focus:ring-0 cursor-pointer" />
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 uppercase transition-colors">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl border-t-4 border-t-green-700">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest">AI Analysis Synthesis</h4>
                        <GuidanceIcon field="analysis" />
                      </div>
                      <div className="text-xs text-slate-300 italic leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar pr-2">
                        {analysis || 'Drafting situational analysis...'}
                      </div>
                    </div>
                    <label className="block">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Constraints</span>
                      <textarea name="constraints" value={data.constraints || ''} onChange={handleChange} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs mt-1 outline-none font-bold" />
                    </label>
                  </div>
                  <div className="lg:col-span-1 space-y-6">
                    <label className="block">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Essential Tasks</span>
                      <textarea name="essentialTasks" value={data.essentialTasks || ''} onChange={handleChange} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs mt-1 outline-none font-bold" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Initial CCIR / EEFI</span>
                      <textarea name="ccir" value={data.ccir || ''} onChange={handleChange} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs mt-1 outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facts & Assumptions</span>
                      <textarea name="questions" value={data.assumptions || ''} onChange={handleChange} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs mt-1 outline-none" />
                    </label>
                  </div>
                  <div className="lg:col-span-1 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-100 uppercase tracking-widest">Proposed Mission Statement</span>
                      <button onClick={handleGenerateMission} disabled={generatingMission} className="text-[9px] bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded font-black uppercase tracking-widest shadow-lg">⚡ DRAFT</button>
                    </div>
                    <textarea name="missionStatement" value={data.missionStatement || ''} onChange={handleChange} rows={16} className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-sm font-bold text-slate-100 border-l-8 border-l-green-600 shadow-2xl outline-none" placeholder="Drafting Paragraph 2..." />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Courses of Action ({data.coas.length})</h4>
                   <button onClick={addCOA} className="bg-green-700 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-lg">Add New COA</button>
                </div>
                <div className="space-y-12">
                  {data.coas.map(coa => (
                    <div key={coa.id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-8 shadow-xl relative group">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <input value={coa.name} onChange={e => updateCOA(coa.id, { name: e.target.value })} className="bg-transparent text-green-500 font-black uppercase text-xl border-none w-full outline-none focus:ring-0 mr-4" />
                          <div className="flex space-x-2 shrink-0">
                            <button 
                              onClick={() => handleSummarizeCOA(coa)} 
                              disabled={summarizingId !== null} 
                              className={`text-[9px] border px-4 py-1.5 rounded font-black uppercase tracking-widest shadow-lg transition-all flex items-center space-x-2 ${summarizingId === coa.id ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-green-700 hover:bg-green-600 text-white border-green-600'}`}
                            >
                              {summarizingId === coa.id ? (
                                <><div className="w-2 h-2 border border-green-400 border-t-transparent rounded-full animate-spin"></div><span>GENERATING...</span></>
                              ) : (
                                'AI SUMMARY'
                              )}
                            </button>
                            <button 
                              onClick={() => handleAnalyzeRisk(coa)} 
                              disabled={analyzingRiskId !== null} 
                              className={`text-[9px] border px-4 py-1.5 rounded font-black uppercase tracking-widest shadow-lg transition-all flex items-center space-x-2 ${analyzingRiskId === coa.id ? 'bg-cyan-900/40 text-cyan-400 border-cyan-800' : 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-600'}`}
                            >
                              {analyzingRiskId === coa.id ? (
                                <><div className="w-2 h-2 border border-cyan-400 border-t-transparent rounded-full animate-spin"></div><span>ANALYZING...</span></>
                              ) : (
                                'RISK ASSESSMENT'
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <label className="block"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Decisive Objective</span><input value={coa.objective} onChange={e => updateCOA(coa.id, { objective: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-sm mt-1 outline-none focus:border-green-600 transition-all" placeholder="The primary effect or result to be achieved..." /></label>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subordinate Unit Tasks</span>
                              <button onClick={() => addUnitTask(coa.id)} className="text-[9px] text-green-500 font-black hover:text-green-400 uppercase transition-all flex items-center">
                                <span className="mr-1 text-sm">+</span> Add Task
                              </button>
                            </div>
                            <div className="space-y-2">
                              {coa.unitTasks.map((ut) => (
                                <div key={ut.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-3 relative group/ut">
                                  <button onClick={() => removeUnitTask(coa.id, ut.id)} className="absolute top-2 right-2 text-slate-700 hover:text-red-500 font-bold transition-all">×</button>
                                  <div className="grid grid-cols-2 gap-3">
                                    <label className="block">
                                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Unit</span>
                                      <input list="army-units" value={ut.unit} onChange={e => updateUnitTask(coa.id, ut.id, { unit: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] focus:border-green-600 outline-none" placeholder="e.g. 1st Platoon" />
                                    </label>
                                    <label className="block">
                                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Task</span>
                                      <input list="tactical-tasks" value={ut.task} onChange={e => updateUnitTask(coa.id, ut.id, { task: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] focus:border-green-600 outline-none" placeholder="e.g. Seize" />
                                    </label>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Purpose (In Order To)</span>
                                      <button 
                                        onClick={() => fetchTaskPurposeGuidance(coa, ut)} 
                                        disabled={loadingTaskGuidance[ut.id]}
                                        className="text-[8px] text-green-500 hover:text-green-400 font-black uppercase transition-all"
                                      >
                                        {loadingTaskGuidance[ut.id] ? 'Generating...' : '⚡ Suggest Purpose'}
                                      </button>
                                    </div>
                                    <textarea value={ut.purpose} onChange={e => updateUnitTask(coa.id, ut.id, { purpose: e.target.value })} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] focus:border-green-600 outline-none font-serif italic" placeholder="In order to..." />
                                    
                                    {taskPurposeSuggestions[ut.id] && (
                                      <div className="pt-2 flex flex-wrap gap-2">
                                        {taskPurposeSuggestions[ut.id].map((s, si) => (
                                          <button key={si} onClick={() => selectTaskPurpose(coa.id, ut.id, s)} className="text-[8px] bg-slate-800 hover:bg-green-900/40 border border-slate-700 hover:border-green-600 p-1.5 rounded text-slate-400 hover:text-green-300 transition-all text-left max-w-full">
                                            {s}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheme of Maneuver Flow</span>
                              <button 
                                onClick={() => handleGenerateScheme(coa)} 
                                disabled={generatingSchemeId !== null} 
                                className={`text-[9px] font-black uppercase flex items-center px-4 py-1.5 rounded transition-all shadow-md ${generatingSchemeId === coa.id ? 'bg-green-900/40 text-green-300 animate-pulse border border-green-600/50' : 'bg-green-700 hover:bg-green-600 text-white border border-green-600'}`}
                              >
                                {generatingSchemeId === coa.id ? (
                                  <><div className="w-2 h-2 border border-green-300 border-t-transparent rounded-full animate-spin mr-2"></div> GENERATING MANEUVER...</>
                                ) : '⚡ DRAFT SCHEME'}
                              </button>
                            </div>
                            <textarea value={coa.scheme} onChange={e => updateCOA(coa.id, { scheme: e.target.value })} rows={6} className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-sm mt-1 outline-none font-serif leading-relaxed focus:border-green-600 shadow-inner" placeholder="Drafting logical phases..." />
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-900/40 rounded-xl overflow-hidden border border-slate-800 flex flex-col"><COAVisualizer scheme={coa.scheme} objective={coa.objective} unitTasks={coa.unitTasks} riskMitigation={coa.riskMitigation} summary={coa.coaSummary} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {data.coas.map(coa => (
                    <div key={coa.id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col shadow-xl border-t-4 border-t-blue-700">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                          <h4 className="font-black text-slate-100 uppercase tracking-widest text-lg">{coa.name}</h4>
                          <span className="text-[9px] font-mono text-slate-500 uppercase">Analysis Cycle: {coa.wargameResults ? coa.wargameResults.split('--- NEXT CYCLE ---').length : 0}</span>
                        </div>
                        <button 
                          onClick={() => handleRunWargame(coa)} 
                          disabled={simulatingId !== null} 
                          className="bg-blue-700 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center space-x-2"
                        >
                          {simulatingId === coa.id ? (
                            <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>CALCULATING...</span></>
                          ) : (
                            <><span className="text-sm">🎲</span><span>EXECUTE CYCLE</span></>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center">
                            <span className="mr-2">⚔️</span> ENEMY ACTION / EVENT
                          </span>
                          <textarea 
                            value={coa.wargameInputEnemyAction || ''} 
                            onChange={e => updateCOA(coa.id, { wargameInputEnemyAction: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-red-600 transition-all h-20 placeholder:text-slate-700" 
                            placeholder="Describe enemy move or situational event..."
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center">
                            <span className="mr-2">🛡️</span> FRIENDLY REACTION
                          </span>
                          <textarea 
                            value={coa.wargameInputFriendlyReaction || ''} 
                            onChange={e => updateCOA(coa.id, { wargameInputFriendlyReaction: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-green-600 transition-all h-20 placeholder:text-slate-700" 
                            placeholder="Describe friendly countermove..."
                          />
                        </div>
                      </div>

                      <div className="flex-1 bg-slate-950/80 p-5 border border-slate-800 rounded-xl overflow-y-auto min-h-[400px] max-h-[600px] text-xs text-slate-300 font-serif leading-relaxed whitespace-pre-wrap custom-scrollbar">
                        {coa.wargameResults ? (
                          coa.wargameResults
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-700 text-center opacity-40">
                            <span className="text-4xl mb-4">🖥️</span>
                            <p className="uppercase tracking-widest font-bold">Tactical Simulator Offline</p>
                            <p className="text-[9px] mt-1">Input specific events or run a general cycle to begin wargame</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl animate-in fade-in duration-500 shadow-2xl flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-100 uppercase tracking-[0.3em]">COA Comparison Matrix</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-mono tracking-tighter mt-1">Score 1-10</p>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={handleSuggestCriteria} disabled={suggestingCriteria} className="bg-green-900/40 text-green-400 border border-green-800/50 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-800/60 transition-all flex items-center space-x-2">
                      {suggestingCriteria ? <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div> : <span>⚡ SUGGEST CRITERIA</span>}
                    </button>
                    <button onClick={handleAddCriterion} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">+ Add Custom</button>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1 min-h-[300px]">
                  <table className="w-full text-left text-xs text-slate-400 border-collapse">
                    <thead className="bg-slate-900 uppercase text-[10px] text-slate-500">
                      <tr>
                        <th className="p-4 border-b border-slate-800 min-w-[200px]">Evaluation Criteria</th>
                        {data.coas.map(c => <th key={c.id} className="p-4 border-b border-slate-800 text-center">{c.name}</th>)}
                        <th className="p-4 border-b border-slate-800 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.comparisonCriteria || STANDARD_COMPARISON_CRITERIA).map((crit, critIdx) => (
                        <tr key={critIdx} className="border-b border-slate-800/50 hover:bg-slate-900 transition-colors group/row">
                          <td className="p-4"><input type="text" value={crit} onChange={(e) => handleUpdateCriterion(critIdx, e.target.value)} className="bg-transparent border-none text-slate-300 font-bold focus:ring-0 w-full outline-none" /></td>
                          {data.coas.map(c => (
                            <td key={c.id} className="p-4 text-center">
                              <input type="number" min="1" max="10" value={data.comparisonMatrix?.[c.id]?.[crit] || 5} onChange={e => {
                                  const val = parseInt(e.target.value);
                                  const matrix = { ...data.comparisonMatrix };
                                  if (!matrix[c.id]) matrix[c.id] = {};
                                  matrix[c.id][crit] = val;
                                  updateData({ ...data, comparisonMatrix: matrix });
                                }} className="bg-slate-900 border border-slate-800 rounded w-16 p-2 text-center text-green-500 font-bold focus:border-green-600 outline-none" />
                            </td>
                          ))}
                          <td className="p-4 text-center"><button onClick={() => handleRemoveCriterion(critIdx)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-opacity">×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 p-6 bg-slate-900/50 border-l-4 border-green-700 text-xs italic text-slate-400 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {comparisonText || 'Processing evaluation matrix results...'}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="flex flex-col items-center justify-center space-y-12 animate-in zoom-in duration-500 h-full">
                <div className="text-center">
                  <h4 className="text-2xl font-black uppercase tracking-[0.4em] text-slate-100">COA Approval</h4>
                  <p className="text-xs text-slate-500 mt-2">Select the optimized Course of Action</p>
                </div>
                <div className="flex flex-wrap justify-center gap-8">
                  {data.coas.map(coa => (
                    <button key={coa.id} onClick={() => updateData({...data, selectedCoaId: coa.id})} className={`p-10 rounded-3xl border-2 transition-all text-left max-w-sm relative group ${data.selectedCoaId === coa.id ? 'bg-green-900/20 border-green-600 scale-105 shadow-2xl' : 'bg-slate-950 border-slate-800 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
                      <h5 className="font-black text-slate-100 uppercase text-xl group-hover:text-green-500 transition-colors">{coa.name}</h5>
                      <p className="text-xs text-slate-400 mt-4 line-clamp-4 italic font-serif leading-relaxed">"{coa.objective || coa.scheme}"</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Para 4: Sustainment */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-widest leading-none">Paragraph 4: Sustainment</h4>
                      <button onClick={handleGenerateSustainment} disabled={generatingSustainment} className="bg-green-700 hover:bg-green-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded shadow-lg transition-all flex items-center">
                        {generatingSustainment ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : '⚡ DRAFT PARA 4'}
                      </button>
                    </div>
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-1">Logistics (Class I, III, V)</span>
                        <textarea name="sustainmentLogistics" value={data.sustainmentLogistics || ''} onChange={handleChange} rows={5} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-serif leading-relaxed outline-none focus:border-amber-600 transition-all shadow-inner" placeholder="Planning supply and maintenance..." />
                      </label>
                      <label className="block">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-1">Personnel Services</span>
                        <textarea name="sustainmentPersonnel" value={data.sustainmentPersonnel || ''} onChange={handleChange} rows={5} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-serif leading-relaxed outline-none focus:border-blue-600 transition-all shadow-inner" placeholder="EPW, casualty handling..." />
                      </label>
                      <label className="block">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-1">Health Service Support</span>
                        <textarea name="sustainmentMedical" value={data.sustainmentMedical || ''} onChange={handleChange} rows={5} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-serif leading-relaxed outline-none focus:border-red-600 transition-all shadow-inner" placeholder="Role 1/2 medical plans..." />
                      </label>
                    </div>
                  </div>

                  {/* Para 5: Command and Signal */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-widest leading-none">Paragraph 5: Command & Signal</h4>
                      <button onClick={handleGenerateCmdSignal} disabled={generatingCmdSignal} className="bg-blue-700 hover:bg-blue-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded shadow-lg transition-all flex items-center">
                        {generatingCmdSignal ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : '⚡ DRAFT PARA 5'}
                      </button>
                    </div>
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Command & Succession</span>
                        <textarea name="commandLocation" value={data.commandLocation || ''} onChange={handleChange} rows={5} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-serif leading-relaxed outline-none focus:border-slate-500 transition-all shadow-inner" placeholder="Commander/CP locations and succession..." />
                      </label>
                      <label className="block">
                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest block mb-1">PACE Plan (P-A-C-E)</span>
                        <textarea name="signalPacePlan" value={data.signalPacePlan || ''} onChange={handleChange} rows={5} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-serif leading-relaxed outline-none focus:border-green-600 transition-all shadow-inner" placeholder="Primary, Alternate, Contingency, Emergency..." />
                      </label>
                      <label className="block">
                        <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest block mb-1">Signal & Call Signs</span>
                        <textarea name="callSigns" value={data.callSigns || ''} onChange={handleChange} rows={5} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-serif leading-relaxed outline-none focus:border-cyan-600 transition-all shadow-inner" placeholder="Call sign matrix and challenge/passwords..." />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 md:p-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center shrink-0">
        <button onClick={() => { if (showReview) setShowReview(false); else setStep(Math.max(1, step - 1)); }} disabled={(!showReview && step === 1) || loading} className="px-8 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-xs font-black uppercase text-slate-300 transition-all shadow-lg">Back</button>
        <button onClick={nextStep} disabled={loading || (step === 6 && !data.selectedCoaId)} className="px-10 py-2.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-black uppercase text-white shadow-2xl transition-all flex items-center space-x-3">
          {loading ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>SYNTHESIZING...</span></> : <span>{showReview ? 'RESUME PLANNING' : step === 7 ? 'PRODUCE FINAL OPORD' : 'EXECUTE MDMP STEP'}</span>}
        </button>
      </div>
    </div>
  );
};

export default MissionPlanner;
