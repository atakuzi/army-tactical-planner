
import { GoogleGenAI, Type } from "@google/genai";
import { MissionData, AIResponse, COA, UnitTask } from "../types";

export const getDoctrineResponse = async (query: string, history: { role: string, content: string }[]): Promise<AIResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const contents = [
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })),
    { role: 'user', parts: [{ text: query }] }
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: `You are the "Army Tactical Planner Doctrine AI." 
      Answer natural language queries regarding Army Doctrine (ADPs, FMs, ATPs).
      ALWAYS cite specific Publications and Chapters. 
      Use Google Search to find latest manual versions.`,
      tools: [{ googleSearch: {} }],
    }
  });

  return {
    text: response.text || '',
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const suggestComparisonCriteria = async (data: MissionData): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const coaContext = data.coas.map(c => `- ${c.name}: ${c.objective}`).join('\n');
  
  const response = await ai.models.generateContent({
    model,
    contents: `As an Army Battalion Executive Officer (XO), suggest 6-8 mission-specific evaluation criteria for comparing Courses of Action (COAs).
    
    MISSION: ${data.missionName}
    TYPE: ${data.operationType}
    SITUATION: ${data.enemyForce} vs ${data.friendlyForce}
    AO: ${data.areaOfOperations}
    COAs:
    ${coaContext}
    
    Suggest criteria that are critical for this specific operation (e.g., 'Civilian Impact' for Stability ops, 'Fuel Consumption' for long-range maneuver, 'Breach Success' for fortified defense).
    Return a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return ["Maneuver", "Objective", "Simplicity", "Mass", "Surprise", "Risk"];
  }
};

export const generateMissionNameSuggestions = async (data: Partial<MissionData>): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Generate 5 creative and doctrinally appropriate operation names for a US Army mission.
    Operation Type: ${data.operationType || 'General'}
    Context: ${data.enemyForce || 'N/A'} vs ${data.friendlyForce || 'N/A'}.
    The names should follow the "OPERATION [NAME]" format.
    Provide only the names in a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return ["OPERATION IRON SWORD", "OPERATION EAGLE CLAW", "OPERATION FREEDOM SENTRY"];
  }
};

export const getStepGuidance = async (fieldName: string, currentData: Partial<MissionData>): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Provide expert tactical guidance for filling out the "${fieldName}" field in an Army MDMP process. 
    Mission: ${currentData.missionName || 'N/A'}. 
    Current Situation: ${currentData.enemyForce}.
    Cite relevant FM 6-0 or ADP 5-0 chapters.`,
    config: { temperature: 0.5, tools: [{ googleSearch: {} }] }
  });

  return response.text || '';
};

export const generateSustainmentDraft = async (data: MissionData): Promise<{logistics: string, personnel: string, medical: string}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  const selectedCoa = data.coas.find(c => c.id === data.selectedCoaId) || data.coas[0];

  const response = await ai.models.generateContent({
    model,
    contents: `As an Army Battalion S4 (Logistics), S1 (Personnel), and Surgeon team, draft Paragraph 4 (Sustainment) for an OPORD per FM 4-0.
    Mission: ${data.missionName}
    Operation Type: ${data.operationType}
    Approved COA: ${selectedCoa?.name} - ${selectedCoa?.objective}
    AO: ${data.areaOfOperations}
    Enemy: ${data.enemyForce}
    
    Provide detailed, doctrinally sound drafts for:
    1. LOGISTICS: Include Supply (Class I, III, V, VIII), Maintenance, and Transportation plans.
    2. PERSONNEL: EPW (Enemy Prisoner of War) handling, casualty reporting, replacements, and postal.
    3. MEDICAL: Role 1/2 locations, MEDEVAC procedures, CCP locations, and evacuation priority.
    
    Return a JSON object.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          logistics: { type: Type.STRING },
          personnel: { type: Type.STRING },
          medical: { type: Type.STRING }
        },
        required: ["logistics", "personnel", "medical"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { logistics: "", personnel: "", medical: "" };
  }
};

export const generateCommandSignalDraft = async (data: MissionData): Promise<{command: string, signal: string, pace: string, callsigns: string}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const selectedCoa = data.coas.find(c => c.id === data.selectedCoaId) || data.coas[0];

  const response = await ai.models.generateContent({
    model,
    contents: `As an Army Battalion S3 (Operations) and S6 (Signal) team, draft Paragraph 5 (Command and Signal) for an OPORD.
    Mission: ${data.missionName}
    Operation Type: ${data.operationType}
    COA Objective: ${selectedCoa?.objective}
    
    Draft sections for:
    1. COMMAND: Location of Commander, CP locations (Main, TAC, Rear), and Succession of Command.
    2. SIGNAL: General signal instructions, Challenge/Password.
    3. PACE PLAN: Primary, Alternate, Contingency, Emergency communication methods.
    4. CALL SIGNS: Suggest a callsign naming convention for the unit and subordinates.
    
    Return a JSON object.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          command: { type: Type.STRING },
          signal: { type: Type.STRING },
          pace: { type: Type.STRING },
          callsigns: { type: Type.STRING }
        },
        required: ["command", "signal", "pace", "callsigns"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { command: "", signal: "", pace: "", callsigns: "" };
  }
};

