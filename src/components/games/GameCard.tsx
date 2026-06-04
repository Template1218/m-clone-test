import { Loader2, Play, ShieldCheck } from 'lucide-react';
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
      className="relative group cursor-pointer text-left disabled:cursor-wait"
    >
      <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-[#111] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand-primary/60 group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#171717]">
          {hasImage ? (
            <img
              src={game.image}
              alt={game.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(232,225,12,0.22),transparent_30%),linear-gradient(145deg,#191919,#050505)] px-4 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-primary/30 bg-black/40 text-2xl font-black italic text-brand-primary shadow-[0_0_28px_rgba(232,225,12,0.12)]">
                {initials || "KG"}
              </div>
              <div className="line-clamp-2 text-sm font-black uppercase italic text-white">{game.name}</div>
              <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{game.provider}</div>
            </div>
          )}

          {game.isNew && (
            <div className="absolute left-3 top-3 rounded-md bg-red-600 px-2 py-1 text-[9px] font-black uppercase italic text-white shadow-lg">
              NEW
            </div>
          )}

          {game.fairness && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-black/65 px-2 py-1 backdrop-blur-md">
              <span className="text-[9px] font-black uppercase italic text-white">Fair</span>
              <ShieldCheck className="h-3 w-3 text-brand-primary" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent p-3 pt-12">
            <div className="mx-auto flex w-fit items-center justify-center gap-1.5 rounded-lg bg-brand-primary px-2.5 py-1.5 text-[9px] font-black uppercase italic text-black shadow-xl transition-transform group-hover:scale-[1.03]">
              {launching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-black" />}
              {launching ? "Opening" : "Play Now"}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-3 py-3">
          <h3 className="truncate text-[12px] font-black uppercase italic tracking-wide text-white transition-colors group-hover:text-brand-primary">
            {game.name}
          </h3>
          <p className="mt-1 truncate text-[10px] font-bold uppercase text-gray-500">{game.provider}</p>
        </div>
      </div>
    </button>
  );
}
