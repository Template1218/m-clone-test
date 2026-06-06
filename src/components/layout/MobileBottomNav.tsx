import { useState, useEffect } from 'react';
import { Timer, Activity, Menu, Smartphone, MessageCircle, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileBottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onMenuOpen?: () => void;
  scrollElement?: HTMLElement | null;
}

export default function MobileBottomNav({ currentView, onViewChange, onMenuOpen, scrollElement }: MobileBottomNavProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!scrollElement) return;

    const handleScroll = () => {
      const currentScrollY = scrollElement.scrollTop;
      
      // Only hide if we've scrolled more than a small threshold
      if (Math.abs(currentScrollY - lastScrollY) < 10) return;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide
        setIsVisible(false);
      } else {
        // Scrolling up - show
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [scrollElement, lastScrollY]);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none">
      {/* Scroll-up Handle (Visible when hidden) */}
      <AnimatePresence>
        {!isVisible && (
          <div className="absolute bottom-0 w-full flex justify-center pointer-events-none">
            <motion.button
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={() => setIsVisible(true)}
              className="w-16 h-8 bg-[#86efac] rounded-t-2xl flex items-center justify-center shadow-[0_-5px_15px_rgba(0,0,0,0.2)] border-x border-t border-black/10 pointer-events-auto active:h-10 transition-all group"
            >
              <ChevronUp className="w-6 h-6 text-black stroke-[3px] group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Main Nav Bar */}
      <motion.div 
        animate={{ y: isVisible ? 0 : 120 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full bg-[#86efac] border-t border-black/10 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] rounded-t-[2.5rem] px-4 pb-safe pointer-events-auto"
      >
        <div className="py-2.5 flex items-center justify-between">
          <button 
            onClick={() => onViewChange('sport')}
            className={`flex flex-col items-center flex-1 gap-1 transition-all ${currentView === 'sport' ? 'text-black font-black scale-105' : 'text-black/50 font-bold'}`}
          >
            <Timer className="w-5 h-5" />
            <span className="text-[9px] uppercase italic">Sport</span>
          </button>

          <button 
            onClick={() => onViewChange('live')}
            className={`flex flex-col items-center flex-1 gap-1 transition-all ${currentView === 'live' ? 'text-black font-black scale-105' : 'text-black/50 font-bold'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[9px] uppercase italic">Live</span>
          </button>

          <div className="flex-1 flex justify-center">
            <button
              type="button"
              onClick={() => onMenuOpen?.()}
              className="w-12 h-12 bg-[#facc15] rounded-2xl flex flex-col items-center justify-center shadow-lg border-2 border-black/5 active:scale-90 transition-all group"
            >
              <Menu className="w-6 h-6 text-black" />
              <span className="text-[8px] font-black uppercase text-black italic">Menu</span>
            </button>
          </div>

          <button 
            onClick={() => onViewChange('games')}
            className={`flex flex-col items-center flex-1 gap-1 transition-all ${currentView === 'games' ? 'text-black font-black scale-105' : 'text-black/50 font-bold'}`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-[9px] uppercase italic">Games</span>
          </button>

          <button 
            className="flex flex-col items-center flex-1 gap-1 text-black/50 font-bold"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[9px] uppercase italic">Chat</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
