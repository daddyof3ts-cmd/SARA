import express from 'express';
import { loadBaseline, freezePlenum } from './baselineEngine.js';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

// Load the hidden API key from the .env file
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
// 4. THE VISUAL CORTEX (Serving the React Frontend in Production)
// ============================================================================
// FIX: Point up one directory level to the Vite 'dist' folder
app.use(express.static(path.join(__dirname, '../dist')));

// FIX: Catch-all route to hand frontend routing back to React (Express 5 safe)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// FIX: Explicitly bind to '0.0.0.0' for Google Cloud Run
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(`🧠 S.A.R.A. Brain Stem is ALIVE`);
    console.log(`📡 Listening on 0.0.0.0:${PORT}`);
    console.log(`=========================================\n`);
});