import { useMemo, useState } from 'react';
import { AlertCircle, Flame, Grid3X3, Loader2, RefreshCw, Search, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import GameCard from './GameCard';
import { Game } from '../../types';
import { fetchGameProviders, fetchProviderGames, launchLiveGame } from '../../modules/games/gameApi';
import WinnersSection from './WinnersSection';
import { GameCardSkeleton, ArenaSkeleton } from './GameSkeleton';

export default function GamesView({ user, onLoginRequired }: { user?: any; onLoginRequired?: () => void }) {
  const [selectedProviderId, setSelectedProviderId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [launchingGameId, setLaunchingGameId] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState('');

  const providersQuery = useQuery({
    queryKey: ['live-game-providers'],
    queryFn: fetchGameProviders,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const providers = providersQuery.data || [];
  const activeProvider = useMemo(() => {
    if (!providers.length) return null;
    return providers.find((provider) => provider.id === selectedProviderId) || providers[0];
  }, [providers, selectedProviderId]);

  const gamesQuery = useQuery({
    queryKey: ['live-games', activeProvider?.id],
    queryFn: () => fetchProviderGames(activeProvider!),
    enabled: Boolean(activeProvider),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const games = gamesQuery.data || [];

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  async function handleLaunch(game: Game) {
    setLaunchError('');
    if (!user?.id) {
      onLoginRequired?.();
      return;
    }

    try {
      setLaunchingGameId(game.id);
      const url = await launchLiveGame(game as any, user);
      window.location.href = url;
    } catch (err: any) {
      setLaunchError(err?.message || 'Unable to open this game right now.');
    } finally {
      setLaunchingGameId(null);
    }
  }

  const isLoading = providersQuery.isLoading || (gamesQuery.isLoading && !games.length);

  return (
    <div className="min-h-full bg-[#070707]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 pt-6 lg:pt-10 pb-5 lg:pb-7">

        {providersQuery.isLoading ? (
          <ArenaSkeleton />
        ) : (
          <WinnersSection />
        )}

        <div className="sticky top-[122px] z-20 mb-8 border border-white/5 bg-[#0d0d0d]/80 backdrop-blur-xl px-2 py-2 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex bg-white/[0.03] border border-white/5 p-1 gap-1 overflow-x-auto no-scrollbar max-w-full rounded-lg">
          {providersQuery.isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-24 bg-white/5 rounded-md animate-pulse" />
            ))
          ) : (
            providers.map((provider) => (
              <button
                type="button"
                key={provider.id}
                onClick={() => setSelectedProviderId(provider.id)}
                className={`relative shrink-0 min-w-[90px] px-5 py-2.5 text-[10px] sm:text-[11px] font-black uppercase italic transition-all duration-300 rounded-md ${
                  activeProvider?.id === provider.id
                    ? 'bg-brand-primary text-black shadow-[0_0_20px_rgba(193,223,31,0.5)] scale-[1.02] z-10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {provider.name}
              </button>
            ))
          )}
            </div>

            <div className="relative w-full md:w-[380px]">
              <input
                type="text"
                placeholder="Find your game arena..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 py-3 px-5 pr-12 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all font-bold italic"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-600 group-focus-within:text-brand-primary transition-colors" />
              </div>
            </div>
          </div>
        </div>

      {launchError ? (
        <div className="mb-6 flex items-center gap-3 border border-red-500/50 bg-red-500/15 px-5 py-4 text-sm font-bold text-red-200 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{launchError}</span>
        </div>
      ) : null}

      {providersQuery.isError || (gamesQuery.isError && !games.length) ? (
        <div className="py-20 text-center">
          <div className="text-gray-500 font-black text-2xl uppercase italic mb-4">Live games unavailable</div>
          <button
            type="button"
            onClick={() => {
              providersQuery.refetch();
              gamesQuery.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-sm bg-brand-primary border-2 border-brand-primary px-6 py-3 text-xs font-black uppercase italic text-black shadow-[0_0_20px_rgba(193,223,31,0.5)] hover:shadow-[0_0_30px_rgba(193,223,31,0.7)] transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {isLoading ? (
            Array.from({ length: 15 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))
          ) : (
            filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                launching={launchingGameId === game.id}
                onLaunch={handleLaunch}
              />
            ))
          )}
        </div>
      )}

      {!isLoading && !providersQuery.isError && !gamesQuery.isError && filteredGames.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-gray-600 font-black text-2xl uppercase italic mb-2">No games found</div>
          <div className="text-gray-700 text-sm">Try adjusting your filters or search query</div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
