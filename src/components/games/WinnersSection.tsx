import { useState, useEffect } from 'react';
import { Flame, Trophy, TrendingUp } from 'lucide-react';

const WINNERS = [
  { id: 'User_41**8', amount: 48250, currency: 'ETB', game: 'Aviator', color: 'bg-red-500' },
  { id: 'Player_09**2', amount: 12500, currency: 'ETB', game: 'Chicken', color: 'bg-yellow-500' },
  { id: 'Winner_77**0', amount: 94000, currency: 'ETB', game: 'JetX', color: 'bg-blue-500' },
  { id: 'Lucky_12**4', amount: 32100, currency: 'ETB', game: 'Rocketman', color: 'bg-purple-500' },
  { id: 'Pro_55**1', amount: 67800, currency: 'ETB', game: 'Plinko', color: 'bg-green-500' },
];

export default function WinnersSection() {
  const [jackpot, setJackpot] = useState(2540892.45);

  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot(prev => prev + Math.random() * 5.5);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-10 space-y-6">
      {/* Global Jackpot & Stats */}
      {/* Global Jackpot & Stats */}
      <div className="flex lg:grid lg:grid-cols-12 gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-1 -mx-1 sm:mx-0">
        <div className="flex-shrink-0 w-[85%] sm:w-auto lg:col-span-8 relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(193,223,31,0.05),transparent_70%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-brand-primary mb-1">
              <TrendingUp className="w-3 h-3 sm:w-4 h-4" />
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Global Arena Jackpot</span>
            </div>
            <div className="text-2xl sm:text-5xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {jackpot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="ml-1 sm:ml-2 text-sm sm:text-xl text-brand-primary not-italic tracking-normal font-bold">ETB</span>
            </div>
          </div>
          <div className="relative z-10 mt-3 sm:mt-0">
             <div className="px-4 sm:px-6 py-2 sm:py-3 bg-brand-primary rounded-full text-black font-black uppercase italic text-[10px] sm:text-sm shadow-[0_0_20px_rgba(193,223,31,0.4)] hover:shadow-[0_0_30px_rgba(193,223,31,0.6)] transition-all cursor-pointer">
               Win Now
             </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-[60%] sm:w-auto lg:col-span-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 p-4 sm:p-6 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Live Feedback</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-[8px] sm:text-[10px] font-black text-red-500 uppercase">Live</span>
            </div>
          </div>
          <div className="flex gap-2">
             <div className="flex-1 h-10 sm:h-12 bg-black/40 rounded-lg sm:rounded-xl border border-white/5 flex flex-col items-center justify-center">
                <span className="text-white font-black text-sm sm:text-lg leading-none">1.2k+</span>
                <span className="text-[7px] sm:text-[8px] uppercase text-gray-500 font-bold">Online</span>
             </div>
             <div className="flex-1 h-10 sm:h-12 bg-black/40 rounded-lg sm:rounded-xl border border-white/5 flex flex-col items-center justify-center">
                <span className="text-brand-primary font-black text-sm sm:text-lg leading-none">84%</span>
                <span className="text-[7px] sm:text-[8px] uppercase text-gray-500 font-bold">RTP</span>
             </div>
          </div>
        </div>
      </div>

      {/* Live Winners Feed */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar px-1">
        {WINNERS.map((winner, idx) => (
          <div 
            key={idx} 
            className="flex-shrink-0 w-[240px] bg-black/40 backdrop-blur-md rounded-xl border border-white/5 p-3 flex items-center gap-3 hover:border-brand-primary/30 transition-all cursor-pointer group hover:bg-black/60 shadow-xl"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border border-white/10 ${winner.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
              <Trophy className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </div>
            
            <div className="flex flex-1 flex-col overflow-hidden leading-tight">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-white font-black text-[11px] truncate opacity-70 italic">{winner.id}</span>
                <span className="text-brand-primary font-black text-[11px] italic">+{winner.amount.toLocaleString()}</span>
              </div>
              <div className="text-[10px] font-black uppercase text-gray-500 tracking-wider">in {winner.game}</div>
              <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-brand-primary w-2/3 group-hover:w-full transition-all duration-1000" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
