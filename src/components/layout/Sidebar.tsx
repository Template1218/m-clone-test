import { Trophy, ChevronRight, ChevronDown, Globe } from 'lucide-react';
import { TOP_LEAGUES } from '../../data';
import { useCatalog, useMezzoTopLeagues, usePissbetTopLeagues } from '../../modules/betting/hooks';
import { useState, useRef, useEffect } from 'react';
import SidebarSkeleton from './SidebarSkeleton';

interface SidebarProps {
  activeSport: string | null;
  onSportChange: (id: string | null) => void;
  activeLeague: string | null;
  onLeagueChange: (params: { name: string | null; id: string | null; apiFootballLeagueId: string | null }) => void;
  timeFilter: string;
  onTimeFilterChange: (filter: string) => void;
  isHot: boolean;
  onIsHotChange: (val: boolean) => void;
  className?: string;
}

export default function Sidebar({ 
  activeSport, 
  onSportChange, 
  activeLeague, 
  onLeagueChange, 
  timeFilter, 
  onTimeFilterChange,
  isHot,
  onIsHotChange,
  className
}: SidebarProps) {
  const [expandedSports, setExpandedSports] = useState<string[]>([]);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTimeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSport = (sportId: string) => {
    setExpandedSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(id => id !== sportId) 
        : [...prev, sportId]
    );
  };

  const { data: catalog, isLoading } = useCatalog();
  
  const isStructured = catalog && !Array.isArray(catalog);
  const sports = isStructured ? (catalog as any).sports : (catalog || []);
  const topLeagues = isStructured ? (catalog as any).topLeagues : TOP_LEAGUES;
  const isApiFootball = isStructured && (catalog as any).provider === "apifootball";
  const isPissbet = isStructured && (catalog as any).provider === "pissbet_socket";
  const isMezzo = isStructured && (catalog as any).provider === "mezzo";

  const { data: pissbetTopLeaguesResp } = usePissbetTopLeagues(isPissbet);
  const pissbetTopLeagues = Array.isArray((pissbetTopLeaguesResp as any)?.data) ? (pissbetTopLeaguesResp as any).data : [];

  const { data: mezzoTopLeaguesResp } = useMezzoTopLeagues(isMezzo);
  const mezzoTopLeaguesRaw = Array.isArray((mezzoTopLeaguesResp as any)?.data) ? (mezzoTopLeaguesResp as any).data : [];
  const mezzoTopLeagues = mezzoTopLeaguesRaw
    .map((l: any) => ({
      id: String(l?.id ?? l?.competitionId ?? ""),
      name: String(l?.name ?? l?.competitionName ?? l?.fullName ?? "").trim(),
      country: String(l?.country ?? "").trim(),
      sportId: l?.sportId ?? null,
      sportName: l?.sportName ?? null,
      eventsCount: Number(l?.eventsCount ?? 0) || 0,
      apiFootballLeagueId: null,
    }))
    .filter((l: any) => l.id && l.name);

  const fallbackTopLeaguesFromCatalog =
    Array.isArray(sports) && sports.length
      ? sports
          .flatMap((s: any) => (Array.isArray(s?.countries) ? s.countries : []))
          .filter((l: any) => Boolean(l?.isTop) || Boolean(l?.top) || Boolean(l?.is_top))
      : [];

  const effectiveTopLeagues = isPissbet
    ? pissbetTopLeagues
    : isMezzo
      ? (mezzoTopLeagues.length ? mezzoTopLeagues : fallbackTopLeaguesFromCatalog)
      : (isStructured && Array.isArray(fallbackTopLeaguesFromCatalog) && fallbackTopLeaguesFromCatalog.length
        ? fallbackTopLeaguesFromCatalog
        : topLeagues);
  const effectiveSports = isPissbet
    ? [
        {
          id: "football",
          name: "Football",
          count: pissbetTopLeagues.length,
          countries: pissbetTopLeagues.map((l: any) => ({
            id: String(l?.id ?? l?.competitionId ?? ""),
            name: String(l?.name ?? l?.competitionName ?? l?.fullName ?? ""),
            count: 0,
            apiFootballLeagueId: null,
          })),
        },
      ]
    : isMezzo
      ? (() => {
          const sportList = Array.isArray((mezzoTopLeaguesResp as any)?.sportList) ? (mezzoTopLeaguesResp as any).sportList : [];

          const mapped = sportList
            .map((s: any) => {
              const sportId = String(s?.sportId ?? "").trim();
              const sportName = String(s?.sportName || "Sport").trim();
              const countries = Array.isArray(s?.countries) ? s.countries : [];
              const leagueItems = countries.flatMap((c: any) => {
                const leagues = Array.isArray(c?.leagues) ? c.leagues : [];
                return leagues
                  .map((l: any) => {
                    const id = String(l?.competitionId ?? "").trim();
                    const display = String(l?.fullName || "").trim();
                    const name = display || `${String(l?.country || c?.name || "").trim()} - ${String(l?.competitionName || "").trim()}`.trim();
                    return {
                      id,
                      name,
                      count: Number(l?.eventsCount ?? 0) || 0,
                      apiFootballLeagueId: null,
                    };
                  })
                  .filter((x: any) => x.id && x.name);
              });

              return {
                id: sportId || sportName.toLowerCase().replace(/\s+/g, "_"),
                name: sportName,
                count: Number(s?.eventsCount ?? leagueItems.reduce((acc: number, x: any) => acc + (Number(x?.count) || 0), 0)) || 0,
                countries: leagueItems,
              };
            })
            .filter((x: any) => x.id && x.name);

          // If Mezzo snapshot isn't available yet, fall back to backend catalog sports so the UI doesn't go empty.
          return mapped.length ? mapped : sports;
        })()
      : sports;

  return (
    <aside className={`w-64 border-r border-brand-border overflow-y-auto bg-brand-dark h-full ${className || ""}`}>
      {isLoading ? (
        <SidebarSkeleton />
      ) : (
        <div className="p-2.5 space-y-3">
          {/* Top Leagues Section */}
          <div className="bg-brand-surface rounded-xl overflow-hidden border border-brand-border/50 shadow-xl">
            <div className="p-3 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 bg-white/[0.03] border-b border-brand-border/50 text-gray-400">
              <Trophy className="w-3.5 h-3.5 text-brand-primary" />
              Top Leagues
            </div>
            <div className="py-1">
              {effectiveTopLeagues.map((league: any) => (
                <div 
                   key={league.id || league.name} 
                   onClick={() => {
                     const isSelected = activeLeague === league.name;
                     onLeagueChange({ 
                       name: isSelected ? null : league.name, 
                       id: isSelected ? null : (league.id || null),
                       apiFootballLeagueId: isSelected ? null : (league.apiFootballLeagueId || null)
                     });
                     // Mezzo top-events is keyed by sportId; keep sport in sync with the selected league.
                     if (!isSelected && isMezzo && league?.sportId) onSportChange(String(league.sportId));
                     else if (isSelected) onSportChange(null);
                   }}
                   className={`sidebar-item group !py-1.5 border-b border-brand-border/10 last:border-0 hover:bg-white/[0.02] cursor-pointer ${activeLeague === league.name ? 'bg-brand-primary/10 text-brand-primary' : ''}`}
               
                >
                  <div className={`w-4 h-4 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 transition-colors border border-white/5 ${activeLeague === league.name ? 'bg-brand-primary/40 border-brand-primary' : 'group-hover:bg-brand-primary/20'}`}>
                    <span className="text-[10px] leading-none">⚽</span>
                  </div>
                  <span className={`truncate flex-1 text-[13px] font-medium transition-colors ${activeLeague === league.name ? 'text-white' : 'group-hover:text-white'}`}>{league.name}</span>
                  <div className="flex items-center gap-1.5">
                    {isApiFootball && league.oddsFixtureCount > 0 && (
                      <span className="text-gray-500 text-[10px] font-bold">{league.oddsFixtureCount}</span>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 transition-all ${activeLeague === league.name ? 'text-brand-primary' : 'text-gray-600 group-hover:text-brand-primary group-hover:translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
              
              {isApiFootball && topLeagues.length === 0 && (
                <div className="p-4 text-xs text-zinc-500 text-center italic">
                  No leagues with odds yet.<br/>Sync fixtures in Admin.
                </div>
              )}
            </div>
          </div>

          {/* Filter by Time Button */}
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="bg-brand-yellow text-black p-3 text-center font-bold text-[12px] cursor-pointer rounded-full hover:brightness-110 active:scale-95 transition-all uppercase tracking-tight shadow-md flex items-center justify-center gap-2"
            >
              <span>Filter by</span>
              <span className="bg-[#3b82f6] text-white px-1 rounded-sm flex items-center gap-1">
                Time
              </span>
            </div>

            {isTimeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1e1a2b] border border-white/5 shadow-2xl rounded-xl py-1.5 z-50 animate-in fade-in zoom-in-95 origin-top">
                {['All Time', '1 Hour', '3 Hours', '6 Hours', '12 Hours', '24 Hours', '3 Days'].map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      onTimeFilterChange(f);
                      setIsTimeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-5 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-white/5 flex items-center justify-between ${timeFilter === f ? 'text-brand-primary' : 'text-gray-400'}`}
                  >
                    <span>{f}</span>
                    {timeFilter === f && <div className="w-1 h-1 rounded-full bg-brand-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sports Section */}
          <div className="bg-brand-surface rounded-xl overflow-hidden border border-brand-border/50 shadow-xl">
            <div className="flex flex-col">
              {effectiveSports.map((sport: any) => {
                const isExpanded = expandedSports.includes(sport.id);
                const sportIcons: Record<string, string> = {
                  'football': '⚽',
                  'basketball': '🏀',
                  'tennis': '🎾',
                  'volleyball': '🏐',
                  'hockey': '🏒',
                  'cricket': '🏏',
                  'handball': '🤾',
                  'baseball': '⚾',
                  'rugby': '🏉',
                  'combat': '🥊'
                };

                return (
                  <div key={sport.id} className="flex flex-col border-b border-brand-border/10 last:border-0">
                    <div 
                      onClick={() => {
                        toggleSport(sport.id);
                        onSportChange(activeSport === sport.id ? null : sport.id);
                        onLeagueChange({ name: null, id: null, apiFootballLeagueId: null });
                      }}
                      className={`sidebar-item group py-2.5 cursor-pointer hover:bg-white/[0.02] ${isExpanded || activeSport === sport.id ? 'bg-white/[0.03] text-white border-l-2 border-brand-primary' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 transition-colors border border-white/5 ${activeSport === sport.id ? 'bg-brand-primary/20 border-brand-primary' : 'group-hover:bg-brand-primary/10'}`}>
                        <span className="text-[13px] leading-none">{sportIcons[sport.id] || '⚽'}</span>
                      </div>
                      <span className="flex-1 font-bold text-[12px] uppercase tracking-wide">{sport.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 text-[11px] font-bold">{sport.count}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand-primary' : ''}`} />
                      </div>
                    </div>
                    
                    {isExpanded && sport.countries && (
                      <div className="bg-black/30 py-0.5 transition-all">
                        {sport.countries.map((country: any) => (
                          <div 
                            key={country.name} 
                            onClick={() => {
                              const isSelected = activeLeague === country.name;
                              onLeagueChange({ 
                                name: isSelected ? null : country.name, 
                                id: isSelected ? null : (country.id || null),
                                apiFootballLeagueId: isSelected ? null : (country.apiFootballLeagueId || null)
                              });
                              // Keep sport expanded but clear other filters
                              onSportChange(sport.id);
                            }}
                            className={`flex items-center gap-2.5 px-5 py-2 hover:bg-white/5 cursor-pointer text-[12px] transition-colors group/country ${activeLeague === country.name ? 'text-brand-primary bg-white/[0.03]' : 'text-gray-400 hover:text-white'}`}
                          >
                            <Globe className={`w-3 h-3 transition-colors ${activeLeague === country.name ? 'text-brand-primary' : 'text-gray-600 group-hover/country:text-brand-primary/60'}`} />
                            <span className="flex-1 font-medium">{country.name}</span>
                            <span className="text-[10px] text-gray-600 group-hover/country:text-gray-400 font-bold">{country.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
