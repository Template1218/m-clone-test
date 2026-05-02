import { Search, Trophy, CheckCircle2 } from 'lucide-react';

const WINNERS = [
  { id: '47***97', amount: '1,178', date: '5.2.2026 | 02:05', type: 'ETB' },
  { id: '47***97', amount: '903', date: '5.2.2026 | 01:05', type: 'ETB' },
  { id: '47***97', amount: '903', date: '5.2.2026 | 01:05', type: 'ETB' },
  { id: '47***97', amount: '888', date: '5.2.2026 | 01:05', type: 'ETB' },
  { id: '47***97', amount: '887', date: '5.2.2026 | 02:05', type: 'ETB' },
];

const GAMES = [
  { 
    id: 'greyhound', 
    title: 'Greyhound Racing', 
    subtitle: 'Virtual', 
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400',
    isNew: true 
  },
  { 
    id: 'horse', 
    title: 'Horse Racing', 
    subtitle: 'Virtual', 
    image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=400',
    isNew: true 
  }
];

export default function VirtualSportsView() {
  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Winners Tabs */}
      <div className="flex justify-center gap-8 border-b border-white/5 pb-2">
        {['Daily Top Winners', 'Weekly Winners', 'Monthly Winners'].map((tab, idx) => (
          <button 
            key={tab}
            className={`text-[12px] font-black uppercase italic tracking-wider transition-all ${idx === 0 ? 'text-[#7CBB3D] border-b-2 border-[#7CBB3D] pb-2' : 'text-gray-500 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Winner Cards Ticker */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {WINNERS.map((winner, idx) => (
          <div key={idx} className="min-w-[280px] bg-[#1a1a1a] rounded-xl border border-[#7CBB3D]/30 p-3 flex items-center justify-between relative overflow-hidden group hover:border-[#7CBB3D] transition-all">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 bg-black rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                 <img 
                    src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=100" 
                    className="w-full h-full object-cover opacity-50"
                    alt=""
                 />
                 <span className="absolute text-[8px] font-black text-[#7CBB3D] uppercase italic text-center leading-tight">Greyhound<br/>Virtual</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500">ID {winner.id}</span>
                <span className="text-[10px] font-bold text-white/40">{winner.date}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-[18px] font-black text-[#7CBB3D]">{winner.amount}</span>
                <span className="text-[10px] font-black text-white/40">{winner.type}</span>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-8 h-8 bg-[#7CBB3D]/10 skew-x-[-45deg] -translate-x-4 flex items-center justify-center">
                <span className="text-[8px] font-black text-[#7CBB3D] translate-x-1 uppercase italic">New</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          <button className="px-4 py-1.5 bg-[#242424] text-white text-[12px] font-black uppercase italic rounded-md border border-white/5">All</button>
        </div>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search"
            className="w-full bg-[#242424] border border-white/5 rounded-full py-2 px-10 text-[12px] font-medium focus:outline-none focus:border-[#7CBB3D]/50 text-white"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
         <button className="px-5 py-2 bg-[#7CBB3D] text-black text-[11px] font-black uppercase italic rounded-full shadow-lg">All</button>
         <button className="px-5 py-2 bg-[#242424] text-gray-400 text-[11px] font-black uppercase italic rounded-full border border-white/5 hover:text-white transition-colors">Atlas-V</button>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {GAMES.map((game) => (
          <div 
            key={game.id} 
            className="group relative bg-[#1a1a1a] rounded-[2rem] p-2 border-2 border-[#7CBB3D] shadow-[0_0_30px_rgba(124,187,61,0.15)] overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
          >
            <div className="relative h-[240px] rounded-[1.5rem] overflow-hidden">
               <img 
                src={game.image} 
                alt={game.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
               
               {/* Badges */}
               {game.isNew && (
                 <div className="absolute top-4 left-[-30px] w-32 bg-red-500 text-white font-black text-[10px] uppercase italic text-center py-1 -rotate-45 shadow-xl">
                   New
                 </div>
               )}
               
               <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                  <span className="text-[9px] font-black text-white uppercase italic">Fairness</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
               </div>

               {/* Text Overlay */}
               <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">
                    {game.title.split(' ')[0]}<br/>
                    {game.title.split(' ').slice(1).join(' ')}
                  </h3>
                  <span className="text-xl font-bold text-yellow-500 italic uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Virtual</span>
               </div>

               {/* Bottom Label */}
               <div className="absolute bottom-0 left-0 w-full h-10 bg-[#242424] border-t border-white/5 flex items-center justify-center">
                 <span className="text-[11px] font-black text-gray-400 group-hover:text-white transition-colors">{game.title}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
