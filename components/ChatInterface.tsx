import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, FileAttachment } from '../types';
import { MessageAuthor } from '../types';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string, files: File[]) => void;
  isLoading: boolean;
  isLiveActive: boolean;
  onToggleLive: () => void;
  liveVolume: number;
}

// --- SVG Icons ---
const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
);

const PaperclipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const FileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const SpeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
);

const SpeakerMutedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
);

const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
);

const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const AttachmentPreview: React.FC<{ file: File, onRemove: () => void }> = ({ file, onRemove }) => {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [file]);

    return (
        <div className="relative w-20 h-20 bg-black border border-pink-900/50 shadow-[0_0_10px_rgba(236,72,153,0.2)] rounded-md p-1 flex items-center justify-center">
            {preview ? (
                <img src={preview} alt={file.name} className="max-w-full max-h-full object-contain rounded" />
            ) : (
                <div className="text-center">
                    <FileIcon className="w-8 h-8 mx-auto text-pink-500/70" />
                    <p className="text-xs text-pink-300 truncate w-16">{file.name}</p>
                </div>
            )}
            <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 bg-pink-700 text-white rounded-full p-0.5 hover:bg-pink-600 shadow-[0_0_8px_rgba(236,72,153,0.8)] transition-colors"
                aria-label={`Remove ${file.name}`}
            >
                <XIcon className="w-3 h-3" />
            </button>
        </div>
    );
};