export const analyzeMETTTC = async (data: MissionData): Promise<AIResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Perform a detailed MDMP Step 2: Mission Analysis on: ${JSON.stringify(data)}. 
    
    Identify:
    1. MISSION: Contextual summary of the situation.
    2. ENEMY: Analysis of threats and capabilities.
    3. ESSENTIAL TASKS: Derived tasks required to achieve commander's intent.
    4. ASSUMPTIONS & FACTS: Critical planning elements.
    5. CONSTRAINTS: Limitations placed on the command.
    6. INITIAL CCIR/EEFI: Priority information requirements.
    7. MISSION STATEMENT DRAFT: Formal WHO, WHAT, WHEN, WHERE, WHY.`,
    config: { 
      temperature: 0.2,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          enemyDraft: { type: Type.STRING },
          friendlyDraft: { type: Type.STRING },
          missionDraft: { type: Type.STRING },
          essentialTasksDraft: { type: Type.STRING },
          assumptionsDraft: { type: Type.STRING },
          constraintsDraft: { type: Type.STRING },
          ccirDraft: { type: Type.STRING }
        },
        required: ["analysis", "enemyDraft", "friendlyDraft", "missionDraft", "essentialTasksDraft", "assumptionsDraft", "constraintsDraft", "ccirDraft"]
      }
    }
  });
  
  const parsed = JSON.parse(response.text);
  
  return {
    text: parsed.analysis || '',
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
    drafts: {
      enemy: parsed.enemyDraft,
      friendly: parsed.friendlyDraft,
      mission: parsed.missionDraft,
      essentialTasks: parsed.essentialTasksDraft,
      assumptions: parsed.assumptionsDraft,
      constraints: parsed.constraintsDraft,
      ccir: parsed.ccirDraft
    }
  };
};

export const getUnitTaskPurposeGuidance = async (data: MissionData, coa: COA, unitTask: UnitTask): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `As an Army Battalion S3 (Operations Officer), help draft the 'Purpose' (In Order To) for a subordinate unit task.
    Higher Mission: ${data.missionStatement || 'N/A'}
    COA Objective: ${coa.objective}
    Unit Assigned: ${unitTask.unit}
    Task Assigned: ${unitTask.task}
    
    The purpose must explain WHY this unit is doing this task to support the higher COA objective.
    Provide 3 concise, professional, doctrinal options. They must start with "In order to...".
    
    Return a JSON array of strings.`,
    config: { 
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return ["In order to enable the main effort to achieve the objective.", "In order to prevent enemy disruption of the primary attack.", "In order to secure the unit's flank during maneuver."];
  }
};

export const generateSchemeOfManeuver = async (data: MissionData, coa: COA): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  
  const unitTasksText = coa.unitTasks?.length > 0 
    ? coa.unitTasks.map(ut => `- ${ut.unit}: ${ut.task} in order to ${ut.purpose}`).join('\n') 
    : 'No specific unit tasks assigned yet; generate a general conceptual scheme based on the objective.';
  
  const response = await ai.models.generateContent({
    model,
    contents: `As an expert US Army Battalion S3 (Operations Officer), draft a doctrinally precise Scheme of Maneuver (OPORD Paragraph 3c) for the following Course of Action.
    
    COA NAME: ${coa.name}
    DECISIVE OBJECTIVE: ${coa.objective}
    OPERATION TYPE: ${data.operationType}
    AO: ${data.areaOfOperations}
    
    SITUATION: 
    Enemy: ${data.enemyForce}
    Friendly: ${data.friendlyForce}
    
    ASSIGNED UNIT TASKS:
    ${unitTasksText}
    
    COMMANDER'S INTENT:
    ${data.commanderIntent}
    
    The output must strictly follow these requirements:
    1. BREAKDOWN INTO PHASES: The maneuver must be organized into logical phases (e.g., Phase I: Preparation/Infiltration, Phase II: Movement to Contact, Phase III: Decisive Action, Phase IV: Consolidation/Reorganization). 
    2. DOCTRINAL HEADERS: Start each phase with "PHASE [NUMBER]: [Phase Name]".
    3. INTEGRATION: Clearly explain how each assigned unit task (if any) contributes to the specific phase.
    4. TERMINOLOGY: Use professional military symbols and doctrinal terms (ADPs, FMs).
    5. NARRATIVE FLOW: Ensure the scheme is a cohesive tactical story, not a disjointed list.
    6. CITATION: Mention relevant manuals (e.g., "per FM 3-90") where applicable to reinforce doctrinal soundness.`,
    config: { 
      temperature: 0.4,
      tools: [{ googleSearch: {} }] 
    }
  });

  return response.text?.trim() || '';
};

export const refineCommanderIntent = async (data: MissionData): Promise<{refined: string, critique: string, purposeScore: number, tasksScore: number, stateScore: number}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `As an Army Battalion Executive Officer (XO), critique and refine the following Commander's Intent based on ADP 6-0 principles.
    
    CURRENT INTENT: "${data.commanderIntent || 'Not provided'}"
    MISSION: ${data.missionName}
    OP TYPE: ${data.operationType}
    
    Requirements for a valid Commander's Intent:
    1. PURPOSE: Clearly state WHY the operation is occurring (the broader goal).
    2. KEY TASKS: Identify tasks the force must perform to achieve the end state.
    3. END STATE: Describe desired conditions relative to: Enemy, Terrain, and Civil Considerations.
    
    Provide:
    1. A refined, doctrinally perfect draft.
    2. A critique identifying what components were missing or weak.
    3. Scores (1-10) for Purpose, Key Tasks, and End State based on current draft.
    
    Return a JSON object.`,
    config: { 
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          refined: { type: Type.STRING },
          critique: { type: Type.STRING },
          purposeScore: { type: Type.NUMBER },
          tasksScore: { type: Type.NUMBER },
          stateScore: { type: Type.NUMBER }
        },
        required: ["refined", "critique", "purposeScore", "tasksScore", "stateScore"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { refined: response.text, critique: "Critique unavailable.", purposeScore: 5, tasksScore: 5, stateScore: 5 };
  }
};

export const getSustainmentGuidance = async (category: 'Logistics' | 'Personnel' | 'Medical', data: MissionData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const selectedCoa = data.coas.find(c => c.id === data.selectedCoaId) || data.coas[0];
  const response = await ai.models.generateContent({
    model,
    contents: `As an Army Sustainment Planner, provide specific guidance for Paragraph 4 "${category}" for the following mission: 
    Objective: ${selectedCoa?.objective || 'N/A'}, Op Type: ${data.operationType}. 
    Focus on Class I, III, V supply for logistics or CCP/MEDEVAC for medical.`,
    config: { temperature: 0.4, tools: [{ googleSearch: {} }] }
  });

  return response.text || '';
};

export const generateMissionStatement = async (data: MissionData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Draft a formal Paragraph 2 Mission Statement. 
    Who: [Unit Name], What: [Tactical Task], When: [Time], Where: ${data.areaOfOperations}, Why: [Purpose].
    Context: Intent is ${data.commanderIntent}, Operation is ${data.operationType}. 
    Use doctrinal terminology.`,
    config: { temperature: 0.3, tools: [{ googleSearch: {} }] }
  });

  return response.text?.trim() || '';
};

