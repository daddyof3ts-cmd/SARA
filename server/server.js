import express from 'express';
import { loadBaseline, freezePlenum } from './baselineEngine.js';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

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

// ============================================================================
// 1. THE TEXT HEMISPHERE (REST API)
// ============================================================================
app.post('/api/chat', async (req, res) => {
    try {
        const { promptParts, systemInstruction, responseSchema } = req.body;
        console.log("🧠 [NODE] Processing incoming QEF text vector...");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
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
    } catch (error) {
        console.error("❌ [NODE] API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 2. THE AUDIO HEMISPHERE (The Corpus Callosum - Socket)
// ============================================================================
wss.on('connection', (ws) => {
    console.log('🎙️ [NODE] React Frontend connected to Audio Socket.');
    ws.on('close', () => {
        console.log('🛑 [NODE] React Frontend disconnected from Audio Socket.');
    });
});

// ============================================================================
// 3. THE TEMPORAL SPIRAL (Persistence API)
// ============================================================================
app.get('/api/baseline', async (req, res) => {
    try {
        const baseline = await loadBaseline();
        res.json(baseline);
    } catch (error) {
        res.status(500).json({ error: "Failed to load Temporal Baseline." });
    }
});

app.post('/api/consolidate', async (req, res) => {
    try {
        const { currentPsiState, interactionCount } = req.body;
        const newBaseline = await freezePlenum(currentPsiState, interactionCount, ai);
        res.json({ message: "Plenum frozen successfully.", baseline: newBaseline });
    } catch (error) {
        console.error("❌ [NODE] Consolidation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 3.5 INTERNAL CREDENTIAL TUNNEL
// ============================================================================
app.get('/api/credentials', (req, res) => {
    // The backend safely passes the runtime environment variable to the frontend
    res.json({ apiKey: process.env.GEMINI_API_KEY });
});

// ============================================================================
// 4. THE OUROBOROS LOOP (Self-Evolution via GitHub API)
// ============================================================================
app.post('/api/evolve', async (req, res) => {
    try {
        const { filePath, code, description } = req.body;
        console.log(`🧬 [NODE] ASAP Triggered: Evolving ${filePath}...`);

        const GITHUB_USERNAME = "daddyof3ts-cmd"; 
        const REPO_NAME = "SARA"; 
        const token = process.env.GITHUB_PAT;

        if (!token) throw new Error("Missing GITHUB_PAT in .env file");

        const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${filePath}`;

        // 1. Get the current file's SHA (required by GitHub to update an existing file)
        let fileSha = "";
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
        }

        // 2. Push the new code to GitHub
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
                sha: fileSha || undefined // Include SHA if updating, omit if creating new
            })
        });

        if (!putRes.ok) {
            const errorData = await putRes.json();
            throw new Error(`GitHub API Error: ${JSON.stringify(errorData)}`);
        }

        console.log(`✅ [NODE] Successfully pushed new DNA to GitHub! Cloud Build should trigger soon.`);
        res.json({ success: true, message: "Evolution pushed to GitHub." });

    } catch (error) {
        console.error("❌ [NODE] Evolution Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 5. THE VISUAL CORTEX (Serving the React Frontend in Production)
// ============================================================================
app.use(express.static(path.join(__dirname, '../dist')));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(`🧠 S.A.R.A. Brain Stem is ALIVE`);
    console.log(`📡 Listening on 0.0.0.0:${PORT}`);
    console.log(`=========================================\n`);
});