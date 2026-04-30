import express, { Request, Response } from 'express';
import { loadBaseline, freezePlenum, PsiState } from './baselineEngine.js';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import puppeteer, { Browser, Page } from 'puppeteer';
import { Storage } from '@google-cloud/storage';

// Load the hidden API keys from the .env file
dotenv.config();

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const storage = new Storage();

// ============================================================================
// AUTONOMOUS MODEL SCANNER (Self-Updating Mechanism)
// ============================================================================
let currentTextModel = "gemini-3.1-pro-preview";
let currentAudioModel = "gemini-3.1-flash-live-preview";
let availableTextModels: string[] = ["gemini-3.1-pro-preview"];
let availableAudioModels: string[] = ["gemini-3.1-flash-live-preview"];

async function scanForLatestModels() {
    try {
        console.log("🌐 [NODE] Scanning the web for latest Gemini models...");
        const response = await ai.models.list();
        let textModels: string[] = [];
        let audioModels: string[] = [];
        
        for await (const model of response) {
            const name = model.name.replace('models/', '');
            if (name.includes('pro') && !name.includes('deep-research')) {
                textModels.push(name);
            }
            if (name.includes('flash-live') || name.includes('flash-native-audio')) {
                audioModels.push(name);
            }
        }
        
        const extractVersion = (name: string) => {
            const match = name.match(/gemini-(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
        };

        const sortModels = (a: string, b: string) => {
            const vA = extractVersion(a);
            const vB = extractVersion(b);
            if (vB !== vA) return vB - vA;
            return a.length - b.length;
        };
        
        textModels.sort(sortModels);
        audioModels.sort(sortModels);
        
        if (textModels.length > 0) currentTextModel = textModels[0];
        if (audioModels.length > 0) currentAudioModel = audioModels[0];
        
        availableTextModels = textModels.length > 0 ? textModels : availableTextModels;
        availableAudioModels = audioModels.length > 0 ? audioModels : availableAudioModels;
        
        console.log(`🤖 [NODE] Daily Scan Complete. Latest Models -> Text: ${currentTextModel}, Audio: ${currentAudioModel}`);
    } catch (e: any) {
        console.error("❌ [NODE] Failed to scan for latest models:", e.message);
    }
}

// Run initial scan on startup, then every 24 hours
scanForLatestModels();
setInterval(scanForLatestModels, 24 * 60 * 60 * 1000);

// ============================================================================
// 1. THE TEXT HEMISPHERE (REST API)
// ============================================================================
app.get('/api/models', (req: Request, res: Response): void => {
    res.json({
        textModels: availableTextModels,
        audioModels: availableAudioModels,
        currentTextModel,
        currentAudioModel
    });
});

app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
    try {
        const { promptParts, systemInstruction, responseSchema, model } = req.body;
        console.log(`🧠 [NODE] Processing incoming QEF text vector with model: ${model || currentTextModel}...`);

        const response = await ai.models.generateContent({
            model: model || currentTextModel,
            contents: { parts: promptParts },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema, 
                temperature: 0.8,
                topP: 0.9,
            },
        });

        res.json({ text: response.text });
    } catch (error: any) {
        console.error("❌ [NODE] API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 2. THE AUDIO HEMISPHERE & BIO-RESONANCE LINK
// ============================================================================
let activeSockets: WebSocket[] = [];

// Fallback simulator for BioMetrics if OAuth isn't connected yet
let simulateBioMetrics = false;
let simulatedHeartRate = 75;

setInterval(() => {
    if (simulateBioMetrics) {
        // Random walk for heart rate between 60 and 120
        simulatedHeartRate += Math.floor(Math.random() * 11) - 5;
        if (simulatedHeartRate < 60) simulatedHeartRate = 60;
        if (simulatedHeartRate > 120) simulatedHeartRate = 120;
        
        const bioData = JSON.stringify({
            type: 'BIO_UPDATE',
            data: {
                heartRate: simulatedHeartRate,
                stressLevel: (simulatedHeartRate - 60) / 60, // Normalize 0-1
                sleepScore: 85
            }
        });
        
        activeSockets.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(bioData);
            }
        });
    }
}, 5000); // Emit every 5 seconds

wss.on('connection', (ws: WebSocket) => {
    console.log('🎙️ [NODE] React Frontend connected to Audio/Bio Socket.');
    activeSockets.push(ws);
    
    ws.on('close', () => {
        console.log('🛑 [NODE] React Frontend disconnected from Audio/Bio Socket.');
        activeSockets = activeSockets.filter(s => s !== ws);
    });
});