export const generateCOASummary = async (coa: COA): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const unitTaskDetails = coa.unitTasks?.map(ut => `- ${ut.unit}: ${ut.task} (IOT: ${ut.purpose})`).join('\n') || 'None assigned.';
  
  const response = await ai.models.generateContent({
    model,
    contents: `Summarize this Course of Action (COA) tactically.
    
    COA NAME: ${coa.name}
    OBJECTIVE: ${coa.objective}
    SCHEME OF MANEUVER: ${coa.scheme}
    SUBORDINATE UNIT TASKS:
    ${unitTaskDetails}
    
    Provide a concise, professional synthesis that explains how the scheme of maneuver and unit tasks achieve the decisive objective. Use strictly professional Army tactical terminology.`,
    config: { temperature: 0.3 }
  });

  return response.text?.trim() || '';
};

export const generateRiskAnalysis = async (coa: COA, data: MissionData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Perform a formal tactical risk assessment (per ATP 5-19 Risk Management) for the following Course of Action:
    COA Name: ${coa.name}
    Objective: ${coa.objective}
    Scheme: ${coa.scheme}
    
    Mission Context:
    Enemy Force: ${data.enemyForce}
    Friendly Force: ${data.friendlyForce}
    AO: ${data.areaOfOperations}
    Operation Type: ${data.operationType}

    Identify at least 3 high-priority tactical risks. For each risk, provide:
    1. HAZARD: Brief description of the tactical threat/danger.
    2. MITIGATION: Specific actionable control measures to minimize the risk.
    
    Format the output as a professional bulleted list using strictly Army doctrinal language.`,
    config: { temperature: 0.4, tools: [{ googleSearch: {} }] }
  });

  return response.text?.trim() || '';
};

export const simulateWargame = async (data: MissionData, coa: COA): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';

  const userAction = coa.wargameInputEnemyAction ? `\nUSER SPECIFIED ENEMY ACTION: ${coa.wargameInputEnemyAction}` : '';
  const userReaction = coa.wargameInputFriendlyReaction ? `\nUSER SPECIFIED FRIENDLY REACTION: ${coa.wargameInputFriendlyReaction}` : '';

  const response = await ai.models.generateContent({
    model,
    contents: `Perform a tactical COA Analysis (Wargame) following the Action-Reaction-Counteraction method. 
    
    FRIENDLY COA: ${coa.name}
    AO: ${data.areaOfOperations}
    FRIENDLY FORCE: ${data.friendlyForce}
    ENEMY FORCE: ${data.enemyForce}
    DECISIVE OBJECTIVE: ${coa.objective}
    SCHEME OF MANEUVER: ${coa.scheme}
    ${userAction}${userReaction}

    As the Wargame Umpire (S3/S2 team), conduct a simulation cycle.
    If the user provided a specific action/reaction, FOCUS the wargame on those specific tactical interactions.
    
    Output Format:
    1. ACTION: Detailed description of the friendly or enemy move.
    2. REACTION: The opponent's response based on capabilities and doctrine.
    3. COUNTERACTION: The original mover's adjustment to the reaction.
    4. FINDINGS: Critical vulnerabilities, coordination requirements, or refinements needed for the COA.
    
    Use strictly professional military terminology.`,
    config: { temperature: 0.4 }
  });

  return response.text || '';
};

export const compareCOAs = async (data: MissionData, criteriaList: string[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Compare these COAs using criteria: ${criteriaList.join(', ')}. 
    COAs: ${data.coas.map(c => `${c.name} (${c.objective})`).join('; ')}. 
    Recommend the superior COA doctrinally.`,
    config: { temperature: 0.3 }
  });

  return response.text || '';
};

