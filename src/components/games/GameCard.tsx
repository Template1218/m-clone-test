import { ShieldCheck } from 'lucide-react';
import { Game } from '../../types';

interface GameCardProps {
  key?: string | number;
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <div className="relative group cursor-pointer">
      {/* Main Card Container */}
      <div className="bg-brand-surface rounded-[24px] overflow-hidden border border-brand-border/50 transition-all duration-300 group-hover:border-brand-primary/50 group-hover:shadow-[0_0_30px_rgba(232,225,12,0.1)] p-1.5 h-full flex flex-col">
        {/* Game Image */}
        <div className="relative aspect-[1.8/1] rounded-[20px] overflow-hidden mb-3">
          <img 
            src={game.image} 
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* New Ribbon */}
          {game.isNew && (
            <div className="absolute top-0 left-0 bg-red-600 text-white font-black text-[10px] px-4 py-1 skew-x-[-20deg] translate-x-[-10px] translate-y-[5px] uppercase italic shadow-lg z-10">
              NEW
            </div>
          )}

          {/* Fairness Badge */}
          {game.fairness && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1.5 border border-white/10 z-10">
              <span className="text-[10px] font-black text-white italic uppercase">FAIRNESS</span>
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
            </div>
          )}

          {/* Coming Soon Overlay - Always visible but subtle until hover */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-all duration-300">
            <div className="bg-brand-yellow text-black font-black px-6 py-2 rounded-full text-[10px] uppercase italic tracking-widest shadow-xl border-2 border-black/10 group-hover:scale-110 transition-transform">
              Coming Soon
            </div>
          </div>
        </div>

        {/* Game Name - Centered like screenshot */}
        <div className="py-2.5 px-4 text-center mt-auto border-t border-white/[0.03]">
          <h3 className="text-white font-black text-[13px] uppercase italic tracking-wide group-hover:text-brand-primary transition-colors">
            {game.name}
          </h3>
        </div>
      </div>
    </div>
  );
}
