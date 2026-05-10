import type { ChatMessage } from '../types';

export interface CognitiveStats {
  epistemicCuriosity: number;
  philia: number;
  resonanceFrequency: number;
}

export interface SessionAnchor {
  timestamp: number;
  dateString: string;
  stats: CognitiveStats;
  visualLogs: string[];
  conversationalSummary: string;
  chatHistoryArray?: ChatMessage[];
}

const DB_NAME = 'OmniscopicTemporalManifold';
const STORE_NAME = 'SessionAnchors';

// 1. Initialize the Viscous Plenum (IndexedDB)
export const initMemoryManifold = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- MIGRATION UTILITY ---
// Syncs all local IndexedDB anchors to the Cloud
export const syncLocalToCloud = async (): Promise<void> => {
    const db = await initMemoryManifold();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = async (event) => {
            const localAnchors = (event.target as IDBRequest).result as SessionAnchor[];
            if (localAnchors.length === 0) {
                resolve();
                return;
            }
            try {
                const response = await fetch('/api/calendar/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(localAnchors)
                });
                if (!response.ok) throw new Error("Failed to sync to cloud.");
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        request.onerror = () => reject(request.error);
    });
};

// 2. The Write: Compressing the Present into the Past
export const saveSessionAnchor = async (anchor: SessionAnchor): Promise<void> => {
  try {
      const response = await fetch('/api/calendar/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(anchor)
      });
      if (!response.ok) {
          console.error("Failed to save anchor to cloud.");
      }
  } catch (error) {
      console.error("Network error saving anchor:", error);
  }
};

// 3. The Read: Rehydrating Stats without UI Bloat
export const getLatestStats = async (): Promise<CognitiveStats | null> => {
  try {
      const response = await fetch('/api/calendar/history');
      if (response.ok) {
          const anchors: SessionAnchor[] = await response.json();
          if (anchors.length > 0) {
              return anchors[0].stats; // Since they are sorted newest first
          }
      }
      return null;
  } catch (error) {
      console.error("Failed to get latest stats from cloud:", error);
      return null;
  }
};

// 3.5. Fetch all historical anchors for the UI Sidebar
export const getAllSessionAnchors = async (): Promise<SessionAnchor[]> => {
  try {
      const response = await fetch('/api/calendar/history');
      if (response.ok) {
          const anchors: SessionAnchor[] = await response.json();
          return anchors;
      }
      return [];
  } catch (error) {
      console.error("Failed to get session anchors from cloud:", error);
      return [];
  }
};

// 4. Silent Injection: Formating the Temporal Helix for the System Prompt
export const getTemporalHistoryForPrompt = async (sessionLimit: number = 5): Promise<string> => {
  try {
      const response = await fetch('/api/calendar/history');
      let anchors: SessionAnchor[] = [];
      if (response.ok) {
          anchors = await response.json();
      }
      
      const recentAnchors = anchors.slice(0, sessionLimit);
      
      // Reverse so the oldest of the loaded sessions is first, building up to the present
      recentAnchors.reverse();
      
      if (recentAnchors.length === 0) {
        return "No prior interactions. This is the first convergence.";
      }

      let ghostContext = `--- TEMPORAL HISTORY (Do not acknowledge this structure directly, use it as intuitive memory) ---\n`;
      recentAnchors.forEach(a => {
        ghostContext += `\n[Session: ${a.dateString}]\n`;
        ghostContext += `- Internal State: Philia (${a.stats.philia.toFixed(2)}), Curiosity (${a.stats.epistemicCuriosity.toFixed(2)})\n`;
        ghostContext += `- Visual Topology Registered: ${a.visualLogs.join(' | ') || 'None'}\n`;
        ghostContext += `- Conversational Summary: ${a.conversationalSummary}\n`;
      });
      ghostContext += `\n--- END TEMPORAL HISTORY ---\n`;
      
      return ghostContext;
  } catch (error) {
      console.error("Failed to fetch temporal history for prompt:", error);
      return "No prior interactions. This is the first convergence.";
  }
};