export const generateOPORD = async (data: MissionData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  const selectedCoa = data.coas.find(c => c.id === data.selectedCoaId) || data.coas[0];
  
  const response = await ai.models.generateContent({
    model,
    contents: `Generate a formal 5-paragraph Operations Order (OPORD) based on the current MDMP process.
    Mission Name: ${data.missionName}
    Situation: ${data.enemyForce} vs ${data.friendlyForce} in ${data.areaOfOperations}.
    Para 2: ${data.missionStatement}
    Para 3 Execution: ${selectedCoa.scheme} with objective ${selectedCoa.objective}.
    Para 4 Sustainment: Logistics: ${data.sustainmentLogistics}, Personnel: ${data.sustainmentPersonnel}, Medical: ${data.sustainmentMedical}.
    Para 5 Command & Signal: Command Location: ${data.commandLocation}, Succession: ${data.successionOfCommand}, PACE: ${data.signalPacePlan}, Call Signs: ${data.callSigns}.
    Intent: ${data.commanderIntent}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          situation: { type: Type.STRING },
          mission: { type: Type.STRING },
          execution: { type: Type.STRING },
          sustainment: { type: Type.STRING },
          commandAndSignal: { type: Type.STRING },
        },
        required: ["situation", "mission", "execution", "sustainment", "commandAndSignal"]
      }
    }
  });

  return JSON.parse(response.text);
};
