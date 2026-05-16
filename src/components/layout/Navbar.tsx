import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  Trophy,
  Activity,
  Smartphone,
  Globe,
  Clock,
  CircleHelp,
  Timer,
} from "lucide-react";

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const NAV_ITEMS = [
  { icon: <Home className="w-8 h-8" />, label: "HOME", view: "home" },
  { icon: <Trophy className="w-8 h-8" />, label: "SPORT", view: "home" },
  { icon: <Activity className="w-8 h-8" />, label: "LIVE", view: "live" },
  { icon: <Smartphone className="w-8 h-8" />, label: "GAMES", view: "games" },
  {
    icon: <Globe className="w-8 h-8" />,
    label: "LIVE GAMES",
    view: "live-games",
  },
  {
    icon: <Clock className="w-8 h-8" />,
    label: "VIRTUAL SPORTS",
    view: "virtual",
  },
  {
    icon: <CircleHelp className="w-8 h-8" />,
    label: "PROMOTIONS",
    view: "promotions",
  },
];

export default function Navbar({ currentView, onViewChange }: NavbarProps) {
  const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-[#050505] border-b border-zinc-800 h-16 flex items-center justify-center shrink-0 sticky top-[50px] z-[90] overflow-x-auto no-scrollbar shadow-lg">
      <div className="flex w-full lg:w-auto lg:gap-8 min-w-max px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.view;
          const isSport = item.label === "SPORT";

          return (
            <div
              key={item.label}
              ref={isSport ? dropdownRef : null}
              onClick={() => {
                if (isSport) {
                  setIsSportDropdownOpen(!isSportDropdownOpen);
                } else {
                  onViewChange(item.view);
                }
              }}
              className={`flex-1 min-w-[70px] lg:min-w-0 flex flex-col items-center justify-center cursor-pointer group px-2 relative h-16 transition-all ${isActive ? "text-[#ccff00]" : "text-zinc-500 hover:text-white"}`}
            >
              <div
                className={`mb-1 transition-transform group-hover:scale-105 ${isActive ? "scale-105" : ""}`}
              >
                {/* Icons restored to moderate size */}
                {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
              </div>
              <span
                className={`text-[9px] font-black tracking-widest uppercase whitespace-nowrap ${isActive ? "text-[#ccff00]" : ""}`}
              >
                {item.label}
              </span>
              {isActive && !isSportDropdownOpen && (
                <div className="absolute bottom-0 h-0.5 w-full bg-[#ccff00] hidden lg:block animate-in fade-in slide-in-from-bottom-1" />
              )}

              {/* Sport Dropdown */}
              {isSport && isSportDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-60 bg-[#1e1a2b] border border-white/5 shadow-2xl rounded-sm py-4 z-50 animate-in fade-in zoom-in-95 origin-top">
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-10 h-10 rounded-full border border-brand-primary/30 flex items-center justify-center mb-2">
                      <Timer className="w-6 h-6 text-brand-primary" />
                    </div>
                    <span className="text-brand-primary text-[11px] font-black tracking-widest italic uppercase">
                      Sport
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {[
                      "Upcoming Events",
                      "Top Sports",
                      "Express",
                      "Results",
                    ].map((link) => (
                      <button
                        key={link}
                        className="w-full text-left px-6 py-2 content-center hover:bg-white/5 transition-colors group/item"
                      >
                        <span className="text-white font-black text-[13px] uppercase italic tracking-tight group-hover/item:text-brand-primary transition-colors">
                          {link}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
