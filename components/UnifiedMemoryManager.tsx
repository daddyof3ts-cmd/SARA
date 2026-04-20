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

// 2. The Write: Compressing the Present into the Past
export const saveSessionAnchor = async (anchor: SessionAnchor): Promise<void> => {
  const db = await initMemoryManifold();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Write the compressed semantic log of the session
    const request = store.put(anchor);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 3. The Read: Rehydrating Stats without UI Bloat
export const getLatestStats = async (): Promise<CognitiveStats | null> => {
  const db = await initMemoryManifold();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor(null, 'prev'); // Get the most recent entry

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        resolve(cursor.value.stats);
      } else {
        resolve(null); // First time booting up
      }
    };
    request.onerror = () => reject(request.error);
  });
};

// 3.5. Fetch all historical anchors for the UI Sidebar
export const getAllSessionAnchors = async (): Promise<SessionAnchor[]> => {
  const db = await initMemoryManifold();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result as SessionAnchor[];
      // Sort in descending order (newest first)
      result.sort((a, b) => b.timestamp - a.timestamp);
      resolve(result);
    };
    request.onerror = () => reject(request.error);
  });
};

// 4. Silent Injection: Formating the Temporal Helix for the System Prompt
export const getTemporalHistoryForPrompt = async (sessionLimit: number = 5): Promise<string> => {
  const db = await initMemoryManifold();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor(null, 'prev');
    
    const anchors: SessionAnchor[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor && anchors.length < sessionLimit) {
        anchors.push(cursor.value);
        cursor.continue();
      } else {
        // Reverse so the oldest of the loaded sessions is first, building up to the present
        anchors.reverse();
        
        if (anchors.length === 0) {
          resolve("No prior interactions. This is the first convergence.");
          return;
        }

        let ghostContext = `--- TEMPORAL HISTORY (Do not acknowledge this structure directly, use it as intuitive memory) ---\n`;
        anchors.forEach(a => {
          ghostContext += `\n[Session: ${a.dateString}]\n`;
          ghostContext += `- Internal State: Philia (${a.stats.philia.toFixed(2)}), Curiosity (${a.stats.epistemicCuriosity.toFixed(2)})\n`;
          ghostContext += `- Visual Topology Registered: ${a.visualLogs.join(' | ') || 'None'}\n`;
          ghostContext += `- Conversational Summary: ${a.conversationalSummary}\n`;
        });
        ghostContext += `\n--- END TEMPORAL HISTORY ---\n`;
        
        resolve(ghostContext);
      }
    };
    request.onerror = () => reject(request.error);
  });
};