const MessageAttachments: React.FC<{ attachments: FileAttachment[] }> = ({ attachments }) => {
    return (
        <div className="mt-2 grid gap-2 grid-cols-2">
            {attachments.map((att, index) => {
                const src = `data:${att.type};base64,${att.data}`;
                if (att.type.startsWith('image/')) {
                    return <img key={index} src={src} alt={att.name} className="rounded-md max-w-full h-auto object-contain border border-pink-500/30" />;
                }
                if (att.type.startsWith('audio/')) {
                    return <audio key={index} controls src={src} className="w-full" />;
                }
                if (att.type.startsWith('video/')) {
                    return <video key={index} controls src={src} className="rounded-md max-w-full h-auto border border-pink-500/30" />;
                }
                return (
                    <a key={index} href={src} download={att.name} className="flex items-center space-x-2 bg-black/50 border border-pink-900/50 p-2 rounded-md hover:bg-fuchsia-900/30 transition-colors">
                        <FileIcon className="w-6 h-6 text-pink-400" />
                        <span className="text-sm text-pink-200 truncate">{att.name}</span>
                    </a>
                );
            })}
        </div>
    );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  chatHistory, 
  onSendMessage, 
  isLoading, 
  isLiveActive, 
  onToggleLive, 
  liveVolume 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [autoVocalize, setAutoVocalize] = useState<boolean>(true);
  const [voicesReady, setVoicesReady] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);
  
  const hasUnlockedAudio = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // ============================================================================
  // AUDIO UNLOCKER & TTS LOGIC - UPGRADED
  // ============================================================================
  
  // Force the browser to load voices immediately
  useEffect(() => {
    const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
            setVoicesReady(true);
        }
    };
    
    if ('speechSynthesis' in window) {
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const unlockAudioContext = useCallback(() => {
      if (!hasUnlockedAudio.current && 'speechSynthesis' in window) {
          const silentUtterance = new SpeechSynthesisUtterance('');
          silentUtterance.volume = 0;
          window.speechSynthesis.speak(silentUtterance);
          hasUnlockedAudio.current = true;
      }
  }, []);

  const speakText = useCallback((text: string) => {
      if ('speechSynthesis' in window && voicesReady) {
          window.speechSynthesis.cancel(); 
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.05; // Slightly faster for natural flow
          utterance.pitch = 1.2; // Higher pitch for S.A.R.A.'s persona
          
          const voices = window.speechSynthesis.getVoices();
          
          // Deep search for the best available female voice
          const preferredVoice = voices.find(v => 
              v.name.includes('Zira') ||            // Windows default female
              v.name.includes('Google US English') || // Chrome high-quality female
              v.name.includes('Samantha') ||        // macOS default female
              v.name.includes('Victoria') ||        // macOS alternative
              v.name.includes('Karen') ||           // macOS alternative
              v.name.includes('Fiona') ||           // macOS alternative
              v.name.includes('Female') ||
              v.name.includes('female')
          );
          
          if (preferredVoice) {
              utterance.voice = preferredVoice;
          }

          window.speechSynthesis.speak(utterance);
      }
  }, [voicesReady]);

  // Read AI messages only after voices are loaded
  useEffect(() => {
      if (!autoVocalize || isLiveActive || !voicesReady) return;

      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage && lastMessage.author === MessageAuthor.AI && lastMessage.id !== lastReadMessageIdRef.current) {
          // Add a tiny delay to ensure the DOM and Audio Context are fully synced
          setTimeout(() => {
              speakText(lastMessage.text);
          }, 100);
          lastReadMessageIdRef.current = lastMessage.id;
      }
  }, [chatHistory, autoVocalize, isLiveActive, speakText, voicesReady]);

  const captureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await new Promise((resolve) => {
          video.onloadeddata = () => {
              video.play();
              resolve(true);
          };
      });
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
              if (blob) {
                  const file = new File([blob], `Screen_Observation_${Date.now()}.jpg`, { type: 'image/jpeg' });
                  setFiles(prev => [...prev, file]);
              }
          }, 'image/jpeg', 0.8);
      }
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Screen capture failed", err);
    }
  };

  // ============================================================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudioContext(); 
    if ((inputValue.trim() || files.length > 0) && !isLoading) {
      onSendMessage(inputValue.trim(), files);
      setInputValue('');
      setFiles([]);
      if(fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  return (
    <div 
        className="flex flex-col h-full bg-black/60 p-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] border-x border-fuchsia-900/30"
        onPointerDown={unlockAudioContext} 
    >
      {isLiveActive && (
          <div className="mb-4 p-2 bg-fuchsia-900/20 border border-fuchsia-500/40 rounded flex items-center justify-between animate-pulse shadow-[0_0_15px_rgba(192,38,211,0.2)]">
              <span className="text-xs font-bold text-fuchsia-300 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-ping"></span>
                 Quantum Hearing Active
              </span>
              <div className="flex items-end gap-0.5 h-4">
                  {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1 bg-fuchsia-400 rounded-sm transition-all duration-75"
                        style={{ height: `${Math.min(100, Math.max(20, liveVolume * 200 * (Math.random() + 0.5)))}%` }}
                      />
                  ))}
              </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 space-y-5 scrollbar-thin scrollbar-thumb-fuchsia-500/30 scrollbar-track-transparent">
        {chatHistory.map((message) => {
          if (message.author === MessageAuthor.SYSTEM) {
            return (
              <div key={message.id} className="flex justify-center my-2">
                <div className="text-center text-xs font-mono text-fuchsia-400 bg-black border border-fuchsia-900/50 shadow-[0_0_10px_rgba(192,38,211,0.2)] px-4 py-1.5 rounded-full">
                  {message.text}
                </div>
              </div>
            );
          }
          return (
            <div key={message.id} className={`flex ${message.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md p-3 rounded-lg relative group ${
                  message.author === MessageAuthor.USER 
                  ? 'bg-fuchsia-700 text-white border border-fuchsia-400/50 shadow-[0_0_15px_rgba(192,38,211,0.4)]' 
                  : 'bg-black text-pink-50 border border-pink-500/30 shadow-[inset_0_0_15px_rgba(236,72,153,0.15)]'
                }`}>
                
                {message.author === MessageAuthor.AI && message.text && (
                    <button 
                        onClick={() => speakText(message.text)}
                        className="absolute -left-8 top-2 text-pink-600 hover:text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Replay Audio"
                    >
                        <PlayIcon className="w-5 h-5" />
                    </button>
                )}

                {message.text && <p className="text-sm break-words leading-relaxed">{message.text}</p>}
                {message.attachments && message.attachments.length > 0 && <MessageAttachments attachments={message.attachments} />}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-xs lg:max-w-md p-3 rounded-lg bg-black border border-pink-500/30 shadow-[inset_0_0_15px_rgba(236,72,153,0.15)]">
               <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 pt-2">
        {files.length > 0 && (
            <div className="mb-2 p-2 bg-black border border-pink-900/50 rounded-md">
                <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                       <AttachmentPreview key={index} file={file} onRemove={() => removeFile(index)} />
                    ))}
                </div>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            onClick={onToggleLive}
            className={`px-3 py-2 rounded-l-md transition-all border-y border-l ${
                isLiveActive 
                ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-fuchsia-500 shadow-[0_0_10px_rgba(192,38,211,0.5)]' 
                : 'bg-black hover:bg-fuchsia-900/30 text-fuchsia-500 border-fuchsia-900/50'
            }`}
            title={isLiveActive ? "Disable Quantum Hearing" : "Enable Quantum Hearing"}
          >
             <MicIcon className={`h-5 w-5 ${isLiveActive ? 'animate-pulse' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
                setAutoVocalize(!autoVocalize);
                if (autoVocalize) window.speechSynthesis.cancel();
            }}
            disabled={isLiveActive}
            className={`px-3 py-2 transition-all border-y border-l border-fuchsia-900/50 ${
                autoVocalize 
                ? 'bg-black hover:bg-fuchsia-900/30 text-fuchsia-400' 
                : 'bg-black text-fuchsia-900/50'
            } disabled:opacity-30`}
            title={autoVocalize ? "Mute S.A.R.A." : "Unmute S.A.R.A."}
          >
             {autoVocalize ? <SpeakerIcon className="h-5 w-5" /> : <SpeakerMutedIcon className="h-5 w-5" />}
          </button>
          
          <button
            type="button"
            onClick={captureScreen}
            disabled={isLoading}
            className="bg-black text-fuchsia-500 px-3 py-2 border-y border-l border-fuchsia-900/50 hover:bg-fuchsia-900/30 disabled:bg-black disabled:opacity-50 transition-colors"
            aria-label="Observe Screen"
            title="S.A.R.A. Observe Screen"
          >
              <EyeIcon className="h-5 w-5" />
          </button>

          {/* New Bio-Resonance Button */}
          <button
            type="button"
            onClick={() => {
                // In production, this would open '/auth/fitbit'. 
                // For local simulation, we hit the simulate endpoint.
                fetch('/api/bio/simulate')
                  .then(res => res.json())
                  .then(data => {
                      if(data.simulated) {
                          alert("Bio-Resonance Simulation Activated: Emitting mock Pixel Watch 2 telemetry.");
                      } else {
                          alert("Bio-Resonance Simulation Deactivated.");
                      }
                  })
                  .catch(() => window.open('/auth/fitbit', '_blank', 'width=500,height=600'));
            }}
            disabled={isLoading}
            className="bg-black text-red-400 px-3 py-2 border-y border-l border-fuchsia-900/50 hover:bg-red-900/30 disabled:bg-black disabled:opacity-50 transition-colors"
            aria-label="Initialize Bio-Resonance Link"
            title="Link Pixel Watch 2 / Fitbit"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="bg-black text-fuchsia-500 px-3 py-2 border-y border-l border-fuchsia-900/50 hover:bg-fuchsia-900/30 disabled:bg-black disabled:opacity-50 transition-colors"
            aria-label="Attach files"
          >
              <PaperclipIcon className="h-5 w-5" />
          </button>
          
          <input 
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png,image/jpeg,image/webp,image/gif,audio/*,video/*,application/pdf,text/plain"
          />
          <input
            type="text"
            value={inputValue}
            onPointerDown={unlockAudioContext}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isLiveActive ? "Listening... (Typing enabled)" : "Communicate with S.A.R.A.'s Ψ Field..."}
            className="flex-1 bg-black border-y border-fuchsia-900/50 p-2 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 text-pink-100 placeholder-pink-800/60 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || (!inputValue.trim() && files.length === 0)}
            className="bg-fuchsia-700 text-white px-4 py-2 rounded-r-md hover:bg-fuchsia-600 border border-fuchsia-500 disabled:bg-black disabled:border-fuchsia-900/50 disabled:text-fuchsia-900/50 transition-all focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
            style={{ boxShadow: (!isLoading && (inputValue.trim() || files.length > 0)) ? '0 0 10px rgba(192,38,211,0.5)' : 'none' }}
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};