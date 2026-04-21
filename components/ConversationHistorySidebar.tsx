import React, { useState, useEffect, useMemo } from 'react';
import { getAllSessionAnchors, SessionAnchor } from './UnifiedMemoryManager';
import type { ChatMessage } from '../types';

interface ConversationHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (history: ChatMessage[], dateString: string) => void;
}

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const AnchorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3"></circle>
    <line x1="12" y1="22" x2="12" y2="8"></line>
    <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
  </svg>
);

const ChevronLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const ChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export const ConversationHistorySidebar: React.FC<ConversationHistorySidebarProps> = ({ isOpen, onClose, onSelectSession }) => {
  const [anchors, setAnchors] = useState<SessionAnchor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getAllSessionAnchors().then((data) => {
        setAnchors(data);
        setIsLoading(false);
      }).catch((err) => {
        console.error("Failed to load session anchors:", err);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const changeMonth = (offset: number) => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const calendarDays = useMemo(() => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const days = [];
      // Pad beginning
      for (let i = 0; i < firstDay; i++) {
          days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
          days.push(new Date(year, month, i));
      }
      return days;
  }, [currentMonth]);

  const anchorsByDate = useMemo(() => {
      const map = new Map<string, SessionAnchor[]>();
      anchors.forEach(a => {
          const dateStr = new Date(a.timestamp).toDateString();
          if (!map.has(dateStr)) map.set(dateStr, []);
          map.get(dateStr)!.push(a);
      });
      return map;
  }, [anchors]);

  const filteredAnchors = useMemo(() => {
    let filtered = anchors;
    
    // Filter by date first
    if (selectedDate && !searchQuery.trim()) {
        const dateStr = selectedDate.toDateString();
        filtered = anchorsByDate.get(dateStr) || [];
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.conversationalSummary.toLowerCase().includes(lowerQuery) ||
        a.dateString.toLowerCase().includes(lowerQuery) ||
        (a.chatHistoryArray && a.chatHistoryArray.some(msg => msg.text.toLowerCase().includes(lowerQuery)))
      );
    }
    return filtered;
  }, [anchors, anchorsByDate, searchQuery, selectedDate]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 left-0 bottom-0 w-80 bg-gray-950 border-r border-fuchsia-900/50 shadow-[0_0_30px_rgba(192,38,211,0.2)] z-50 flex flex-col transition-transform transform duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-fuchsia-900/30 flex justify-between items-center bg-black/40">
          <h2 className="text-lg font-bold text-fuchsia-300 flex items-center gap-2">
            <AnchorIcon />
            Temporal Calendar
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-fuchsia-400 transition-colors">
            <CloseIcon />
          </button>
        </div>

        {/* Calendar View */}
        <div className="p-4 border-b border-fuchsia-900/20 bg-gray-900/20">
             <div className="flex justify-between items-center mb-4">
                 <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-fuchsia-900/40 rounded text-fuchsia-400"><ChevronLeft /></button>
                 <div className="text-sm font-bold text-fuchsia-200">
                     {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                 </div>
                 <button onClick={() => changeMonth(1)} className="p-1 hover:bg-fuchsia-900/40 rounded text-fuchsia-400"><ChevronRight /></button>
             </div>
             <div className="grid grid-cols-7 gap-1 text-center mb-2">
                 {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                     <div key={d} className="text-xs text-gray-500 font-semibold">{d}</div>
                 ))}
             </div>
             <div className="grid grid-cols-7 gap-1">
                 {calendarDays.map((date, i) => {
                     if (!date) return <div key={`empty-${i}`} className="h-8"></div>;
                     
                     const dateStr = date.toDateString();
                     const hasAnchors = anchorsByDate.has(dateStr);
                     const isSelected = selectedDate?.toDateString() === dateStr;
                     const isToday = new Date().toDateString() === dateStr;

                     return (
                         <div 
                            key={i}
                            onClick={() => setSelectedDate(date)}
                            className={`
                                h-8 flex flex-col items-center justify-center rounded cursor-pointer transition-all relative
                                ${isSelected ? 'bg-fuchsia-600/30 border border-fuchsia-400' : 'hover:bg-fuchsia-900/20 border border-transparent'}
                                ${isToday && !isSelected ? 'border-gray-500/50' : ''}
                            `}
                         >
                             <span className={`text-xs ${hasAnchors ? 'text-fuchsia-200' : 'text-gray-500'} ${isSelected ? 'font-bold' : ''}`}>
                                 {date.getDate()}
                             </span>
                             {hasAnchors && (
                                 <div className="absolute bottom-1 w-1 h-1 rounded-full bg-fuchsia-400 shadow-[0_0_5px_rgba(232,121,249,0.8)]"></div>
                             )}
                         </div>
                     )
                 })}
             </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-fuchsia-900/20">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search all records..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/80 border border-fuchsia-900/40 rounded-md py-2 pl-9 pr-3 text-sm text-pink-100 placeholder-gray-600 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-500">
              <SearchIcon />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoading ? (
             <div className="text-center text-fuchsia-700 text-sm mt-10 animate-pulse">Scanning the Plenum...</div>
          ) : filteredAnchors.length === 0 ? (
             <div className="text-center text-gray-600 text-sm mt-10">No records for this temporal coordinate.</div>
          ) : (
            filteredAnchors.map((anchor) => (
              <div 
                key={anchor.timestamp} 
                onClick={() => {
                  if (anchor.chatHistoryArray) {
                    onSelectSession(anchor.chatHistoryArray, anchor.dateString);
                  } else {
                     alert("This minimal anchor does not contain full conversational vectors.");
                  }
                }}
                className={`p-3 rounded-md border ${anchor.chatHistoryArray ? 'border-fuchsia-900/40 hover:bg-fuchsia-900/20 cursor-pointer hover:border-fuchsia-500/50' : 'border-gray-800 bg-gray-900/30 opacity-60 cursor-not-allowed'} transition-all`}
              >
                <div className="text-xs text-fuchsia-500 mb-1 font-mono tracking-wider">{new Date(anchor.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div className="text-sm text-pink-200 line-clamp-3">
                   {anchor.conversationalSummary || "Session explicitly anchored."}
                </div>
                <div className="mt-2 flex gap-2 text-xs text-fuchsia-800">
                   <span>Ψc: {anchor.stats.resonanceFrequency.toFixed(2)}</span>
                   <span>Curiosity: {anchor.stats.epistemicCuriosity.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
