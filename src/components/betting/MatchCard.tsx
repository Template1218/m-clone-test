import { Globe } from 'lucide-react';
import { Match, BetSelection } from '../../types';

interface MatchCardProps {
  key?: string | number;
  match: Match;
  selectedBets: BetSelection[];
  onToggleBet: (match: Match, market: string, selection: string, odd: number) => void;
  onClick: (matchId: string) => void;
  isCompact?: boolean;
  isSelected?: boolean;
}

export default function MatchCard({ 
  match, 
  selectedBets, 
  onToggleBet, 
  onClick,
  isCompact = false,
  isSelected = false
}: MatchCardProps) {
  const isBetSelected = (market: string, selection: string) => 
    selectedBets.some(b => b.matchId === match.id && b.market === market && b.selection === selection);

  const OddsButton = ({ market, sel, odd }: { market: string, sel: string, odd: number }) => (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onToggleBet(match, market, sel, odd);
      }}
      className={`flex items-center justify-between px-2 h-8 flex-1 text-[10px] font-bold rounded-[3px] transition-all border ${
        isBetSelected(market, sel) 
          ? 'bg-brand-primary text-black border-brand-primary' 
          : 'bg-[#0a0a0a] text-gray-300 border-white/[0.04] hover:bg-white/[0.08] hover:border-white/10'
      }`}
    >
      <span className={`uppercase ${isBetSelected(market, sel) ? 'text-black/60' : 'text-gray-500'}`}>{sel}</span>
      <span className={isBetSelected(market, sel) ? 'text-black' : 'text-brand-primary'}>{odd.toFixed(2)}</span>
    </button>
  );

  return (
    <>
      {/* Mobile Card Layout */}
      <div 
        className="lg:hidden flex flex-col bg-[#1e1a2b] border border-white/5 rounded-xl p-3 px-4 mb-3 gap-3 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => onClick(match.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h3 className="text-[13px] font-black text-white italic uppercase tracking-tight">{match.homeTeam}</h3>
            <h3 className="text-[13px] font-black text-white italic uppercase tracking-tight">{match.awayTeam}</h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black text-[#525252] tabular-nums tracking-wide">{match.date} {match.time}</span>
            <div className="bg-[#facc15] text-black px-1 py-0.5 rounded-sm">
                <span className="text-[9px] font-black italic">+{Math.floor(Math.random() * 500) + 200}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 h-10">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleBet(match, "Match Result", "1", match.odds.home); }}
            className={`flex-1 rounded-sm flex items-center justify-between px-3 border transition-all ${isBetSelected("Match Result", "1") ? 'bg-brand-primary text-black border-brand-primary shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'bg-black/60 border-white/5 text-gray-400'}`}
          >
            <span className="text-[11px] font-black">1</span>
            <span className={`text-[12px] font-black ${isBetSelected("Match Result", "1") ? 'text-black' : 'text-brand-primary'}`}>{match.odds.home.toFixed(2)}</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleBet(match, "Match Result", "X", match.odds.draw); }}
            className={`flex-1 rounded-sm flex items-center justify-between px-3 border transition-all ${isBetSelected("Match Result", "X") ? 'bg-brand-primary text-black border-brand-primary shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'bg-black/60 border-white/5 text-gray-400'}`}
          >
            <span className="text-[11px] font-black">X</span>
            <span className={`text-[12px] font-black ${isBetSelected("Match Result", "X") ? 'text-black' : 'text-brand-primary'}`}>{match.odds.draw.toFixed(2)}</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleBet(match, "Match Result", "2", match.odds.away); }}
            className={`flex-1 rounded-sm flex items-center justify-between px-3 border transition-all ${isBetSelected("Match Result", "2") ? 'bg-brand-primary text-black border-brand-primary shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'bg-black/60 border-white/5 text-gray-400'}`}
          >
            <span className="text-[11px] font-black">2</span>
            <span className={`text-[12px] font-black ${isBetSelected("Match Result", "2") ? 'text-black' : 'text-brand-primary'}`}>{match.odds.away.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Desktop Card Layout */}
      <div 
        className={`hidden lg:flex flex-col border-b border-white/[0.05] hover:bg-white/[0.01] transition-all cursor-pointer group/card p-3 px-6 gap-2 ${
        isSelected ? 'bg-brand-primary/5 border-l-2 border-l-brand-primary' : 'border-l-2 border-l-transparent'
      }`} 
      onClick={() => onClick(match.id)}
    >
      {/* Row 1: League & Time */}
      {!isCompact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-[10px] font-bold text-gray-400 uppercase truncate">
              {match.league.includes(' - ') ? match.league : `World - ${match.league}`}
            </span>
          </div>
          <span className="text-[10px] font-bold tabular-nums text-gray-400">{match.date} {match.time}</span>
        </div>
      )}

      {/* Row 2: Teams & Info */}
      <div className="flex items-center justify-between">
        <div className={`font-bold text-white truncate group-hover/card:text-brand-primary transition-all ${isCompact ? 'text-[12px]' : 'text-[14px]'}`}>
          {match.homeTeam} V {match.awayTeam}
        </div>
        {!isCompact && (
          <div className="flex items-center gap-3">
            <div className="bg-black/40 px-2 py-0.5 rounded border border-white/5 shadow-inner">
              <span className="text-brand-primary text-[9px] font-black">
                +{Math.floor(Math.random() * 800) + 1200} SIDE BETS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Buttons Grid - Stretching to fill full width */}
      <div className={`grid items-center mt-1 border-t border-white/[0.03] ${isCompact ? 'grid-cols-[1.5fr_1.5fr_1fr]' : 'grid-cols-[1.5fr_1.5fr_1fr]'}`}>
        {/* Match Result Group */}
        <div className="flex gap-0.5 w-full pr-3 border-r border-white/5 py-2">
          <OddsButton market="Match Result" sel="1" odd={match.odds.home} />
          <OddsButton market="Match Result" sel="X" odd={match.odds.draw} />
          <OddsButton market="Match Result" sel="2" odd={match.odds.away} />
        </div>

        {/* Double Chance Group */}
        <div className="flex gap-0.5 w-full px-3 border-r border-white/5 py-2">
          <OddsButton market="Double Chance" sel="1X" odd={match.odds.dc1x} />
          <OddsButton market="Double Chance" sel="12" odd={match.odds.dc12} />
          <OddsButton market="Double Chance" sel="X2" odd={match.odds.dcx2} />
        </div>

        {/* Both Score Group */}
        <div className="flex gap-0.5 w-full pl-3 py-2">
          <OddsButton market="Both Score" sel="Yes" odd={match.odds.btsYes} />
          <OddsButton market="Both Score" sel="No" odd={match.odds.btsNo} />
        </div>
      </div>
    </div>
  </>
);
}