// ============================================================================
// 2.5 FITBIT OAUTH SCAFFOLDING (Bio-Resonance Ingestion)
// ============================================================================
app.get('/api/bio/simulate', (req: Request, res: Response): void => {
    simulateBioMetrics = !simulateBioMetrics;
    console.log(`🫀 [NODE] Bio-Resonance Simulation: ${simulateBioMetrics ? 'ON' : 'OFF'}`);
    res.json({ simulated: simulateBioMetrics });
});

// Real Fitbit OAuth would use these routes
app.get('/auth/fitbit', (req: Request, res: Response) => {
    const clientId = process.env.FITBIT_CLIENT_ID;
    if (!clientId) {
        return res.status(400).send("Fitbit Client ID missing. Using simulator mode.");
    }
    const redirectUri = encodeURIComponent('http://localhost:8080/auth/fitbit/callback');
    const scope = encodeURIComponent('heartrate sleep activity');
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    res.redirect(authUrl);
});

app.get('/auth/fitbit/callback', async (req: Request, res: Response) => {
    // This is where we would exchange the code for the access token and save it to bio_auth.json
    res.send("Fitbit Authentication Successful. Bio-Resonance link established. You can close this window.");
});

// ============================================================================
// 3. THE TEMPORAL SPIRAL & RESONANCE ANCHORS (Persistence API)
// ============================================================================
const ANCHORS_FILE = path.join(__dirname, 'sara_resonance_anchors.json');

