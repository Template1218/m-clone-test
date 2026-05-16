import { Trophy, Activity, ChevronDown, ChevronRight, Globe, BarChart2 } from 'lucide-react';
import { useState } from 'react';
import { useActiveOddsProvider, useFixtures } from '../../modules/betting/hooks';

const LIVE_MARKETS = ['Match result', 'Handicap', 'Total Goals', 'Both Teams To Score'];

const LIVE_MATCHES = [
  {
    id: 'l1',
    country: 'England',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Fulham',
    homeScore: 3,
    awayScore: 0,
    time: '78m',
    half: '2nd Half',
    odds: {
      '1': { value: '-', trend: null },
      'X': { value: '-', trend: null },
      '2': { value: '-', trend: null }
    }
  },
  {
    id: 'l2',
    country: 'Spain',
    league: 'La Liga',
    homeTeam: 'Deportivo Alaves',
    awayTeam: 'Athletic Bilbao',
    homeScore: 2,
    awayScore: 2,
    time: '79m',
    half: '2nd Half',
    odds: {
      '1': { value: 5.41, trend: 'down' },
      'X': { value: 1.5, trend: 'down' },
      '2': { value: 4.26, trend: 'up' }
    }
  },
  {
    id: 'l3',
    country: 'Spain',
    league: 'La Liga 2',
    homeTeam: 'Castellon',
    awayTeam: 'Cordoba',
    homeScore: 0,
    awayScore: 2,
    time: '79m',
    half: '2nd Half',
    odds: {
      '1': { value: 40.9, trend: 'down' },
      'X': { value: 11.7, trend: 'up' },
      '2': { value: 1.02, trend: 'down' }
    }
  }
];

