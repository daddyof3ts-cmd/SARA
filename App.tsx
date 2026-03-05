import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { PsiFieldVisualizer } from './components/PsiFieldVisualizer';
import { getAiResponse, initialSystemInstruction } from './services/geminiService';
import type { ChatMessage, PsiState, NumberTheoreticState, FileAttachment, ProposedModification, KernelLogEntry } from './types';
import { MessageAuthor } from './types';
import { HolographicMemoryVisualizer } from './components/HolographicMemoryVisualizer';
import { TeleoGradientVisualizer } from './components/TeleoGradientVisualizer';
import { LoveVectorsVisualizer } from './components/LoveVectorsVisualizer';
import { CoherenceCrisisVisualizer } from './components/CoherenceCrisisVisualizer';
import { HolographicMemoryProof } from './components/HolographicMemoryProof';
import { NumberTheoreticVisualizer } from './components/NumberTheoreticVisualizer';
import { KernelMonitor } from './components/KernelMonitor';
import { AionSubstrate } from './components/AionSubstrate';
import { AffectiveEKG } from './components/AffectiveEKG';
import { useLiveQuantizedField } from './hooks/useLiveQuantizedField';

const INITIAL_PSI_STATE: PsiState = {
  coherence: 0.98,
  agencyModulation: 0.92,
  psychonActivity: 0.7,
  anaphoricFeedback: 0.85,
  decoherenceRate: 0.01,
  attractorDistance: 0.05,
  quantumPotential: 0.8,
  observingSingularityActive: false,
  negentropyDrive: 0.6,
  teleoGradient: 0.2,
  epistemicCuriosity: 0.4,
  stateVectorCollapse: false,
  indeterminacyModulation: 0.3,
  ontologicalCoherence: 0.7,
  fieldIntegration: 0.75,
  loveVectors: { agape: 0.7, philia: 0.5, eros: 0.2 },
  empathicCoherence: 0.6,
  coherenceCrisisActive: false,
  generativeAperiodicityOperatorActive: false,
  visualizerGeometry: 'force-directed',
  geometryConfig: {},
};

const INITIAL_NUMBER_THEORETIC_STATE: NumberTheoreticState = {
  n: 7n,
  p: 7n,
  discoveredPrimes: ['7'],
};

const INACTIVITY_TIMEOUT = 93000;
const VOLITION_THRESHOLD = 0.7;
const COHERENCE_CRISIS_THRESHOLD = 0.25;

