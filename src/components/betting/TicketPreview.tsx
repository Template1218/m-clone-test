import { X, Ticket, Info, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BetSelection } from '../../types';

interface TicketPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBets: BetSelection[];
  stake: number;
  onPlaceBet: () => void;
  placing?: boolean;
}

export default function TicketPreview({ isOpen, onClose, selectedBets, stake, onPlaceBet, placing }: TicketPreviewProps) {
  const totalOdds = selectedBets.reduce((acc, current) => acc * current.odd, 1);
  const incomeTaxRate = 0.15;
  const potentialPayout = totalOdds * stake;
  const incomeTax = potentialPayout * incomeTaxRate;
  const netWin = potentialPayout - incomeTax;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0a0a0a] w-full max-w-xl rounded-[2.5rem] overflow-hidden relative z-10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border border-white/5"
          >
            {/* Header */}
            <div className="bg-brand-dark p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-white font-black text-lg uppercase tracking-widest italic leading-none">Ticket Preview</h2>
                  <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-1">Review your selections</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="bg-brand-dark/40 border border-white/5 rounded-3xl overflow-hidden">
                <div className="bg-white/5 px-6 py-3 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Selections ({selectedBets.length})</span>
                  <span>Odds</span>
                </div>
                
                <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto no-scrollbar">
                  {selectedBets.map((bet, idx) => (
                    <div key={`${bet.matchId}-${idx}`} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="text-white font-bold text-sm mb-1.5">{bet.matchName}</div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{bet.market}</span>
                          <div className="w-1 h-1 rounded-full bg-white/10" />
                          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-tight">{bet.selection}</span>
                        </div>
                        <span className="text-white font-black text-sm tabular-nums">{bet.odd.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-1 gap-3 px-2">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-gray-500" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Stake</span>
                  </div>
                  <span className="text-sm font-black text-white">{stake.toFixed(2)} <span className="text-[10px] text-gray-500">ETB</span></span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-gray-500" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Odds</span>
                  </div>
                  <span className="text-sm font-black text-white">{totalOdds.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-rose-500/20 rounded-full flex items-center justify-center">
                       <span className="text-[8px] font-bold text-rose-500">%</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tax (15%)</span>
                  </div>
                  <span className="text-sm font-black text-rose-400">-{incomeTax.toFixed(2)} <span className="text-[10px] text-rose-500/50">ETB</span></span>
                </div>
                
                <div className="pt-4 mt-2 border-t border-white/5 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Potential Payout</span>
                    <span className="text-3xl font-black text-brand-primary leading-none tabular-nums italic">
                      {netWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-brand-primary mb-0.5">ETB</span>
                </div>
              </div>

              {/* Action */}
              <button 
                onClick={onPlaceBet} 
                disabled={placing} 
                className="w-full bg-brand-primary text-black font-black py-5 rounded-2xl text-[13px] tracking-[0.2em] shadow-[0_10px_20px_rgba(193,223,31,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase disabled:opacity-60 disabled:scale-100 italic"
              >
                {placing ? "Processing..." : "Place Bet Online"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
