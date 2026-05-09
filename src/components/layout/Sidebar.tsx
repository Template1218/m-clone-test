import { Trophy, ChevronRight, ChevronDown, Globe } from 'lucide-react';
import { TOP_LEAGUES } from '../../data';
import { useCatalog } from '../../modules/betting/hooks';
import { useState, useRef, useEffect } from 'react';
import SidebarSkeleton from './SidebarSkeleton';

interface SidebarProps {
  activeSport: string | null;
  onSportChange: (id: string | null) => void;
  activeLeague: string | null;
  onLeagueChange: (name: string | null) => void;
  timeFilter: string;
  onTimeFilterChange: (filter: string) => void;
  isHot: boolean;
  onIsHotChange: (val: boolean) => void;
}

export default function Sidebar({ 
  activeSport, 
  onSportChange, 
  activeLeague, 
  onLeagueChange, 
  timeFilter, 
  onTimeFilterChange,
  isHot,
  onIsHotChange
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

  const { data: sports = [], isLoading } = useCatalog();

  return (
    <aside className="w-72 border-r border-brand-border overflow-y-auto hidden lg:block bg-brand-dark h-full">
      {isLoading ? (
        <SidebarSkeleton />
      ) : (
        <div className="p-4 space-y-4">
          {/* Top Leagues Section */}
          <div className="bg-brand-surface rounded-[24px] overflow-hidden border border-brand-border/50 shadow-xl">
            <div className="p-4 text-[13px] font-black uppercase tracking-wider flex items-center gap-2.5 bg-white/[0.03] border-b border-brand-border/50 text-gray-300">
              <Trophy className="w-4 h-4 text-brand-primary" />
              TOP LEAGUES
            </div>
            <div className="py-2">
              {TOP_LEAGUES.map((league) => (
                <div 
                  key={league.name} 
                  onClick={() => {
                    onLeagueChange(activeLeague === league.name ? null : league.name);
                    onSportChange(null);
                  }}
                  className={`sidebar-item group !py-2 border-b border-brand-border/10 last:border-0 hover:bg-white/[0.02] cursor-pointer ${activeLeague === league.name ? 'bg-brand-primary/10 text-brand-primary' : ''}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 transition-colors border border-white/5 ${activeLeague === league.name ? 'bg-brand-primary/40 border-brand-primary' : 'group-hover:bg-brand-primary/20'}`}>
                    <span className="text-[11px] leading-none">⚽</span>
                  </div>
                  <span className={`truncate flex-1 text-[14px] font-semibold transition-colors ${activeLeague === league.name ? 'text-white' : 'group-hover:text-white'}`}>{league.name}</span>
                  <ChevronRight className={`w-4 h-4 transition-all ${activeLeague === league.name ? 'text-brand-primary' : 'text-gray-600 group-hover:text-brand-primary group-hover:translate-x-0.5'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Filter by Time Button */}
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="bg-brand-yellow text-black p-4 text-center font-black text-[14px] italic cursor-pointer rounded-full hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-tight shadow-[0_4px_20px_rgba(250,204,21,0.2)] flex items-center justify-center gap-2"
            >
              <span>Filter by</span>
              <span className="bg-[#3b82f6] text-white px-1 py-0.5 rounded-sm not-italic flex items-center gap-1">
                TIME
              </span>
            </div>

            {isTimeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e1a2b] border border-white/5 shadow-2xl rounded-xl py-2 z-50 animate-in fade-in zoom-in-95 origin-top">
                {['All Time', '1 Hour', '3 Hours', '6 Hours', '12 Hours', '24 Hours', '3 Days'].map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      onTimeFilterChange(f);
                      setIsTimeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-6 py-2.5 text-[12px] font-black uppercase italic transition-colors hover:bg-white/5 flex items-center justify-between ${timeFilter === f ? 'text-brand-primary' : 'text-gray-400'}`}
                  >
                    <span>{f}</span>
                    {timeFilter === f && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sports Section */}
          <div className="bg-brand-surface rounded-[24px] overflow-hidden border border-brand-border/50 shadow-xl">
            <div className="flex flex-col">
              {sports.map((sport) => {
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
                        onLeagueChange(null);
                      }}
                      className={`sidebar-item group py-3.5 cursor-pointer hover:bg-white/[0.02] ${isExpanded || activeSport === sport.id ? 'bg-white/[0.03] text-white border-l-2 border-brand-primary' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 transition-colors border border-white/5 ${activeSport === sport.id ? 'bg-brand-primary/20 border-brand-primary' : 'group-hover:bg-brand-primary/10'}`}>
                        <span className="text-[15px] leading-none">{sportIcons[sport.id] || '⚽'}</span>
                      </div>
                      <span className="flex-1 font-black text-[13px] uppercase tracking-wide">{sport.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[12px] font-bold">{sport.count}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand-primary' : ''}`} />
                      </div>
                    </div>
                    
                    {isExpanded && sport.countries && (
                      <div className="bg-black/30 py-1 transition-all">
                        {sport.countries.map((country) => (
                          <div 
                            key={country.name} 
                            onClick={() => {
                              onLeagueChange(activeLeague === country.name ? null : country.name);
                              // Keep sport expanded but clear other filters
                              onSportChange(sport.id);
                            }}
                            className={`flex items-center gap-3 px-6 py-2.5 hover:bg-white/5 cursor-pointer text-[13px] transition-colors group/country ${activeLeague === country.name ? 'text-brand-primary bg-white/[0.03]' : 'text-gray-400 hover:text-white'}`}
                          >
                            <Globe className={`w-3.5 h-3.5 transition-colors ${activeLeague === country.name ? 'text-brand-primary' : 'text-gray-600 group-hover/country:text-brand-primary/60'}`} />
                            <span className="flex-1 font-medium">{country.name}</span>
                            <span className="text-[11px] text-gray-600 group-hover/country:text-gray-400 font-bold">{country.count}</span>
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
