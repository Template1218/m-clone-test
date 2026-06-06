import { Loader2, Play } from 'lucide-react';
import { Game } from '../../types';

interface GameCardProps {
  key?: string | number;
  game: Game;
  launching?: boolean;
  onLaunch?: (game: Game) => void;
}

export default function GameCard({ game, launching = false, onLaunch }: GameCardProps) {
  const initials = game.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const hasImage = Boolean(String(game.image || "").trim());

  return (
    <button
      type="button"
      onClick={() => onLaunch?.(game)}
      disabled={launching}
      aria-label={`Play ${game.name}`}
      className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-[#121212] text-left shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-primary/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(193,223,31,0.1)] disabled:cursor-wait"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        {hasImage ? (
          <img
            src={game.image}
            alt={game.name}
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(193,223,31,0.3),transparent_30%),linear-gradient(145deg,#1a1a1a,#0a0a0a)] px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-brand-primary/50 bg-black/60 text-2xl font-black italic text-brand-primary">
              {initials || "KG"}
            </div>
          </div>
        )}

        {game.isNew && (
          <div className="absolute left-3 top-3 rounded-[4px] bg-red-600 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/20">
            New
          </div>
        )}


        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent px-4 pb-4 pt-10">
          <div className="truncate text-[11px] font-black uppercase italic tracking-wider text-white drop-shadow-md">
            {game.name}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <div className="flex items-center gap-2 bg-brand-primary px-6 py-3 rounded-sm text-[12px] font-black uppercase italic text-black shadow-[0_0_30px_rgba(193,223,31,0.6)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Play className="h-4 w-4 fill-black" />
            Play Now
          </div>
        </div>

        {launching && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        )}
      </div>
    </button>
  );
}
