export default function GamesBanner() {
  return (
    <div className="relative w-full h-[400px] rounded-[32px] overflow-hidden mb-12 border border-brand-primary/10 shadow-2xl group animate-in zoom-in-95 duration-700">
      <img 
        src="https://images.unsplash.com/photo-1614850523296-e811cf7ee53d?auto=format&fit=crop&q=80&w=1600" 
        alt="Casino Banner"
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent flex flex-col justify-center px-20 z-10">
        <div className="inline-block bg-brand-primary text-black font-black text-sm px-4 py-1.5 rounded-sm transform skew-x-[-15deg] mb-6 w-fit animate-in slide-in-from-left duration-700 delay-300">
          SPECIAL OFFER
        </div>
        <h1 className="text-[84px] font-black leading-[0.9] italic tracking-tighter uppercase max-w-2xl mb-8 animate-in slide-in-from-left duration-700 delay-400">
          <span className="text-white drop-shadow-2xl">WIN 4000%</span><br />
          <span className="text-brand-primary drop-shadow-[0_0_20px_rgba(232,225,12,0.4)]">CASHBACK</span>
        </h1>
        <button className="bg-white text-black font-black px-12 h-16 rounded-full text-lg uppercase italic shadow-2xl transition-all hover:scale-105 hover:bg-brand-primary active:scale-95 animate-in slide-in-from-left duration-700 delay-500">
          PLAY NOW
        </button>
      </div>
      
      {/* Decorative Floating Gems - Just for effect */}
      <div className="absolute top-20 right-40 w-12 h-12 bg-brand-primary/20 blur-xl rounded-full" />
      <div className="absolute bottom-20 right-80 w-16 h-16 bg-brand-yellow/20 blur-2xl rounded-full" />
    </div>
  );
}
