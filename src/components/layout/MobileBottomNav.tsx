import { Timer, Activity, Menu, Smartphone, MessageCircle } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function MobileBottomNav({ currentView, onViewChange }: MobileBottomNavProps) {
  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-[100]">
      <div className="bg-[#86efac] rounded-[2.5rem] p-1.5 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-white/20">
        <button 
          onClick={() => onViewChange('home')}
          className={`flex flex-col items-center flex-1 gap-1 ${currentView === 'home' ? 'text-black font-black' : 'text-black/60 font-bold'}`}
        >
          <Timer className="w-6 h-6" />
          <span className="text-[10px] uppercase italic">Sport</span>
        </button>

        <button 
          onClick={() => onViewChange('live')}
          className={`flex flex-col items-center flex-1 gap-1 ${currentView === 'live' ? 'text-black font-black' : 'text-black/60 font-bold'}`}
        >
          <Activity className="w-6 h-6" />
          <span className="text-[10px] uppercase italic">Live</span>
        </button>

        <div className="relative -top-3">
          <button className="w-16 h-16 bg-[#facc15] rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-[#86efac] active:scale-95 transition-transform group">
            <Menu className="w-7 h-7 text-black group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase text-black italic">Menu</span>
          </button>
        </div>

        <button 
          onClick={() => onViewChange('games')}
          className={`flex flex-col items-center flex-1 gap-1 ${currentView === 'games' ? 'text-black font-black' : 'text-black/60 font-bold'}`}
        >
          <Smartphone className="w-6 h-6" />
          <span className="text-[10px] uppercase italic">Games</span>
        </button>

        <button 
          className="flex flex-col items-center flex-1 gap-1 text-black/60 font-bold"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-[10px] uppercase italic">Chat</span>
        </button>
      </div>
    </div>
  );
}
