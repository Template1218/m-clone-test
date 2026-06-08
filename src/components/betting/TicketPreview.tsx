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
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-[320px] relative z-10 max-h-[95vh] flex flex-col"
          >
            {/* The Ticket Body - High Fidelity Clip Path */}
            <div 
              style={{ 
                clipPath: "polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(65% - 12px), calc(100% - 12px) 65%, 100% calc(65% + 12px), 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 calc(65% + 12px), 12px 65%, 0 calc(65% - 12px), 0 15px)" 
              }}
              className="bg-[#fdfdfd] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative flex flex-col overflow-hidden"
            >
              {/* Subtle Paper Texture Overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

              {/* Scrollable Container for the whole ticket content if needed */}
              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
                {/* Main Section */}
                <div className="p-6 pb-4 flex-shrink-0">
                  {/* Header */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-3 shadow-lg rotate-2">
                      <Ticket className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-black font-black text-[10px] uppercase tracking-[0.2em] italic">Ticket Preview</h2>
                    <div className="h-[2px] w-8 bg-black/5 mt-1.5" />
                  </div>

                  {/* Selections List */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[7px] font-bold uppercase tracking-[0.2em] text-gray-300 border-b border-black/5 pb-1.5">
                      <span>Selection Details</span>
                    </div>
                    
                    <div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-black/10 pr-2">
                      {selectedBets.map((bet, idx) => (
                        <div key={`${bet.matchId}-${idx}`} className="group">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-black font-extrabold text-[10px] uppercase leading-tight truncate">{bet.matchName}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[7px] font-bold text-gray-400 uppercase">{bet.market}</span>
                                <div className="w-0.5 h-0.5 rounded-full bg-gray-200" />
                                <span className="text-[8px] font-black text-brand-primary uppercase italic">{bet.selection}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-black font-black text-[11px] tabular-nums leading-none">{bet.odd.toFixed(2)}</div>
                              <div className="text-[6px] font-bold text-gray-300 uppercase mt-0.5">Fixed</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stub Section Divider (Visual Perforation) */}
                <div className="relative px-3 flex items-center flex-shrink-0">
                  <div className="flex-1 border-t border-dashed border-gray-200" />
                </div>

                {/* Stub Section (Footer) */}
                <div className="p-6 pt-5 bg-black/[0.01] flex-shrink-0">
                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between items-center text-[8px] font-bold">
                      <span className="text-gray-400 uppercase tracking-widest">Total Stake</span>
                      <span className="text-black font-black">{stake.toFixed(2)} ETB</span>
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-bold">
                      <span className="text-gray-400 uppercase tracking-widest">Comp. Odds</span>
                      <span className="text-black font-black">{totalOdds.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-bold text-rose-500/70">
                      <span className="uppercase tracking-widest">Tax Provision</span>
                      <span className="font-black italic">-{incomeTax.toFixed(2)}</span>
                    </div>
                    
                    <div className="pt-3 flex flex-col">
                      <span className="text-[7px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-1">Estimated Return</span>
                      <div className="flex items-baseline gap-1 leading-none">
                        <span className="text-2xl font-black text-black italic tracking-tighter">
                          {netWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] font-bold text-black/10 uppercase">ETB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button 
                      onClick={onPlaceBet} 
                      disabled={placing} 
                      className="w-full bg-black text-white font-black py-3.5 rounded-xl text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 italic shadow-lg overflow-hidden group/btn relative"
                    >
                      <span className="relative z-10">{placing ? "Processing..." : "Place Bet"}</span>
                      <div className="absolute inset-0 bg-brand-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                    </button>
                    <button 
                      onClick={onClose}
                      className="w-full font-bold py-1.5 text-[7px] uppercase tracking-[0.3em] text-gray-300 hover:text-black transition-all"
                    >
                      Void Ticket
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Security Band */}
              <div className="h-5 bg-black relative flex items-center justify-center overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-10 flex gap-1 items-center justify-center pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="h-full w-px bg-white skew-x-[30deg]" />
                  ))}
                </div>
                <div className="text-[5px] font-black text-white/40 uppercase tracking-[0.8em] relative z-10">
                  MEZZO•PREVIEW•SYSTEM
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
