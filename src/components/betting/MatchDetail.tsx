import React, { useState } from 'react';
import { ChevronDown, Globe, Info, ChevronUp } from 'lucide-react';
import { Match, BetSelection } from '../../types';

interface MatchDetailProps {
  match: Match;
  selectedBets: BetSelection[];
  onToggleBet: (match: Match, market: string, selection: string, odd: number) => void;
  onBack: () => void;
}

interface MarketSectionProps {
  key?: string | number;
  title: string;
  children: React.ReactNode;
  hasInfo?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

const MarketSection = ({ title, children, hasInfo = false, isExpanded, onToggle }: MarketSectionProps) => (
  <div className="mb-2 bg-brand-surface border border-brand-border rounded overflow-hidden">
    <div 
      className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase text-gray-300">{title}</span>
        {hasInfo && <Info className="w-3 h-3 text-brand-primary cursor-help" />}
      </div>
      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
    </div>
    {isExpanded && (
      <div className="p-4 border-t border-brand-border bg-brand-dark/20 text-white">
        {children}
      </div>
    )}
  </div>
);

export default function MatchDetail({ match, selectedBets, onToggleBet, onBack }: MatchDetailProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Match Result': true,
    '1UP': true,
    '2UP': true,
    'Double Chance': true,
    'Both Teams to Score': false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isSelected = (market: string, selection: string) => 
    selectedBets.some(b => b.matchId === match.id && b.market === market && b.selection === selection);

  return (
    <div className="w-full pb-10">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between mb-4 bg-brand-surface/50 p-2 rounded border border-brand-border lg:hidden">
        <button 
          onClick={onBack}
          className="text-brand-primary text-xs font-bold hover:underline"
        >
          &larr; BACK
        </button>
      </div>

      {/* Visual Header */}
      <div className="relative h-44 lg:h-48 rounded-lg overflow-hidden mb-6 border border-brand-border shadow-2xl">
        <div className="absolute inset-0 bg-green-900/40 z-0">
          {/* Simple Pitch Layout */}
          <div className="absolute inset-0 border-2 border-white/20 m-4 rounded flex items-center justify-between px-4 lg:px-20">
            <div className="w-16 lg:w-24 h-full border-r-2 border-white/20 flex-shrink-0" />
            <div className="w-24 lg:w-48 h-24 lg:h-48 border-2 border-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 bg-white/20 rounded-full" />
            </div>
            <div className="w-16 lg:w-24 h-full border-l-2 border-white/20 flex-shrink-0" />
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2" />
          </div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-between p-4 lg:p-6">
          <div className="flex items-center gap-2 text-[10px] lg:text-xs font-bold text-brand-primary">
            <Globe className="w-3 h-3 lg:w-4 lg:h-4" />
            {match.country} - {match.league}
          </div>

          <div className="flex items-center justify-center gap-4 lg:gap-12 text-center">
            <div className="flex flex-col items-center gap-2 lg:gap-4 flex-1">
              <div className="w-14 h-14 lg:w-20 lg:h-20 bg-brand-surface rounded-full flex items-center justify-center border-2 lg:border-4 border-brand-primary/20 p-1 lg:p-2 shadow-inner">
                 <div className="bg-white/10 rounded-full w-full h-full flex items-center justify-center text-xl lg:text-3xl">🛡️</div>
              </div>
              <span className="text-xs lg:text-xl font-black uppercase italic tracking-tighter truncate w-full">{match.homeTeam}</span>
            </div>

            <div className="flex flex-col items-center gap-1 lg:gap-2">
              <div className="text-2xl lg:text-4xl font-black text-brand-primary italic">VS</div>
              <div className="text-[8px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{match.time}</div>
            </div>

            <div className="flex flex-col items-center gap-2 lg:gap-4 flex-1">
               <div className="w-14 h-14 lg:w-20 lg:h-20 bg-brand-surface rounded-full flex items-center justify-center border-2 lg:border-4 border-brand-primary/20 p-1 lg:p-2 shadow-inner">
                 <div className="bg-white/10 rounded-full w-full h-full flex items-center justify-center text-xl lg:text-3xl">🛡️</div>
              </div>
              <span className="text-xs lg:text-xl font-black uppercase italic tracking-tighter truncate w-full">{match.awayTeam}</span>
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* Markets */}
      <div className="space-y-4">
         <div className="flex items-center justify-between mb-2">
            <div className="bg-brand-primary text-black text-[10px] font-black px-4 py-1.5 rounded-sm skew-x-[-15deg] uppercase">Main Markets</div>
         </div>

         <MarketSection 
            title="Match Result"
            isExpanded={expandedSections['Match Result']}
            onToggle={() => toggleSection('Match Result')}
          >
            <div className="grid grid-cols-3 gap-2">
              {[
                { sel: '1', odd: match.odds.home },
                { sel: 'X', odd: match.odds.draw },
                { sel: '2', odd: match.odds.away }
              ].map(o => (
                <button 
                  key={o.sel}
                  onClick={() => onToggleBet(match, 'Match Result', o.sel, o.odd)}
                  className={`bet-button flex justify-between items-center py-3 px-4 ${isSelected('Match Result', o.sel) ? 'bet-button-active' : ''}`}
                >
                  <span className="font-bold">{o.sel === '1' ? match.homeTeam : o.sel === '2' ? match.awayTeam : 'Draw'}</span>
                  <span className="text-brand-primary font-bold group-active:text-black">{o.odd.toFixed(2)}</span>
                </button>
              ))}
            </div>
         </MarketSection>

         <MarketSection 
            title="1UP" 
            hasInfo
            isExpanded={expandedSections['1UP']}
            onToggle={() => toggleSection('1UP')}
          >
            <div className="grid grid-cols-3 gap-2">
              {[
                { sel: '1', odd: 1.31 },
                { sel: 'X', odd: 4.09 },
                { sel: '2', odd: 2.07 }
              ].map(o => (
                <button 
                  key={o.sel}
                  onClick={() => onToggleBet(match, '1UP', o.sel, o.odd)}
                  className={`bet-button flex justify-between items-center py-3 px-4 ${isSelected('1UP', o.sel) ? 'bet-button-active' : ''}`}
                >
                  <span className="font-bold">{o.sel}</span>
                  <span className="text-brand-primary font-bold">{o.odd.toFixed(2)}</span>
                </button>
              ))}
            </div>
         </MarketSection>

         <MarketSection 
            title="Double Chance"
            isExpanded={expandedSections['Double Chance']}
            onToggle={() => toggleSection('Double Chance')}
          >
            <div className="grid grid-cols-3 gap-2">
              {[
                { sel: '1X', odd: match.odds.dc1x },
                { sel: '12', odd: match.odds.dc12 },
                { sel: 'X2', odd: match.odds.dcx2 }
              ].map(o => (
                <button 
                  key={o.sel}
                  onClick={() => onToggleBet(match, 'Double Chance', o.sel, o.odd)}
                  className={`bet-button flex justify-between items-center py-3 px-4 ${isSelected('Double Chance', o.sel) ? 'bet-button-active' : ''}`}
                >
                  <span className="font-bold">{o.sel}</span>
                  <span className="text-brand-primary font-bold">{o.odd.toFixed(2)}</span>
                </button>
              ))}
            </div>
         </MarketSection>

         <MarketSection 
            title="Both Teams to Score"
            isExpanded={expandedSections['Both Teams to Score']}
            onToggle={() => toggleSection('Both Teams to Score')}
          >
            <div className="grid grid-cols-2 gap-2">
              {[
                { sel: 'Yes', odd: match.odds.btsYes },
                { sel: 'No', odd: match.odds.btsNo }
              ].map(o => (
                <button 
                  key={o.sel}
                  onClick={() => onToggleBet(match, 'Both Teams to Score', o.sel, o.odd)}
                  className={`bet-button flex justify-between items-center py-3 px-4 ${isSelected('Both Teams to Score', o.sel) ? 'bet-button-active' : ''}`}
                >
                  <span className="font-bold">{o.sel}</span>
                  <span className="text-brand-primary font-bold">{o.odd.toFixed(2)}</span>
                </button>
              ))}
            </div>
         </MarketSection>

         {['Correct Score', 'Draw No Bet', 'Goals Odd/Even'].map(market => (
           <MarketSection 
              key={market} 
              title={market}
              isExpanded={expandedSections[market] || false}
              onToggle={() => toggleSection(market)}
            >
              <div className="text-center text-gray-500 py-4 text-xs italic">Loading additional markets...</div>
           </MarketSection>
         ))}
      </div>
    </div>
  );
}
