import { X } from 'lucide-react';
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-2xl overflow-hidden relative z-10 shadow-2xl"
          >
            {/* Header */}
            <div className="bg-white p-4 flex items-center justify-center border-b border-gray-200 relative">
              <h2 className="text-black font-black text-xl uppercase tracking-wider">TICKET PREVIEW</h2>
              <button 
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-500 hover:text-black transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="border border-black">
                <div className="bg-black text-white px-4 py-2 flex justify-between items-center text-sm font-bold">
                  <span className="uppercase">AKO</span>
                  <span className="uppercase">ODDS</span>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {selectedBets.map((bet, idx) => (
                    <div key={`${bet.matchId}-${idx}`} className="px-4 py-3">
                      <div className="text-black font-black text-xs mb-1">{bet.matchName}</div>
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-black uppercase">{bet.market} : {bet.selection}</span>
                        <span className="text-black">{bet.odd.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-black">Deposit</span>
                  <span className="text-black">{stake.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-black">Income Tax 15%</span>
                  <span className="text-black">{incomeTax.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-black">Possible Win</span>
                  <span className="text-black">{netWin.toFixed(2)} ETB</span>
                </div>
              </div>

              {/* Action */}
              <button onClick={onPlaceBet} disabled={placing} className="w-full bg-[#7CBB3D] text-black font-black py-4 rounded-full text-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all uppercase disabled:opacity-60">
                PLACE BET ONLINE
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