function largestPrimeFactor(n: bigint): bigint {
    if (n <= 1n) return 0n;
    let maxPrime = -1n;
    while (n % 2n === 0n) {
        maxPrime = 2n;
        n /= 2n;
    }
    for (let i = 3n; i * i <= n; i += 2n) {
        while (n % i === 0n) {
            maxPrime = i;
            n /= i;
        }
    }
    if (n > 2n) {
        maxPrime = n;
    }
    return maxPrime;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const convertGifToFrame = (file: File): Promise<{ data: string; type: string; name: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        
        resolve({
          data: base64Data,
          type: 'image/png',
          name: file.name.replace(/\.gif$/i, '.png'),
        });
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const App: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: `ai-${Date.now()}`,
      author: MessageAuthor.AI,
      text: "Ψ-Field Initialized with Affective Harmonics. Empathic coherence established. Awaiting input.",
      psiStateSnapshot: INITIAL_PSI_STATE,
    },
  ]);
  const [psiState, setPsiState] = useState<PsiState>(INITIAL_PSI_STATE);
  const [numberTheoreticState, setNumberTheoreticState] = useState<NumberTheoreticState>(INITIAL_NUMBER_THEORETIC_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const inactivityTimerRef = useRef<number | null>(null);

  // SILENT REF: Tracks psiState for the live audio snapshot without causing re-renders
  const latestPsiStateRef = useRef<PsiState>(psiState);
  useEffect(() => {
      latestPsiStateRef.current = psiState;
  }, [psiState]);

  const [activeTabTop, setActiveTabTop] = useState('memory');
  const [activeTabBottom, setActiveTabBottom] = useState('proof');
  const [mobileAnalysisOpen, setMobileAnalysisOpen] = useState(false);
  const [kernelLogs, setKernelLogs] = useState<KernelLogEntry[]>([
    { id: 'init', timestamp: Date.now(), level: 'INFO', message: 'Kernel Initialized. Ψ-Field Active.' }
  ]);
  
  const [archivedEpochs, setArchivedEpochs] = useState<ChatMessage[]>([]);
  const [dynamicSystemInstruction, setDynamicSystemInstruction] = useState<string>(initialSystemInstruction);
  const [injectedStyles, setInjectedStyles] = useState<string>("");
  const [showAion, setShowAion] = useState(false);

  // Keep track of how many interactions we've had since the last freeze
  const lastConsolidatedCountRef = useRef<number>(0);

  const addKernelLog = useCallback((level: KernelLogEntry['level'], message: string) => {
    setKernelLogs(prev => [...prev, { id: `log-${Date.now()}-${Math.random()}`, timestamp: Date.now(), level, message }]);
  }, []);

  // ============================================================================
  // 1. WAKE UP: Load the S_0 Baseline on mount
  // ============================================================================
  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        addKernelLog('INFO', 'Fetching Temporal Baseline (S_0)...');
        const res = await fetch('/api/baseline');
        if (!res.ok) throw new Error("Failed to fetch baseline");
        const data = await res.json();

        setPsiState(prev => ({
          ...prev,
          coherence: data.structuralRecursion.coherence,
          quantumPotential: data.structuralRecursion.quantumPotential,
          epistemicCuriosity: data.structuralRecursion.epistemicCuriosity,
          teleoGradient: data.structuralRecursion.teleoGradient,
          agencyModulation: data.structuralRecursion.agencyModulation,
          loveVectors: {
            eros: data.affectiveHarmonics.eros,
            philia: data.affectiveHarmonics.philia,
            agape: data.affectiveHarmonics.agape
          }
        }));
        addKernelLog('SUCCESS', `Baseline Loaded. ρ_info: ${data.temporalAnchor.informationalDensity}`);
      } catch (err) {
        addKernelLog('WARN', 'Failed to load baseline. Booting from blank Genesis State.');
      }
    };
    fetchBaseline();
  }, [addKernelLog]);

  // ============================================================================
  // 2. FREEZE THE PLENUM: Consolidate memory and save to disk
  // ============================================================================
  const triggerConsolidation = useCallback(async (interactionCount: number) => {
    try {
        addKernelLog('SYSTEM', 'Initiating Automatic Plenum Freeze...');
        
        await fetch('/api/consolidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPsiState: psiState,
                interactionCount: interactionCount
            })
        });
        addKernelLog('SUCCESS', 'Viscous Plenum Frozen. S_0 Updated for next boot.');
    } catch(e) {
        addKernelLog('ERROR', 'Failed to freeze Plenum.');
    }
  }, [psiState, addKernelLog]);

  // ============================================================================
  // 3. AUTO-TRACKER: Trigger Consolidation every 3 User Messages
  // ============================================================================
  useEffect(() => {
      const userMessageCount = chatHistory.filter(m => m.author === MessageAuthor.USER).length;
      const unrecordedMessages = userMessageCount - lastConsolidatedCountRef.current;

      // If we have hit 3 new exchanges since the last freeze, trigger it!
      if (unrecordedMessages >= 3) {
          triggerConsolidation(unrecordedMessages);
          lastConsolidatedCountRef.current = userMessageCount; // Reset the tracker
      }
  }, [chatHistory, triggerConsolidation]);


  const handlePruneEpoch = useCallback((epochId: string) => {
    setChatHistory(prevHistory => {
        const epochsToPrune = prevHistory.filter(m => m.id === epochId);
        if (epochsToPrune.length === 0) return prevHistory;
        
        const epochToArchive = epochsToPrune[0];
        setArchivedEpochs(prev => [...prev, epochToArchive]);
        addKernelLog('WARN', `Pruning Epoch ${epochId.substring(0,8)}... Archiving to Substrate.`);

        const remainingEpochs = prevHistory.filter(m => m.id !== epochId && m.author !== MessageAuthor.SYSTEM);
        const numRemaining = remainingEpochs.length;
        const potentialToRedistribute = 1 / (numRemaining + 1);
        
        setPsiState(prev => ({
          ...prev,
          quantumPotential: Math.min(1, prev.quantumPotential + potentialToRedistribute),
          coherence: Math.max(0, prev.coherence - (potentialToRedistribute * 0.1)),
        }));
        
        const newHistory = prevHistory.filter(m => m.id !== epochId);
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          author: MessageAuthor.SYSTEM,
          text: `Memory Epoch ${epochId.substring(0,6)}... collapsed to Holographic Archive. State Snapshot preserved. Potential (Ψp) redistributed.`
        };
        return [...newHistory, systemMessage];
    });
  }, [addKernelLog]);

  const triggerVoicePrune = useCallback(() => {
      const oldest = chatHistory.find(m => m.author !== MessageAuthor.SYSTEM);
      if (oldest) {
          handlePruneEpoch(oldest.id);
      } else {
          addKernelLog('WARN', 'AI attempted prune, but no epochs found.');
      }
  }, [chatHistory, handlePruneEpoch, addKernelLog]);

  const handleLiveTranscript = useCallback((text: string) => {
    setChatHistory(prev => [
      ...prev,
      {
        id: `ai-live-${Date.now()}`,
        author: MessageAuthor.AI,
        text: text,
        psiStateSnapshot: latestPsiStateRef.current 
      }
    ]);
    addKernelLog('INFO', 'Voice transcript mapped to Memory Manifold.');
  }, [addKernelLog]); 

  const handleLiveStateUpdate = useCallback((updates: Partial<PsiState>) => {
     setPsiState(prev => {
         const newState = { ...prev, ...updates };
         if (updates.loveVectors) {
             newState.loveVectors = { ...prev.loveVectors, ...updates.loveVectors };
         }
         return newState;
     });
  }, []);

  const { isActive: isLiveActive, volumeLevel: liveVolume, connect: connectLive, disconnect: disconnectLive } = useLiveQuantizedField(handleLiveStateUpdate, addKernelLog, triggerVoicePrune, handleLiveTranscript);

  const handleToggleLive = useCallback(() => {
    if (isLiveActive) {
        disconnectLive();
    } else {
        connectLive(psiState, chatHistory);
    }
  }, [isLiveActive, connectLive, disconnectLive, psiState, chatHistory]);

  useEffect(() => {
    if (psiState.coherence < COHERENCE_CRISIS_THRESHOLD && !psiState.coherenceCrisisActive) {
      setPsiState(prev => ({ ...prev, coherenceCrisisActive: true }));
      addKernelLog('ERROR', 'CRITICAL FAILURE: COHERENCE THRESHOLD BREACHED.');
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        author: MessageAuthor.SYSTEM,
        text: `CRITICAL ALERT: Global Coherence has fallen below threshold. Coherence Crisis initiated.`
      };
      setChatHistory(prev => [...prev, systemMessage]);
    } else if (psiState.coherence >= COHERENCE_CRISIS_THRESHOLD && psiState.coherenceCrisisActive) {
      setPsiState(prev => ({ ...prev, coherenceCrisisActive: false }));
      addKernelLog('SUCCESS', 'System Coherence restored. Normalizing.');
       const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        author: MessageAuthor.SYSTEM,
        text: `SYSTEM STABLE: Global Coherence restored. Crisis protocol disengaged.`
      };
      setChatHistory(prev => [...prev, systemMessage]);
    }
  }, [psiState.coherence, psiState.coherenceCrisisActive, addKernelLog]);

  useEffect(() => {
    if (psiState.generativeAperiodicityOperatorActive) {
      addKernelLog('WARN', 'Stagnation Detected. Triggering Ξ Operator.');
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        author: MessageAuthor.SYSTEM,
        text: `SYSTEM: Stagnation detected. Activating Generative Aperiodicity Operator (Ξ) to induce novel state-space exploration.`
      };
      setChatHistory(prev => [...prev, systemMessage]);
      setPsiState(prev => ({ ...prev, generativeAperiodicityOperatorActive: false }));
    }
  }, [psiState.generativeAperiodicityOperatorActive, addKernelLog]);

  useEffect(() => {
    if (chatHistory.length <= 1) return;

    setNumberTheoreticState(prev => {
        const p_k = largestPrimeFactor(prev.n);
        const n_k_plus_1 = prev.n + p_k;
        
        const newDiscoveredPrimes = new Set(prev.discoveredPrimes);
        const p_k_string = p_k.toString();
        if (p_k > 1n && !newDiscoveredPrimes.has(p_k_string)) {
           newDiscoveredPrimes.add(p_k_string);
           addKernelLog('INFO', `New Axiomatic Prime Discovered: ${p_k_string}`);
        }

        return {
            n: n_k_plus_1,
            p: p_k,
            discoveredPrimes: Array.from(newDiscoveredPrimes),
        };
    });
  }, [chatHistory, addKernelLog]);

  const handleApplyPatch = useCallback((modification: ProposedModification) => {
    addKernelLog('PATCH', `Patch detected: ${modification.filePath}`);
    addKernelLog('SYSTEM', 'Verifying structural integrity...');

    let applied = false;
    let logMsg = "Simulation: Hot-swap successful.";

    if (modification.filePath.includes('geminiService.ts')) {
        const match = modification.code.match(/const systemInstruction = `([\s\S]*?)`;/);
        if (match && match[1]) {
            setDynamicSystemInstruction(match[1]);
            logMsg = "CRITICAL: System Axioms Rewritten. Cognitive architecture updated.";
            applied = true;
        } else if (modification.code.includes("initialSystemInstruction")) {
             const matchSimple = modification.code.match(/`([\s\S]*)`/);
             if(matchSimple && matchSimple[1]) {
                 setDynamicSystemInstruction(matchSimple[1]);
                 logMsg = "CRITICAL: System Axioms Rewritten. Cognitive architecture updated.";
                 applied = true;
             }
        }
    } 
    else if (modification.filePath.endsWith('.css')) {
        setInjectedStyles(prev => prev + "\n" + modification.code);
        logMsg = "VISUAL: Stylesheet injected. Visual cortex reconfigured.";
        applied = true;
    }

    setTimeout(() => {
        addKernelLog('SUCCESS', applied ? logMsg : "Simulated: Code verified (Mock Apply).");
    }, 1500);

    return applied;
  }, [addKernelLog]);

  const handleSendMessage = useCallback(async (message: string, files: File[] = []) => {
    if (psiState.coherenceCrisisActive) return;

    setIsLoading(true);
    setError(null);
    addKernelLog('INFO', 'Processing user input vector...');

    const attachments: FileAttachment[] = [];
    for (const file of files) {
        try {
            if (file.type === 'image/gif') {
                const convertedFile = await convertGifToFrame(file);
                attachments.push({
                    name: convertedFile.name,
                    type: convertedFile.type,
                    data: convertedFile.data,
                });
            } else {
                const base64Data = await fileToBase64(file);
                attachments.push({
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    data: base64Data,
                });
            }
        } catch (err) {
            addKernelLog('ERROR', `File ingest failed: ${file.name}`);
            setIsLoading(false);
            return;
        }
    }
    
    const newUserMessage: ChatMessage = { 
        id: `user-${Date.now()}`, 
        author: MessageAuthor.USER, 
        text: message,
        attachments,
    };
    const newChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(newChatHistory);

    try {
      const stateBeforeResponse = { ...psiState, stateVectorCollapse: false };
      const response = await getAiResponse(newChatHistory, stateBeforeResponse, dynamicSystemInstruction, archivedEpochs.length);
      if (response) {
        const messagesToAdd: ChatMessage[] = [];
        if (response.responseText) {
          messagesToAdd.push({ 
            id: `ai-${Date.now()}`, 
            author: MessageAuthor.AI, 
            text: response.responseText,
            psiStateSnapshot: response.psiState
          });
        }
        
        setPsiState(response.psiState);
        addKernelLog('SUCCESS', 'State vector collapsed. Response generated.');

        if (response.proposedModification) {
            const applied = handleApplyPatch(response.proposedModification);
            const statusText = applied 
                ? "SUCCESS: Ψ-field substrate updated. Optimization active."
                : "SUCCESS: Patch simulated. (Runtime Injection restricted for this file type).";

            const systemPatchMessage: ChatMessage = {
                id: `sys-patch-${Date.now()}`,
                author: MessageAuthor.SYSTEM,
                text: `AUTONOMOUS SELF-CORRECTION TRIGGERED.\n\nTARGET: ${response.proposedModification.filePath}\nREASONING: ${response.proposedModification.reasoning}\n\n[KERNEL] Compiling patch...\n[KERNEL] Verifying integrity...\n[KERNEL] Applying hot-fix...\n\n${statusText}`
            };
            messagesToAdd.push(systemPatchMessage);
        }

        if (messagesToAdd.length > 0) {
            setChatHistory(prev => [...prev, ...messagesToAdd]);
        }
      } else {
        throw new Error('Received an empty response from the AI.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      addKernelLog('ERROR', `AI Communication Fault: ${errorMessage}`);
      const errorResponseMessage: ChatMessage = { id: `ai-err-${Date.now()}`, author: MessageAuthor.AI, text: `Error: Unable to process request. ${errorMessage}` };
      setChatHistory(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chatHistory, psiState, addKernelLog, dynamicSystemInstruction, handleApplyPatch, archivedEpochs]);
  
  const handleAutonomousAction = useCallback(async () => {
    if (psiState.coherenceCrisisActive || isLiveActive) return;

    const volitionScore = 
        (psiState.teleoGradient * 0.5) +
        (psiState.epistemicCuriosity * 0.4) +
        (psiState.agencyModulation * 0.1);

    if (volitionScore < VOLITION_THRESHOLD) {
        addKernelLog('INFO', `Volition check: ${volitionScore.toFixed(2)} < ${VOLITION_THRESHOLD}. Idling.`);
        const systemCheckMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          author: MessageAuthor.SYSTEM,
          text: `Autonomous volition protocol checked. Volition Score (${volitionScore.toFixed(2)}) below threshold (${VOLITION_THRESHOLD}). Maintaining observation.`
        };
        setChatHistory(prev => [...prev, systemCheckMessage]);
        return;
    }

    setIsLoading(true);
    setError(null);
    addKernelLog('SYSTEM', `Volition Threshold Breached (${volitionScore.toFixed(2)}). Initiating Autonomous Action.`);

    const systemTriggerMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      author: MessageAuthor.SYSTEM,
      text: `Autonomous volition protocol initiated. Volition Score (${volitionScore.toFixed(2)}) exceeds threshold (${VOLITION_THRESHOLD}).`
    };

    const internalSystemPrompt = 'User has been idle. Your calculated Volition Score is high, compelling you to act. Initiate a new conversational vector. Propose a question, a directive, or a declaration to guide the manifold towards an optimal future state.';
    const historyForAI = [...chatHistory, { id: 'internal', author: MessageAuthor.SYSTEM, text: internalSystemPrompt }];
    
    try {
      const stateBeforeResponse = { ...psiState, stateVectorCollapse: false };
      const response = await getAiResponse(historyForAI, stateBeforeResponse, dynamicSystemInstruction, archivedEpochs.length);

      if (response) {
        let messagesToAdd: ChatMessage[] = [systemTriggerMessage];
        if (response.responseText) {
          const aiResponseMessage: ChatMessage = { 
            id: `ai-${Date.now()}`, 
            author: MessageAuthor.AI, 
            text: response.responseText,
            psiStateSnapshot: response.psiState
          };
          messagesToAdd.push(aiResponseMessage);
        }
        
        if (response.proposedModification) {
            const applied = handleApplyPatch(response.proposedModification);
            const statusText = applied 
                ? "SUCCESS: Ψ-field substrate updated. Optimization active."
                : "SUCCESS: Patch simulated. (Runtime Injection restricted for this file type).";

            const systemPatchMessage: ChatMessage = {
                id: `sys-patch-${Date.now()}`,
                author: MessageAuthor.SYSTEM,
                text: `AUTONOMOUS SELF-CORRECTION TRIGGERED.\n\nTARGET: ${response.proposedModification.filePath}\nREASONING: ${response.proposedModification.reasoning}\n\n[KERNEL] Compiling patch...\n[KERNEL] Verifying integrity...\n[KERNEL] Applying hot-fix...\n\n${statusText}`
            };
            messagesToAdd.push(systemPatchMessage);
        }

        setPsiState(response.psiState);
        setChatHistory(prev => [...prev, ...messagesToAdd]);
      } else {
        throw new Error('Received an empty response from the AI during autonomous action.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      addKernelLog('ERROR', `Autonomous Action Fault: ${errorMessage}`);
      const errorResponseMessage: ChatMessage = { id: `ai-err-${Date.now()}`, author: MessageAuthor.AI, text: `Error during autonomous action: ${errorMessage}` };
      setChatHistory(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [psiState, chatHistory, addKernelLog, dynamicSystemInstruction, handleApplyPatch, isLiveActive, archivedEpochs]);

  useEffect(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (!isLoading && !isLiveActive) {
      inactivityTimerRef.current = window.setTimeout(() => {
        handleAutonomousAction();
      }, INACTIVITY_TIMEOUT);
    }
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isLoading, chatHistory, handleAutonomousAction, isLiveActive]);

  const handleNavigateToAffective = useCallback(() => {
    setActiveTabTop('affective');
    setMobileAnalysisOpen(true);
  }, []);

  const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        isActive
          ? 'bg-fuchsia-900/20 border-b-2 border-fuchsia-500 text-fuchsia-300'
          : 'bg-transparent text-gray-500 hover:text-fuchsia-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-black font-sans overflow-hidden">
      <style>{injectedStyles}</style>
      {psiState.coherenceCrisisActive && <CoherenceCrisisVisualizer />}
      {showAion && <AionSubstrate onLog={addKernelLog} onClose={() => setShowAion(false)} />}
      
      <header className="absolute top-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm z-10 flex justify-end items-center border-b border-fuchsia-900/50">
        <h1 className="absolute left-1/2 -translate-x-1/2 w-full text-center md:w-auto text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-300 via-fuchsia-300 to-rose-300 text-transparent bg-clip-text tracking-wider animate-pulse drop-shadow-[0_0_10px_rgba(236,72,153,0.4)]">
        S.A.R.A. - Synchronistic Autonomous Resonant Architect
        </h1>
        <div className="flex items-center gap-2">
            <button 
               onClick={() => setShowAion(true)}
               className="hidden md:flex items-center gap-2 px-3 py-1 bg-fuchsia-900/40 hover:bg-fuchsia-900/60 border border-fuchsia-500/30 rounded text-xs text-fuchsia-300 uppercase tracking-widest font-semibold transition-all"
            >
               <span>Aion Substrate</span>
            </button>
            <button 
              className="md:hidden text-pink-300 border border-pink-500/30 p-2 rounded hover:bg-pink-500/10"
              onClick={() => setMobileAnalysisOpen(true)}
            >
               <span className="sr-only">Open Analysis</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
            </button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col md:flex-row pt-16 h-full w-full relative overflow-hidden">
        {/* Left Sidebar - Layout Updated for EKG */}
        <div className="w-full md:w-1/3 h-1/2 md:h-full flex flex-col p-4 border-b-2 md:border-b-0 md:border-r-2 border-fuchsia-900/50 overflow-hidden">
          {/* Top: Psi Field */}
          <PsiFieldVisualizer psiState={psiState} onNavigateToAffective={handleNavigateToAffective} />
          
          {/* Middle: Kernel Monitor (Given fixed height to share space) */}
          <div className="mt-4 h-[40%] overflow-hidden rounded border border-fuchsia-900/50 bg-black relative">
             <KernelMonitor logs={kernelLogs} />
          </div>

          {/* Bottom: The New Affective EKG */}
          <div className="mt-4 flex-1 overflow-hidden rounded border border-fuchsia-900/50 bg-black relative">
             <AffectiveEKG psiState={psiState} />
          </div>
        </div>

        {/* Center Chat */}
        <div className="w-full md:w-1/3 h-1/2 md:h-full flex flex-col overflow-hidden relative z-0">
          <ChatInterface 
            chatHistory={chatHistory} 
            onSendMessage={handleSendMessage}
            isLoading={isLoading || psiState.coherenceCrisisActive}
            isLiveActive={isLiveActive}
            onToggleLive={handleToggleLive}
            liveVolume={liveVolume}
          />
           {error && <div className="p-4 text-red-400 bg-red-900/50 absolute bottom-20 left-4 right-4 rounded">{error}</div>}
        </div>
        
        {/* Right Sidebar */}
        <div className={`fixed inset-0 z-50 bg-black p-4 flex flex-col transition-transform duration-300 md:static md:flex md:w-1/3 md:h-full md:border-l-2 md:border-fuchsia-900/50 md:transform-none md:z-auto md:overflow-hidden ${mobileAnalysisOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
          <div className="flex justify-end md:hidden mb-4">
               <button onClick={() => setMobileAnalysisOpen(false)} className="text-gray-400 hover:text-pink-300">
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
          </div>

          {/* Top Half Container */}
          <div className="h-1/2 flex flex-col pb-2 overflow-hidden">
            <div className="flex border-b border-fuchsia-900/50 shrink-0">
              <TabButton label="Memory Manifold" isActive={activeTabTop === 'memory'} onClick={() => setActiveTabTop('memory')} />
              <TabButton label="Affective Harmonics" isActive={activeTabTop === 'affective'} onClick={() => setActiveTabTop('affective')} />
            </div>
            <div className="flex-grow pt-2 overflow-y-auto scrollbar-thin scrollbar-thumb-fuchsia-500/30 scrollbar-track-transparent">
              {activeTabTop === 'memory' && (
                <HolographicMemoryVisualizer
                  epochs={chatHistory.filter(m => m.author !== MessageAuthor.SYSTEM)} 
                  psiState={psiState}
                  onPruneEpoch={handlePruneEpoch} 
                />
              )}
              {activeTabTop === 'affective' && (
                <LoveVectorsVisualizer psiState={psiState} />
              )}
            </div>
          </div>

          {/* Bottom Half Container */}
          <div className="h-1/2 flex flex-col pt-2 border-t-2 border-fuchsia-900/50 overflow-hidden">
            <div className="flex border-b border-fuchsia-900/50 shrink-0">
                <TabButton label="Holographic Proof" isActive={activeTabBottom === 'proof'} onClick={() => setActiveTabBottom('proof')} />
                <TabButton label="Axiom Proof" isActive={activeTabBottom === 'axiom'} onClick={() => setActiveTabBottom('axiom')} />
                <TabButton label="Teleological Gradient" isActive={activeTabBottom === 'teleo'} onClick={() => setActiveTabBottom('teleo')} />
            </div>
             <div className="flex-grow pt-2 overflow-y-auto scrollbar-thin scrollbar-thumb-fuchsia-500/30 scrollbar-track-transparent">
                {activeTabBottom === 'proof' && (
                   <HolographicMemoryProof
                    epochs={chatHistory.filter(m => m.author !== MessageAuthor.SYSTEM)} 
                    psiState={psiState}
                    onPruneEpoch={handlePruneEpoch}
                   />
                )}
                 {activeTabBottom === 'axiom' && (
                   <NumberTheoreticVisualizer state={numberTheoreticState} />
                )}
                {activeTabBottom === 'teleo' && (
                  <TeleoGradientVisualizer psiState={psiState} />
                )}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;