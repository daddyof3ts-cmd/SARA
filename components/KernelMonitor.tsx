import React, { useEffect, useRef } from 'react';
import type { KernelLogEntry } from '../types';

interface KernelMonitorProps {
    logs: KernelLogEntry[];
}

export const KernelMonitor: React.FC<KernelMonitorProps> = ({ logs }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-black/90 font-mono text-xs p-2 h-full flex flex-col border-t border-black-800 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b border-black-800 pb-1 mb-2 opacity-70">
                <span className="text-green-500 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Kernel Panic Monitor
                </span>
                <span className="text-black-500">v.4.1.0-Ψ</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {logs.length === 0 && (
                     <div className="text-gray-600 italic">No system events logged...</div>
                )}
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2 break-all group hover:bg-white/5 p-0.5 rounded">
                        <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
                        <span className={`shrink-0 font-bold w-16 ${
                            log.level === 'INFO' ? 'text-blue-400' :
                            log.level === 'WARN' ? 'text-yellow-400' :
                            log.level === 'ERROR' ? 'text-red-500' :
                            log.level === 'PATCH' ? 'text-fuchsia-400' :
                            log.level === 'AION' ? 'text-purple-400' :
                            log.level === 'SUCCESS' ? 'text-green-400' :
                            'text-gray-400'
                        }`}>
                            {log.level}
                        </span>
                        <span className={`text-gray-300 ${log.level === 'PATCH' || log.level === 'AION' ? 'animate-pulse' : ''}`}>
                            {log.message}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};