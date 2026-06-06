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
      className="relative group cursor-pointer overflow-hidden rounded-md bg-[#111] text-left shadow-[0_1px_0_rgba(255,255,255,0.12)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-wait"
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-[#1a1a1a]">
        {hasImage ? (
          <img
            src={game.image}
            alt={game.name}
            className="h-full w-full object-fill"
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
          <div className="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[8px] font-black uppercase leading-none text-white shadow-md">
            New
          </div>
        )}


        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
          <div className="flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-[11px] font-black uppercase italic text-black shadow-[0_0_24px_rgba(193,223,31,0.55)]">
            <Play className="h-4 w-4 fill-black" />
            Play Now
          </div>
        </div>

        {launching && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
    </button>
  );
}
