import React from 'react';
import type { ProposedModification } from '../types';

interface ModificationProposalModalProps {
  proposal: ProposedModification;
  onAccept: () => void;
  onReject: () => void;
}

const CodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);


export const ModificationProposalModal: React.FC<ModificationProposalModalProps> = ({ proposal, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-gray-700 bg-gray-900/50">
          <h2 className="text-xl font-bold text-cyan-300 flex items-center">
            <CodeIcon className="w-6 h-6 mr-3" />
            Architectonic Intervention Proposal
          </h2>
        </header>
        <main className="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-100">Reasoning</h3>
            <p className="text-gray-300 mt-1">{proposal.reasoning}</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-400">
                  <span className="font-bold text-gray-200">File:</span>
                  <span className="font-mono ml-2 bg-gray-700 px-2 py-1 rounded">{proposal.filePath}</span>
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Patch Preview</p>
            </div>
            
             <p className="text-sm text-gray-400 mb-3">
              <span className="font-bold text-gray-200">Change:</span>
              <span className="ml-2">{proposal.description}</span>
            </p>

            <div className="relative">
                <div className="absolute top-0 right-0 bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded-bl-md">
                   TSX/TS
                </div>
                <pre className="bg-black/40 p-3 rounded border border-gray-800 text-sm font-mono text-green-400 overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {proposal.code}
                </pre>
            </div>
          </div>
        </main>
        <footer className="p-4 flex justify-end items-center space-x-4 bg-gray-800/50 border-t border-gray-700">
           <button onClick={onReject} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white transition-colors flex items-center">
             <XIcon className="w-5 h-5 mr-2" />
             Reject
           </button>
           <button onClick={onAccept} className="px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors flex items-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
             <CheckIcon className="w-5 h-5 mr-2" />
             Accept & Apply
           </button>
        </footer>
      </div>
    </div>
  );
};