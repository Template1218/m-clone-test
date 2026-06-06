import { useState } from 'react';

const WINNERS = [
  { id: '41***38', amount: 40000, currency: 'ETB', time: '07:05', date: '5.2.2026' },
  { id: '41***39', amount: 35000, currency: 'ETB', time: '08:12', date: '5.2.2026' },
  { id: '41***40', amount: 42000, currency: 'ETB', time: '09:45', date: '5.2.2026' },
  { id: '41***41', amount: 28000, currency: 'ETB', time: '10:20', date: '5.2.2026' },
  { id: '41***42', amount: 31000, currency: 'ETB', time: '11:15', date: '5.2.2026' },
];

export default function WinnersSection() {
  const [activeTab, setActiveTab] = useState('Daily Top Winners');

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      {/* Winners Tabs */}
      <div className="flex items-center justify-center gap-8 mb-6">
        {['Daily Top Winners', 'Weekly Winners', 'Monthly Winners'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[13px] font-black uppercase italic tracking-wider transition-all relative py-2 ${
              activeTab === tab ? 'text-brand-primary' : 'text-gray-500 hover:text-white'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(232,225,12,0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* Winners Scroll Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
        {WINNERS.map((winner, idx) => (
          <div 
            key={idx} 
            className="flex-shrink-0 w-[280px] bg-brand-surface rounded-2xl border border-brand-border/40 p-4 flex items-center gap-4 hover:border-brand-primary/30 transition-all cursor-pointer group"
          >
            {/* Game Icon/Logo - Using Aviator for example */}
            <div className="w-20 h-14 bg-black/40 rounded-xl overflow-hidden p-2 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform">
              <img 
                src="/games/Aviator.png" 
                alt="Aviator" 
                className="w-full h-full object-contain brightness-125"
              />
            </div>
            
            <div className="flex flex-1 flex-col leading-tight">
              <div className="flex items-center justify-between mb-1">
                <span className="text-brand-primary font-black text-lg italic">{winner.amount?.toLocaleString()}</span>
                <span className="text-gray-500 font-bold text-[10px]">{winner.currency}</span>
              </div>
              <div className="text-white font-black text-[12px] opacity-80 mb-0.5">ID {winner.id}</div>
              <div className="text-gray-500 text-[10px] font-bold">{winner.date} | {winner.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
