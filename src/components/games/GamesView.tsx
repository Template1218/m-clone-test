import { useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import GamesBanner from './GamesBanner';
import WinnersSection from './WinnersSection';
import GameCard from './GameCard';
import { Game } from '../../types';
import { fetchGameProviders, fetchProviderGames, launchLiveGame } from '../../modules/games/gameApi';

export default function GamesView({ user, onLoginRequired }: { user?: any; onLoginRequired?: () => void }) {
  const [selectedProviderId, setSelectedProviderId] = useState('');
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
      <GamesBanner onPlay={() => {
        const firstGame = filteredGames[0];
        if (firstGame) handleLaunch(firstGame as any);
      }} />
      <WinnersSection />

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6 mb-8 lg:mb-10">
        <div className="flex bg-brand-surface p-1.5 rounded-full border border-brand-border overflow-x-auto no-scrollbar max-w-full">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProviderId(provider.id)}
              className={`shrink-0 px-5 sm:px-8 py-2.5 rounded-full text-[12px] sm:text-[13px] font-black uppercase italic transition-all ${
                activeProvider?.id === provider.id
                  ? 'bg-brand-primary text-black shadow-lg shadow-brand-primary/20'
                  : 'text-gray-500 hover:text-white'
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
            className="w-full bg-brand-surface border border-brand-border rounded-full py-4 px-6 sm:px-8 pr-14 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-primary/50 transition-all font-bold italic"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      {launchError ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{launchError}</span>
        </div>
      ) : null}

      {providersQuery.isLoading || gamesQuery.isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-primary" />
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
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-xs font-black uppercase italic text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
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
