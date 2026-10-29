export type UrgencyLevel = 'Emergency' | 'Consult Doctor Soon' | 'Consult Doctor' | 'Home Care Suitable';

export interface ParsedTriage {
  injuryIdentified?: string;
  urgencyLevel: UrgencyLevel;
  assessmentSummary: string;
  immediateSteps: string[];
  whatNotToDo: string[];
  redFlags: string[];
  disclaimer?: string;
  rawMarkdown: string;
}

export interface TriageRecord {
  id: string;
  timestamp: number;
  description: string;
  imageDataUrl?: string;
  parsed: ParsedTriage;
  completedStepIndices: number[];
  notes?: string;
}

export interface QuickGuide {
  id: string;
  title: string;
  icon: string;
  category: 'Trauma' | 'Environmental' | 'Medical';
  urgency: UrgencyLevel;
  keySteps: string[];
  doNots: string[];
  whenToCall911: string[];
}
