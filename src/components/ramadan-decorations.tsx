"use client";

/**
 * RamadanDecorations — Pure CSS lanterns, crescents, stars, and زينة
 * Renders Ramadan-themed floating decorations.
 * Everything is CSS-based (no images needed).
 * Mobile-friendly with reduced sizes on small screens.
 */

export function RamadanDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* === Hanging Lanterns (فوانيس) === */}
      {/* Left lantern */}
      <div className="absolute top-0 left-[8%] sm:left-[12%] flex flex-col items-center animate-lantern-sway">
        <div className="w-[2px] h-8 sm:h-14 bg-gradient-to-b from-amber-400/60 to-amber-500/40" />
        <div className="relative">
          {/* Lantern cap */}
          <div className="w-5 sm:w-8 h-2 sm:h-3 bg-amber-500/70 rounded-t-full mx-auto" />
          {/* Lantern body */}
          <div className="w-7 sm:w-10 h-10 sm:h-14 bg-gradient-to-b from-amber-400/50 via-orange-400/40 to-amber-500/30 rounded-b-[50%] rounded-t-sm border border-amber-400/30 flex items-center justify-center">
            <div className="w-1.5 sm:w-2 h-3 sm:h-4 bg-amber-300/80 rounded-full blur-[2px] animate-flicker" />
          </div>
          {/* Glow */}
          <div className="absolute -inset-3 bg-amber-400/20 rounded-full blur-xl" />
        </div>
      </div>

      {/* Right lantern */}
      <div className="absolute top-0 right-[8%] sm:right-[12%] flex flex-col items-center animate-lantern-sway-reverse">
        <div className="w-[2px] h-12 sm:h-20 bg-gradient-to-b from-emerald-400/60 to-emerald-500/40" />
        <div className="relative">
          <div className="w-5 sm:w-8 h-2 sm:h-3 bg-emerald-500/70 rounded-t-full mx-auto" />
          <div className="w-7 sm:w-10 h-10 sm:h-14 bg-gradient-to-b from-emerald-400/40 via-teal-400/30 to-emerald-500/25 rounded-b-[50%] rounded-t-sm border border-emerald-400/30 flex items-center justify-center">
            <div className="w-1.5 sm:w-2 h-3 sm:h-4 bg-emerald-300/80 rounded-full blur-[2px] animate-flicker-delayed" />
          </div>
          <div className="absolute -inset-3 bg-emerald-400/15 rounded-full blur-xl" />
        </div>
      </div>

      {/* Center-right small lantern (hidden on very small screens) */}
      <div className="hidden sm:flex absolute top-0 right-[35%] flex-col items-center animate-lantern-sway">
        <div className="w-[1px] h-10 bg-gradient-to-b from-rose-400/50 to-rose-500/30" />
        <div className="relative">
          <div className="w-5 h-2 bg-rose-500/60 rounded-t-full mx-auto" />
          <div className="w-6 h-9 bg-gradient-to-b from-rose-400/35 via-pink-400/25 to-rose-500/20 rounded-b-[50%] rounded-t-sm border border-rose-400/25 flex items-center justify-center">
            <div className="w-1.5 h-3 bg-rose-300/70 rounded-full blur-[2px] animate-flicker" />
          </div>
          <div className="absolute -inset-2 bg-rose-400/10 rounded-full blur-lg" />
        </div>
      </div>

      {/* === Crescent Moons 🌙 === */}
      <div className="absolute top-[15%] sm:top-[8%] left-[15%] sm:left-[25%] text-2xl sm:text-4xl opacity-40 animate-float">
        🌙
      </div>
      <div className="absolute top-[30%] sm:top-[20%] right-[15%] sm:right-[30%] text-lg sm:text-2xl opacity-25 animate-float-delayed">
        🌙
      </div>

      {/* === Stars ✨ === */}
      <div className="absolute top-[20%] left-[30%] w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-300/60 rounded-full animate-twinkle" />
      <div className="absolute top-[12%] right-[25%] w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-200/50 rounded-full animate-twinkle-delayed" />
      <div className="absolute top-[45%] left-[70%] w-1 h-1 bg-emerald-300/40 rounded-full animate-twinkle" />
      <div className="absolute top-[25%] right-[45%] w-1 h-1 bg-amber-300/30 rounded-full animate-twinkle-delayed" />
      <div className="absolute top-[18%] left-[60%] w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white/30 rounded-full animate-twinkle" />
      <div className="absolute top-[40%] right-[15%] w-1 h-1 bg-white/20 rounded-full animate-twinkle-delayed" />

      {/* === زينة (Bunting / String Decorations) === */}
      {/* Top string decoration */}
      <svg
        className="absolute top-0 left-0 w-full h-12 sm:h-16 opacity-30"
        viewBox="0 0 1200 60"
        fill="none"
        preserveAspectRatio="none"
      >
        {/* Main string */}
        <path
          d="M0 10 Q150 50 300 15 Q450 55 600 10 Q750 50 900 15 Q1050 55 1200 10"
          stroke="url(#ramadan-string)"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Small decorative triangles (pennants) */}
        {[100, 200, 350, 500, 650, 800, 950, 1100].map((x, i) => (
          <polygon
            key={i}
            points={`${x-6},${18 + (i % 2) * 15} ${x+6},${18 + (i % 2) * 15} ${x},${35 + (i % 2) * 15}`}
            fill={i % 3 === 0 ? "#f59e0b" : i % 3 === 1 ? "#10b981" : "#f43f5e"}
            opacity={0.6}
          />
        ))}
        <defs>
          <linearGradient id="ramadan-string" x1="0" y1="0" x2="1200" y2="0">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bottom string decoration (subtle, mobile hidden) */}
      <svg
        className="hidden sm:block absolute bottom-[15%] left-0 w-full h-10 opacity-15"
        viewBox="0 0 1200 40"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0 8 Q200 35 400 12 Q600 38 800 8 Q1000 35 1200 12"
          stroke="#f59e0b"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
        {[150, 350, 550, 750, 950].map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={22 + (i % 2) * 8}
            r={3}
            fill={i % 2 === 0 ? "#f59e0b" : "#10b981"}
            opacity={0.4}
          />
        ))}
      </svg>
    </div>
  );
}
