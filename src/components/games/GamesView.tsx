import { useState } from 'react';
import { Search } from 'lucide-react';
import GamesBanner from './GamesBanner';
import WinnersSection from './WinnersSection';
import GameCard from './GameCard';
import { Game } from '../../types';

const SAMPLE_GAMES: Game[] = [
  { 
    id: 'keno', 
    name: 'Fast Keno', 
    image: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?auto=format&fit=crop&q=80&w=600', 
    provider: 'Spribe', 
    isNew: true, 
    fairness: true 
  },
  { 
    id: 'rocket', 
    name: 'Crazy Rocket', 
    image: 'https://images.unsplash.com/photo-1635326445020-22101e4a194e?auto=format&fit=crop&q=80&w=600', 
    provider: 'Atlas-V', 
    fairness: true 
  },
  { 
    id: 'aviator', 
    name: 'Aviator', 
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=600', 
    provider: 'Spribe', 
    fairness: true 
  },
  { 
    id: 'plinko', 
    name: 'Plinko', 
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=600', 
    provider: 'Spribe', 
    isNew: true, 
    fairness: true 
  },
  { 
    id: 'ball', 
    name: 'Crazy Ball', 
    image: 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=80&w=600', 
    provider: 'Atlas-V', 
    fairness: true 
  },
  { 
    id: 'mine', 
    name: 'Mines', 
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=600', 
    provider: 'Spribe', 
    fairness: true 
  },
  { 
    id: 'dice', 
    name: 'Dice', 
    image: 'https://images.unsplash.com/photo-1551355738-16345dc337c7?auto=format&fit=crop&q=80&w=600', 
    provider: 'Spribe', 
    fairness: true 
  },
  { 
    id: 'limbo', 
    name: 'Limbo', 
    image: 'https://images.unsplash.com/photo-1596742572439-d8190520025a?auto=format&fit=crop&q=80&w=600', 
    provider: 'Spribe', 
    fairness: true 
  },
];

const PROVIDERS = ['All', 'AbraCadabra', 'Atlas-V', 'Spribe'];

export default function GamesView() {
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = SAMPLE_GAMES.filter(game => {
    const matchesProvider = selectedProvider === 'All' || game.provider === selectedProvider;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-6">
      <GamesBanner />
      <WinnersSection />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div className="flex bg-brand-surface p-1.5 rounded-full border border-brand-border">
          {PROVIDERS.map((provider) => (
            <button
              key={provider}
              onClick={() => setSelectedProvider(provider)}
              className={`px-8 py-2.5 rounded-full text-[13px] font-black uppercase italic transition-all ${
                selectedProvider === provider 
                  ? 'bg-brand-primary text-black shadow-lg shadow-brand-primary/20' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {provider}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-[400px]">
          <input 
            type="text" 
            placeholder="Search your favorite game..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-surface border border-brand-border rounded-full py-4 px-8 pr-14 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-primary/50 transition-all font-bold italic"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="py-20 text-center">
          <div className="text-gray-600 font-black text-2xl uppercase italic mb-2">No games found</div>
          <div className="text-gray-700 text-sm">Try adjusting your filters or search query</div>
        </div>
      )}
    </div>
  );
}
