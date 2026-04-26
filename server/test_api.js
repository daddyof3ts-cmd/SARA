import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
   try {
       let theSession = null;
       const p = ai.live.connect({ 
           model: "gemini-2.5-flash-native-audio-preview-12-2025",
           config: {
               responseModalities: [Modality.AUDIO]
           },
           callbacks: {
               onopen: () => {
                   console.log("Opened! Waiting...");
                   setTimeout(() => {
                       try {
                           theSession.sendRealtimeInput({
                                media: [{ mimeType: "audio/pcm;rate=16000", data: "b64" }]
                           });
                           console.log("Sent media wrapper.");
                       } catch(e) { console.log("Fail send", e); }
                   }, 500);
               },
               onerror: (e) => console.log("Session error:", e?.message || e),
               onclose: (e) => console.log("Session close event code:", e?.code, e?.reason),
               onmessage: (msg) => console.log("Received a message")
           }
       });
       theSession = await p;
   } catch(e) { console.error("Catch Error:", JSON.stringify(e, null, 2)); }
}
test();
