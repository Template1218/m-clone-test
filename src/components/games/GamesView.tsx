import { useMemo, useState } from 'react';
import { AlertCircle, Grid3X3, Loader2, RefreshCw, Search, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import GameCard from './GameCard';
import { Game } from '../../types';
import { fetchGameProviders, fetchProviderGames, launchLiveGame } from '../../modules/games/gameApi';

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

  return (
    <div className="max-w-[1400px] mx-auto py-6 lg:py-8 px-4 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-primary">
            <Sparkles className="h-4 w-4 drop-shadow-[0_0_8px_rgba(193,223,31,0.6)]" />
            <span className="text-[11px] font-black uppercase tracking-[0.22em]">Casino Lobby</span>
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase italic text-white drop-shadow-lg">Instant Games</h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-sm border-2 border-white/20 bg-white/[0.05] px-4 py-2 text-xs font-black uppercase text-gray-400">
          <Grid3X3 className="h-4 w-4 text-brand-primary drop-shadow-[0_0_8px_rgba(193,223,31,0.6)]" />
          {filteredGames.length} Games
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6 mb-8 lg:mb-10">
        <div className="flex bg-[#0a0a0a] p-1 rounded-sm border-2 border-white/20 overflow-x-auto no-scrollbar max-w-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
          {providers.map((provider) => (
            <button
              type="button"
              key={provider.id}
              onClick={() => setSelectedProviderId(provider.id)}
              className={`shrink-0 px-4 sm:px-6 py-3 rounded-sm text-[11px] sm:text-[12px] font-black uppercase italic transition-all border-2 ${
                activeProvider?.id === provider.id
                  ? 'bg-brand-primary text-black border-brand-primary shadow-[0_0_20px_rgba(193,223,31,0.5)]'
                  : 'text-gray-500 border-transparent hover:bg-white/[0.05] hover:text-white hover:border-white/20'
              }`}
            >
              {provider.name}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-[400px]">
          <input
            type="text"
            placeholder="Search your favorite game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border-2 border-white/20 rounded-sm py-4 px-6 sm:px-8 pr-14 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-primary focus:shadow-[0_0_20px_rgba(193,223,31,0.3)] transition-all font-bold italic"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      {launchError ? (
        <div className="mb-6 flex items-center gap-3 rounded-sm border-2 border-red-500/50 bg-red-500/15 px-5 py-4 text-sm font-bold text-red-200 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{launchError}</span>
        </div>
      ) : null}

      {providersQuery.isLoading || gamesQuery.isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-primary drop-shadow-[0_0_12px_rgba(193,223,31,0.6)]" />
          <div className="font-black uppercase italic">Loading live games</div>
        </div>
      ) : providersQuery.isError || gamesQuery.isError ? (
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              launching={launchingGameId === game.id}
              onLaunch={handleLaunch}
            />
          ))}
        </div>
      )}

      {!providersQuery.isLoading && !gamesQuery.isLoading && !providersQuery.isError && !gamesQuery.isError && filteredGames.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-gray-600 font-black text-2xl uppercase italic mb-2">No games found</div>
          <div className="text-gray-700 text-sm">Try adjusting your filters or search query</div>
        </div>
      ) : null}
    </div>
  );
}
