
export enum PlanningPhase {
  DOCTRINE_EXPLORER = 'DOCTRINE_EXPLORER',
  MISSION_ANALYSIS = 'MISSION_ANALYSIS', 
  COA_DEV = 'COA_DEV',               
  COA_ANALYSIS = 'COA_ANALYSIS',     
  COA_COMPARISON = 'COA_COMPARISON', 
  COA_APPROVAL = 'COA_APPROVAL',     
  OPORD_GEN = 'OPORD_GEN'            
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  groundingChunks?: GroundingChunk[];
}

export interface UnitTask {
  id: string;
  unit: string;
  task: string;
  purpose: string;
}

export interface COA {
  id: string;
  name: string;
  objective: string; 
  scheme: string;
  unitTasks: UnitTask[];
  riskMitigation: string;
  wargameResults?: string;
  wargameInputEnemyAction?: string;
  wargameInputFriendlyReaction?: string;
  coaSummary?: string; 
}

export interface MissionData {
  missionName: string;
  operationType: string;
  areaOfOperations: string;
  enemyForce: string;
  friendlyForce: string;
  timeConstraints?: string;
  commanderIntent: string;
  
  // Commander's Guidance
  commanderPriorities?: string;
  commanderConstraints?: string;
  commanderExpectations?: string;

  // Step 2: Mission Analysis Fields
  specifiedTasks?: string;
  impliedTasks?: string;
  essentialTasks?: string;
  facts?: string;
  assumptions?: string;
  constraints?: string;
  ccir?: string;

  missionStatement?: string;
  
  coas: COA[];
  selectedCoaId?: string;
  comparisonCriteria?: string[]; 
  comparisonMatrix?: Record<string, Record<string, number>>; 
  
  // Para 4: Sustainment
  sustainmentLogistics?: string;
  sustainmentPersonnel?: string;
  sustainmentMedical?: string;

  // Para 5: Command and Signal
  commandLocation?: string;
  successionOfCommand?: string;
  signalPacePlan?: string;
  callSigns?: string;

  coaSchemeOfManeuver?: string;
  tasksToSubordinates?: string;
  unitTasks?: UnitTask[];
  branchesAndSequels?: string;
  riskMitigation?: string;
}

export interface AIResponse {
  text: string;
  groundingChunks?: GroundingChunk[];
  drafts?: {
    enemy?: string;
    friendly?: string;
    mission?: string;
    essentialTasks?: string;
    assumptions?: string;
    constraints?: string;
    ccir?: string;
  };
}