export default function LiveView() {
  const [activeMarket, setActiveMarket] = useState('Match result');
  const { data: activeProvider = "apifootball" } = useActiveOddsProvider();
  const { data: allFixtures = [] } = useFixtures();
  
  // For demo, we consider fixtures starting within +/- 2 hours as "live" or use status if available
  const liveMatches = allFixtures.filter(f => {
     const now = new Date();
     const start = new Date(f.startsAt);
     const diff = Math.abs(now.getTime() - start.getTime());
     return diff < 2 * 60 * 60 * 1000; // 2 hours
  });

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(liveMatches[0]?.id || null);
  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId) || liveMatches[0];

  return (
    <div className="flex flex-col h-full text-white min-w-0">
      {/* Live Markets Navigation */}
      <div className="flex bg-brand-surface rounded-full overflow-hidden mb-4 p-1 border border-brand-border shrink-0">
        {LIVE_MARKETS.map((market) => (
          <button
            key={market}
            onClick={() => setActiveMarket(market)}
            className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase italic transition-all flex-1 ${
              activeMarket === market ? 'bg-[#7CBB3D] text-black shadow-lg' : 'text-gray-500 hover:text-white'
            }`}
          >
            {market}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden gap-4">
        {/* Match List Section */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 no-scrollbar bg-brand-surface rounded-2xl border border-brand-border shadow-xl h-fit">
          <div className="flex flex-col">
            {liveMatches.map((m) => (
              <div key={m.id} className="space-y-0">
                <div className="bg-[#181818] px-4 py-2 flex items-center justify-between border-b border-white/5">
                  <span className="text-[11px] font-bold text-[#86EFAC]/90 italic tracking-wide uppercase">{m.leagueName}</span>
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-[#7CBB3D]" />
                  </div>
                </div>

                <div 
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`border-b border-white/5 p-4 grid grid-cols-[1fr_240px] gap-4 transition-all cursor-pointer group ${selectedMatchId === m.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                       <span>Football</span> <span className="opacity-30">|</span> <span>{m.country}</span> <span className="opacity-30">|</span> <span>{m.leagueName}</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform">
                        <span className="text-[15px] font-black italic text-[#7CBB3D] tracking-tight">{m.homeTeam}</span>
                        <span className="text-[17px] font-black text-white tabular-nums">{m.homeScore || 0}</span>
                      </div>
                      <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform">
                        <span className="text-[15px] font-black italic text-white/90 tracking-tight">{m.awayTeam}</span>
                        <span className="text-[17px] font-black text-white tabular-nums">{m.awayScore || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[10px] font-black text-white/30 italic">+120</span>
                      <span className="text-[10px] font-black text-[#7CBB3D] uppercase italic tracking-wider">Live / {m.time}</span>
                    </div>
                  </div>
                  <div className="flex items-stretch gap-1">
                    {[
                      { l: '1', v: m.odds.home },
                      { l: 'X', v: m.odds.draw },
                      { l: '2', v: m.odds.away }
                    ].map((odd) => (
                      <div key={odd.l} className="flex-1 bg-black/40 rounded border border-white/[0.03] p-2 flex flex-col items-center justify-between group-hover:border-white/10 transition-colors">
                        <span className="text-[10px] font-black text-white/20 uppercase">{odd.l}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[14px] font-black text-[#7CBB3D] tracking-tighter">{odd.v.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Detail Section */}
        <div className="w-[480px] flex flex-col gap-4 overflow-y-auto no-scrollbar shrink-0">
          {/* Visual Header */}
          <div className="bg-brand-surface rounded-2xl overflow-hidden border border-brand-border shadow-xl">
            <div className="bg-[#111] p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                 <img src={`https://flagcdn.com/w20/${selectedMatch.country.toLowerCase() === 'england' ? 'gb' : 'es'}.png`} className="w-5" alt=""/>
                <span className="text-[11px] font-black uppercase italic text-white tracking-widest">{selectedMatch.country} - {selectedMatch.league}</span>
              </div>
              <div className="flex gap-1 items-end h-4">
                {[1,2,3].map(i => <div key={i} className={`w-1 rounded-full bg-brand-primary`} style={{ height: `${25 + i * 25}%` }} />)}
              </div>
            </div>

            {/* Pitch Visualizer */}
            <div className="relative h-[240px] bg-gradient-to-b from-[#0a180e] to-[#0c2e17] p-8 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              
              <div className="absolute inset-4 border border-white/5 rounded-sm" />
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/10 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/20 rounded-full" />

              <div className="relative z-10 w-full flex flex-col items-center gap-6">
                <div className="flex items-center justify-between w-full px-4">
                  <div className="flex flex-col items-center gap-1 w-32">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                      <span className="text-2xl">🛡️</span>
                    </div>
                    <span className="text-[13px] font-black italic uppercase text-white text-center leading-tight">{selectedMatch.homeTeam}</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="text-5xl font-black italic tracking-tighter text-white flex items-center gap-3">
                      <span>{selectedMatch.homeScore}</span>
                      <span className="text-brand-primary opacity-50 text-3xl">:</span>
                      <span>{selectedMatch.awayScore}</span>
                    </div>
                    <div className="text-brand-primary font-black text-[12px] italic uppercase tracking-[0.2em] mt-2 drop-shadow-sm">{selectedMatch.time}</div>
                  </div>

                  <div className="flex flex-col items-center gap-1 w-32">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                      <span className="text-2xl">⚔️</span>
                    </div>
                    <span className="text-[13px] font-black italic uppercase text-white text-center leading-tight">{selectedMatch.awayTeam}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-black/60 backdrop-blur-sm px-6 py-2 rounded-full border border-white/5 shadow-2xl">
                   <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">1st Half</span>
                      <span className="text-[11px] font-black text-white">(3:0)</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">2nd Half</span>
                      <span className="text-[11px] font-black text-brand-primary">(0:0)</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Stats Summary Line */}
            <div className="bg-[#111] p-3 grid grid-cols-3 gap-1 border-t border-white/5">
                {[
                  { label: 'Attacks', h: 124, a: 82 },
                  { label: 'D. Attacks', h: 58, a: 41 },
                  { label: 'Possession', h: '62%', a: '38%' }
                ].map(stat => (
                  <div key={stat.label} className="flex flex-col items-center gap-0.5">
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-tighter">{stat.label}</span>
                    <div className="flex items-center gap-2 text-[11px] font-black italic">
                      <span className="text-white">{stat.h}</span>
                      <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden flex">
                        <div className="bg-brand-primary h-full" style={{ width: '60%' }} />
                        <div className="bg-gray-700 h-full flex-1" />
                      </div>
                      <span className="text-white/60">{stat.a}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Markets Navigation Tabs */}
          <div className="flex bg-brand-surface rounded-full p-1 border border-brand-border overflow-x-auto no-scrollbar shrink-0">
            {['Main', 'Goals', 'Handicap', '2nd Half', 'Corners', 'Fouls', 'Offsides'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase italic whitespace-nowrap transition-all ${
                  tab === 'Main' ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Market Sections */}
          <div className="space-y-4">
            {/* Both Teams to Score */}
            <div className="bg-brand-surface rounded-2xl overflow-hidden border border-brand-border shadow-lg">
              <div className="bg-[#111] p-3 flex items-center justify-between border-b border-white/5 px-4">
                <span className="text-[11px] font-black uppercase italic text-white/80 tracking-widest">Both Teams to Score</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <button className="flex items-center justify-between px-5 py-3 bg-black/40 rounded-xl border border-white/5 hover:border-[#7CBB3D]/40 transition-all group">
                  <span className="text-[11px] font-black italic text-gray-400 group-hover:text-white uppercase">Yes</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-green-500" />
                    <span className="text-[16px] font-black text-[#7CBB3D] tracking-tighter">4.99</span>
                  </div>
                </button>
                <button className="flex items-center justify-between px-5 py-3 bg-black/40 rounded-xl border border-white/5 hover:border-[#7CBB3D]/40 transition-all group">
                  <span className="text-[11px] font-black italic text-gray-400 group-hover:text-white uppercase">No</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[6px] border-t-red-600" />
                    <span className="text-[16px] font-black text-[#7CBB3D] tracking-tighter">1.14</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Correct Score */}
            <div className="bg-brand-surface rounded-2xl overflow-hidden border border-brand-border shadow-lg">
              <div className="bg-[#111] p-3 flex items-center justify-between border-b border-white/5 px-4">
                <span className="text-[11px] font-black uppercase italic text-white/80 tracking-widest">Correct Score</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="p-1.5 space-y-1">
                {[
                  { s: '3-0', o: 1.37, t: 'down' },
                  { s: '3-1', o: 6.02, t: 'up' },
                  { s: '3-2', o: 41, t: 'up' },
                  { s: '4-0', o: 2.89, t: 'down' },
                  { s: '4-1', o: 13.7, t: null },
                  { s: '4-2', o: 65, t: 'up' },
                ].map((item) => (
                  <div key={item.s} className="grid grid-cols-[1fr_80px_80px_80px] gap-1.5 px-1.5">
                    <button className="bg-black/30 hover:bg-white/[0.05] rounded-lg px-4 py-2 flex items-center justify-between group transition-all text-left border border-white/5">
                      <span className="text-[12px] font-black italic text-gray-400 group-hover:text-white">{item.s}</span>
                      <div className="flex items-center gap-1.5">
                        {item.t && (
                           <div className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent ${item.t === 'up' ? 'border-b-[5px] border-b-green-500' : 'border-t-[5px] border-t-red-600'}`} />
                        )}
                        <span className="text-[14px] font-black text-[#7CBB3D]">{item.o}</span>
                      </div>
                    </button>
                    <div className="bg-black/20 rounded-lg border border-white/[0.02]" />
                    <div className="bg-black/20 rounded-lg border border-white/[0.02]" />
                    <div className="bg-black/20 rounded-lg border border-white/[0.02]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Goals Odd/Even */}
            <div className="bg-brand-surface rounded-2xl overflow-hidden border border-brand-border shadow-lg">
              <div className="bg-[#111] p-3 flex items-center justify-between border-b border-white/5 px-4">
                <span className="text-[11px] font-black uppercase italic text-white/80 tracking-widest">Goals Odd/Even</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-between px-5 py-3 bg-black/40 rounded-xl border border-white/5 hover:border-[#7CBB3D]/40 transition-all group">
                  <span className="text-[11px] font-black italic text-gray-400 group-hover:text-white uppercase">Odd</span>
                  <span className="text-[16px] font-black text-[#7CBB3D] tracking-tighter">1.44</span>
                </button>
                <button className="flex items-center justify-between px-5 py-3 bg-black/40 rounded-xl border border-white/5 hover:border-[#7CBB3D]/40 transition-all group">
                  <span className="text-[11px] font-black italic text-gray-400 group-hover:text-white uppercase">Even</span>
                  <span className="text-[16px] font-black text-[#7CBB3D] tracking-tighter">2.62</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
