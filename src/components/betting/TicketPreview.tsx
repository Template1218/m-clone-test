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
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2, y: 20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: 2, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-[340px] relative z-10"
          >
            {/* The Ticket Body - High Fidelity Clip Path */}
            <div 
              style={{ 
                clipPath: "polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(65% - 12px), calc(100% - 12px) 65%, 100% calc(65% + 12px), 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 calc(65% + 12px), 12px 65%, 0 calc(65% - 12px), 0 20px)" 
              }}
              className="bg-[#fdfdfd] shadow-[0_30px_70px_rgba(0,0,0,0.4)] relative flex flex-col"
            >
              {/* Subtle Paper Texture Overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

              {/* Main Section */}
              <div className="p-8 pb-4 flex-1">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mb-4 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-black font-black text-sm uppercase tracking-[0.25em] italic">Ticket Preview</h2>
                  <div className="h-px w-12 bg-black/10 mt-2" />
                </div>

                {/* Selections List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-[0.3em] text-gray-300 border-b border-black/5 pb-2">
                     <span>Selection Details</span>
                     <span>Multi</span>
                  </div>
                  
                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto no-scrollbar scroll-smooth">
                    {selectedBets.map((bet, idx) => (
                      <div key={`${bet.matchId}-${idx}`} className="group">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <div className="text-black font-black text-[10px] uppercase leading-tight group-hover:text-brand-primary transition-colors">{bet.matchName}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                               <span className="text-[7px] font-bold text-gray-400 uppercase">{bet.market}</span>
                               <div className="w-0.5 h-0.5 rounded-full bg-gray-200" />
                               <span className="text-[8px] font-black text-brand-primary uppercase italic">{bet.selection}</span>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-black font-black text-[11px] tabular-nums">{bet.odd.toFixed(2)}</div>
                             <div className="text-[6px] font-bold text-gray-300 uppercase">Fixed</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stub Section Divider (Visual Perforation) */}
              <div className="relative px-4 flex items-center">
                 <div className="flex-1 border-t border-dashed border-gray-200" />
              </div>

              {/* Stub Section (Footer) */}
              <div className="p-8 pt-6 bg-black/[0.01]">
                <div className="space-y-2.5 mb-6">
                  <div className="flex justify-between items-center text-[8px] font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">Total Stake</span>
                    <span className="text-black font-black">{stake.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">Comp. Odds</span>
                    <span className="text-black font-black underline decoration-brand-primary/30 decoration-2 underline-offset-2">{totalOdds.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-bold text-rose-500/70">
                    <span className="uppercase tracking-widest">Tax Provision</span>
                    <span className="font-black italic">-{incomeTax.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-4 flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[7px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1.5">Net Win Payout</span>
                      <div className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-3xl font-black text-black italic tracking-tighter">
                          {netWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] font-black text-black/20 uppercase tracking-tighter">ETB</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={onPlaceBet} 
                    disabled={placing} 
                    className="w-full bg-black text-white font-black py-4 rounded-xl text-[10px] tracking-[0.25em] uppercase hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 italic shadow-[0_10px_20px_rgba(0,0,0,0.1)] overflow-hidden group/btn relative"
                  >
                    <span className="relative z-10">{placing ? "Processing..." : "Place Bet"}</span>
                    <div className="absolute inset-0 bg-brand-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full font-black py-2 text-[7px] uppercase tracking-[0.4em] text-gray-300 hover:text-black transition-all"
                  >
                    Void Ticket
                  </button>
                </div>
              </div>

              {/* Bottom Security Band */}
              <div className="h-6 bg-black relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20 flex gap-1 items-center justify-center pointer-events-none">
                   {[...Array(30)].map((_, i) => (
                      <div key={i} className="h-full w-px bg-white/50 skew-x-[30deg]" />
                   ))}
                </div>
                <div className="text-[6px] font-black text-white/50 uppercase tracking-[1em] relative z-10 translate-x-[0.5em]">
                  MEZZO•PREVIEW•SYSTEM
                </div>
              </div>
            </div>
            
            {/* Holographic Seal (Extra Detail) */}
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center shadow-2xl border-4 border-white z-20 -rotate-12 select-none group pointer-events-none">
               <div className="text-[8px] font-black text-black uppercase leading-none text-center">
                 100%<br/><span className="text-[6px]">Safe</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