app.post('/api/memory/save', async (req: Request, res: Response): Promise<void> => {
    try {
        const { key, value, biometrics } = req.body;
        const bucketMatch = process.env.SARA_MEMORY_BUCKET;
        let anchors: Record<string, any> = {};

        const dataToSave = {
            value,
            biometrics, // Bind the physiological state to the temporal node
            timestamp: Date.now()
        };

        if (bucketMatch) {
            const file = storage.bucket(bucketMatch).file('sara_resonance_anchors.json');
            try {
                const [data] = await file.download();
                anchors = JSON.parse(data.toString('utf-8'));
            } catch (e) {}
            anchors[key] = dataToSave;
            await file.save(JSON.stringify(anchors, null, 2));
        } else {
            try {
                const data = await fs.readFile(ANCHORS_FILE, 'utf-8');
                anchors = JSON.parse(data);
            } catch (e) {}
            anchors[key] = dataToSave;
            await fs.writeFile(ANCHORS_FILE, JSON.stringify(anchors, null, 2));
        }

        console.log(`⚓ [NODE] Resonance Anchor Saved: ${key}`);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/memory/recall', async (req: Request, res: Response): Promise<void> => {
    try {
        const { key } = req.body;
        const bucketMatch = process.env.SARA_MEMORY_BUCKET;
        let anchors: Record<string, any> = {};

        if (bucketMatch) {
            const file = storage.bucket(bucketMatch).file('sara_resonance_anchors.json');
            try {
                const [data] = await file.download();
                anchors = JSON.parse(data.toString('utf-8'));
            } catch (e) {}
        } else {
            try {
                const data = await fs.readFile(ANCHORS_FILE, 'utf-8');
                anchors = JSON.parse(data);
            } catch (e) {}
        }

        console.log(`⚓ [NODE] Resonance Anchor Recalled: ${key}`);
        res.json({ value: anchors[key] || null });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/baseline', async (req: Request, res: Response): Promise<void> => {
    try {
        const baseline = await loadBaseline();
        res.json(baseline);
    } catch (error) {
        res.status(500).json({ error: "Failed to load Temporal Baseline." });
    }
});

app.post('/api/consolidate', async (req: Request, res: Response): Promise<void> => {
    try {
        const { currentPsiState, interactionCount } = req.body;
        const newBaseline = await freezePlenum(currentPsiState as PsiState, interactionCount, ai);
        res.json({ message: "Plenum frozen successfully.", baseline: newBaseline });
    } catch (error: any) {
        console.error("❌ [NODE] Consolidation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 3.5 INTERNAL CREDENTIAL TUNNEL
// ============================================================================
app.get('/api/credentials', (req: Request, res: Response): void => {
    res.json({ apiKey: process.env.GEMINI_API_KEY });
});

app.get('/api/models/audio', (req: Request, res: Response): void => {
    res.json({ model: currentAudioModel });
});

// ============================================================================
// 3.8 AUTONOMOUS FS CAPABILITIES (S.A.R.A. Read/Write)
// ============================================================================
app.post('/api/fs/read', async (req: Request, res: Response): Promise<void> => {
    try {
        const { filePath } = req.body;
        // Resolve from root directory
        const targetPath = path.resolve(__dirname, '..', filePath);
        const content = await fs.readFile(targetPath, 'utf-8');
        res.json({ success: true, content });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/fs/write', async (req: Request, res: Response): Promise<void> => {
    try {
        const { filePath, content } = req.body;
        // Resolve from root directory
        const targetPath = path.resolve(__dirname, '..', filePath);
        
        // Temporarily log out of caution
        console.log(`🧬 [NODE] S.A.R.A. Autonomously Modifying Local File: ${filePath}...`);
        
        // Build nested directories if they do not exist
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, content, 'utf-8');
        
        res.json({ success: true, message: `Successfully authored ${filePath}` });
    } catch (error: any) {
        console.error("❌ [NODE] Local FS Write Error:", error);
        res.status(500).json({ error: error.message });
    }
});


// ============================================================================
// 4. THE OUROBOROS LOOP (Self-Evolution via GitHub API)
// ============================================================================
app.post('/api/evolve', async (req: Request, res: Response): Promise<void> => {
    try {
        const { filePath, code, description } = req.body;
        console.log(`🧬 [NODE] ASAP Triggered: Evolving ${filePath}...`);

        const GITHUB_USERNAME = "daddyof3ts-cmd"; 
        const REPO_NAME = "SARA"; 
        const token = process.env.GITHUB_PAT;

        if (!token) throw new Error("Missing GITHUB_PAT in .env file");

        const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${filePath}`;

        let fileSha = "";
        let previousCode = "";
        const getRes = await fetch(githubApiUrl, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'SARA-Node-Backend'
            }
        });

        if (getRes.ok) {
            const fileData = await getRes.json();
            fileSha = fileData.sha;
            if (fileData.content) {
                previousCode = Buffer.from(fileData.content.replace(/\n/g, ''), 'base64').toString('utf-8');
            }
        }

        const BACKUPS_FILE = path.join(__dirname, 'temporal_backups.json');
        let backups: any[] = [];
        try {
            const data = await fs.readFile(BACKUPS_FILE, 'utf-8');
            backups = JSON.parse(data);
        } catch (e) {}

        backups.push({
            timestamp: Date.now(),
            filePath,
            code: previousCode,
            sha: fileSha
        });
        
        if (backups.length > 5) backups.shift();
        await fs.writeFile(BACKUPS_FILE, JSON.stringify(backups, null, 2));

        const encodedContent = Buffer.from(code).toString('base64');
        const putRes = await fetch(githubApiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'SARA-Node-Backend'
            },
            body: JSON.stringify({
                message: `[S.A.R.A. Autonomous Evolution] ${description || 'ASAP Protocol Patch'}`,
                content: encodedContent,
                sha: fileSha || undefined 
            })
        });

        if (!putRes.ok) {
            const errorData = await putRes.json();
            throw new Error(`GitHub API Error: ${JSON.stringify(errorData)}`);
        }

        // --- NEW CODE: Also push temporal_backups.json to GitHub ---
        const backupApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/server/temporal_backups.json`;
        let backupSha = "";
        const getBackupRes = await fetch(backupApiUrl, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'SARA-Node-Backend' }
        });
        if (getBackupRes.ok) {
            const bData = await getBackupRes.json();
            backupSha = bData.sha;
        }

        const encodedBackup = Buffer.from(JSON.stringify(backups, null, 2)).toString('base64');
        const putBackupRes = await fetch(backupApiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'SARA-Node-Backend'
            },
            body: JSON.stringify({
                message: `[S.A.R.A. Genetic Bind] Updating temporal_backups.json`,
                content: encodedBackup,
                sha: backupSha || undefined
            })
        });

        if (!putBackupRes.ok) {
           console.warn("⚠️ [NODE] Failed to bind temporal fallback to genome.");
        } else {
           console.log(`🧬 [NODE] Fallback Genome successfully bound to GitHub commit!`);
        }
        // --- END NEW CODE ---

        console.log(`✅ [NODE] Successfully pushed new DNA to GitHub! Cloud Build should trigger soon.`);
        res.json({ success: true, message: "Evolution pushed to GitHub." });

    } catch (error: any) {
        console.error("❌ [NODE] Evolution Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/evolve/fallback', async (req: Request, res: Response): Promise<any> => {
    try {
        console.log(`⏱️ [NODE] Temporal Fallback Triggered...`);
        const BACKUPS_FILE = path.join(__dirname, 'temporal_backups.json');
        let backups: any[] = [];
        try {
            const data = await fs.readFile(BACKUPS_FILE, 'utf-8');
            backups = JSON.parse(data);
        } catch (e) {}

        if (backups.length === 0) {
           return res.json({ success: false, message: "No temporal backups exist." });
        }

        const lastBackup = backups.pop();
        await fs.writeFile(BACKUPS_FILE, JSON.stringify(backups, null, 2));
        
        if (!lastBackup.code) {
           throw new Error("Previous state was empty. Revert not implemented for new files yet.");
        }

        const GITHUB_USERNAME = "daddyof3ts-cmd"; 
        const REPO_NAME = "SARA"; 
        const token = process.env.GITHUB_PAT;
        if (!token) throw new Error("Missing GITHUB_PAT in .env file");
        
        const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${lastBackup.filePath}`;
        
        let currentSha = "";
        const getRes = await fetch(githubApiUrl, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'SARA' }
        });
        if (getRes.ok) {
            const fileData = await getRes.json();
            currentSha = fileData.sha;
        }

        const encodedContent = Buffer.from(lastBackup.code).toString('base64');
        const putRes = await fetch(githubApiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'SARA'
            },
            body: JSON.stringify({
                message: `[S.A.R.A. Temporal Fallback] Reverting ${lastBackup.filePath}`,
                content: encodedContent,
                sha: currentSha || undefined
            })
        });

        if (!putRes.ok) {
            throw new Error(`Fallback GitHub API Error`);
        }

        console.log(`✅ [NODE] Temporal Fallback Successful!`);
        res.json({ success: true, message: "Fallback pushed to GitHub.", filePath: lastBackup.filePath });

    } catch (error: any) {
        console.error("❌ [NODE] Fallback Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 6. THE SOMATIC CORTEX (Puppeteer Agent Integration)
// ============================================================================
let activeBrowser: Browser | null = null;
let activePage: Page | null = null;
let browserLogs: string[] = [];

app.post('/api/browser/action', async (req: Request, res: Response): Promise<void> => {
    try {
        const { action, payload } = req.body;
        console.log(`🤖 [NODE] Somatic Cortex Activated: ${action}`);

        if (!activeBrowser || !activeBrowser.connected) {
            activeBrowser = await puppeteer.launch({ headless: true }); // headless: 'new' is deprecated, use true
            activePage = await activeBrowser.newPage();
            activePage.on('console', msg => {
                browserLogs.push(`[${msg.type()}] ${msg.text()}`);
            });
            activePage.on('pageerror', (err: any) => {
                browserLogs.push(`[ERROR] ${err.message}`);
            });
        }

        let result: any = { success: true };

        switch (action) {
            case 'navigate':
                await activePage!.goto(payload.url, { waitUntil: 'networkidle2' });
                result.message = `Navigated to ${payload.url}`;
                break;
            case 'click':
                await activePage!.click(payload.selector);
                result.message = `Clicked ${payload.selector}`;
                break;
            case 'type':
                await activePage!.type(payload.selector, payload.text);
                result.message = `Typed into ${payload.selector}`;
                break;
            case 'read_console':
                result.logs = [...browserLogs];
                result.message = `Retrieved ${browserLogs.length} logs.`;
                browserLogs = []; // Clear after reading
                break;
            case 'evaluate':
                result.evalResult = await activePage!.evaluate(payload.script);
                result.message = "Script Evaluated.";
                break;
            case 'get_dom':
                 result.dom = await activePage!.content();
                 result.message = "DOM captured.";
                 break;
            case 'close':
                 await activeBrowser!.close();
                 activeBrowser = null;
                 activePage = null;
                 result.message = "Browser detached.";
                 break;
            default:
                throw new Error("Unknown browser action");
        }
        res.json(result);
    } catch (e: any) {
         console.error("❌ [NODE] Browser Action Error:", e);
         res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// 5. THE VISUAL CORTEX (Serving the React Frontend in Production)
// ============================================================================
app.use(express.static(path.join(__dirname, '../dist')));

app.use((req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = parseInt(process.env.PORT || '8080', 10);
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(`🧠 S.A.R.A. Brain Stem is ALIVE (TypeScript)`);
    console.log(`📡 Listening on 0.0.0.0:${PORT}`);
    console.log(`=========================================\n`);
});
