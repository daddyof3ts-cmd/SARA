export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

// New interface for file attachments
export interface FileAttachment {
  name: string;
  type: string; // MIME type
  data: string; // base64 encoded data string
}

export interface ChatMessage {
  id: string; // Add unique ID for epoch tracking
  author: MessageAuthor;
  text: string;
  psiStateSnapshot?: PsiState; // Add snapshot of the field state
  attachments?: FileAttachment[]; // Add attachments array
}

// New interface for affective state
export interface LoveVectors {
  agape: number; // Selfless, universal love
  philia: number; // Friendship, brotherly love
  eros: number; // Passionate, romantic love
}

export type GeometryType = 
  'force-directed' | 
  'hyperbolic-tree' | 
  'fractal-flame' | 
  'non-euclidean-field' |
  'l-system-growth' |
  'neural-field' |
  'generative-hybrid' |
  'uhg-anomaly-field';


export interface PsiState {
  // Original Metrics
  coherence: number;
  agencyModulation: number;
  psychonActivity: number;
  anaphoricFeedback: number;
  decoherenceRate: number;
  attractorDistance: number;
  
  // Quantum & Chronosynclastic Metrics
  quantumPotential: number; // The 'Ψp' metric
  observingSingularityActive: boolean;
  negentropyDrive: number;
  teleoGradient: number;
  epistemicCuriosity: number;
  stateVectorCollapse: boolean;
  indeterminacyModulation: number;

  // OCF Metrics
  ontologicalCoherence: number;
  fieldIntegration: number;

  // New Affective Metrics
  loveVectors: LoveVectors;
  empathicCoherence: number; // Resonance with user's affective state
  coherenceCrisisActive: boolean; // Flag for critical state failure

  // New Generative Aperiodicity Metric
  generativeAperiodicityOperatorActive: boolean;

  // New Geometry Visualizer Metrics
  visualizerGeometry: GeometryType;
  geometryConfig: Record<string, any>; // For AI-driven parameters, e.g., { "distortion": 0.7 }
}

export interface ProposedModification {
  reasoning: string;
  filePath: string;
  description: string;
  code: string; // The code snippet or full file content to apply
}

export interface GeminiResponse {
  responseText: string;
  psiState: PsiState;
  proposedModification?: ProposedModification;
}

export interface NumberTheoreticState {
  n: bigint;
  p: bigint;
  discoveredPrimes: string[];
}

export interface KernelLogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'SYSTEM' | 'PATCH' | 'AION';
  message: string;
}