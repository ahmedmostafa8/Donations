"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Coins, Users, LogOut, Sparkles, ChevronLeft } from "lucide-react";
import { RamadanDecorations } from "@/components/ramadan-decorations";

// ============================================================
// 🌙 RAMADAN MODE — Set to false when Ramadan ends
// This single flag controls ALL Ramadan theming across the app
// ============================================================
export const RAMADAN_MODE = true;
// ============================================================

interface AppSelectorProps {
  username: string;
}

export function AppSelector({ username }: AppSelectorProps) {
  const router = useRouter();
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // Check if we've already shown the animation in this session
    const hasShownAnimation = sessionStorage.getItem("app_selector_shown");
    
    if (!hasShownAnimation) {
      setShouldAnimate(true);
      sessionStorage.setItem("app_selector_shown", "true");
    }
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // Clear Client Cache (All possible keys)
    localStorage.removeItem("donations_data_v2");
    localStorage.removeItem("donations_user_v1");
    localStorage.removeItem("last_app");
    
    const { logoutUser } = await import("@/app/actions");
    await logoutUser();
    // Force hard reload to clear all client-side cache
    window.location.href = "/login";
  };

  const apps = [
    {
      id: "donations",
      name: "التبرعات",
      subtitle: "إدارة التبرعات والمصروفات",
      icon: Coins,
      gradient: RAMADAN_MODE 
        ? "from-amber-400 via-yellow-500 to-amber-600" 
        : "from-amber-400 via-orange-500 to-rose-500",
      bgGlow: RAMADAN_MODE ? "bg-amber-500" : "bg-amber-500",
      iconBg: "from-amber-300 to-orange-400",
      href: "/donations",
      ready: true,
      emoji: RAMADAN_MODE ? "🕌" : "💰",
    },
    {
      id: "families",
      name: "العائلات",
      subtitle: RAMADAN_MODE ? "رعاية الأسر المحتاجة" : "إدارة شؤون العائلات",
      icon: Users,
      gradient: RAMADAN_MODE 
        ? "from-emerald-400 via-teal-500 to-emerald-600" 
        : "from-violet-400 via-purple-500 to-fuchsia-500",
      bgGlow: RAMADAN_MODE ? "bg-emerald-500" : "bg-purple-500",
      iconBg: RAMADAN_MODE ? "from-emerald-300 to-teal-400" : "from-violet-300 to-purple-400",
      href: "/families",
      ready: true,
      emoji: RAMADAN_MODE ? "🤲" : "👨‍👩‍👧‍👦",
    },
  ];

  return (
    <div
      dir="rtl"
      className={`min-h-[100dvh] relative overflow-hidden flex flex-col ${
        RAMADAN_MODE 
          ? "bg-[#0a0a12]" 
          : "bg-[#0a0a0f]"
      }`}
    >
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-[-20%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-br ${
          RAMADAN_MODE 
            ? "from-amber-500/30 via-yellow-500/20" 
            : "from-amber-500/30 via-orange-500/20"
        } to-transparent rounded-full blur-3xl ${shouldAnimate ? 'animate-pulse' : ''}`} />
        <div 
          className={`absolute bottom-[-20%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-br ${
            RAMADAN_MODE 
              ? "from-emerald-500/30 via-teal-500/20" 
              : "from-violet-500/30 via-purple-500/20"
          } to-transparent rounded-full blur-3xl ${shouldAnimate ? 'animate-pulse' : ''}`} 
          style={shouldAnimate ? { animationDelay: "1s" } : {}} 
        />
        {/* Extra Ramadan glow */}
        {RAMADAN_MODE && (
          <div className="absolute top-[30%] left-[40%] w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-gradient-to-br from-amber-400/15 via-yellow-300/10 to-transparent rounded-full blur-3xl" />
        )}
      </div>

      {/* Dot / Geometric Pattern Overlay */}
      <div 
        className={`absolute inset-0 ${RAMADAN_MODE ? "opacity-[0.04]" : "opacity-[0.03]"}`}
        style={{
          backgroundImage: RAMADAN_MODE
            ? "radial-gradient(circle, #f59e0b 0.5px, transparent 0.5px), radial-gradient(circle, #10b981 0.5px, transparent 0.5px)"
            : "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: RAMADAN_MODE 
            ? "32px 32px, 32px 32px" 
            : "24px 24px",
          backgroundPosition: RAMADAN_MODE 
            ? "0 0, 16px 16px" 
            : "0 0",
        }}
      />

      {/* 🌙 Ramadan Decorations (Lanterns, Stars, زينة) */}
      {RAMADAN_MODE && <RamadanDecorations />}

      {/* Content Container - Flex grow to center */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-12">
        
        {/* Welcome Section - Compact on mobile */}
        <div className={`text-center mb-4 sm:mb-14 ${shouldAnimate ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''}`}>
          {/* Ramadan / Normal Badge */}
          {RAMADAN_MODE ? (
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-400/20 backdrop-blur-sm mb-3 sm:mb-6">
              <span className="text-lg">🌙</span>
              <span className="text-sm sm:text-base text-amber-400 font-bold">رمضان كريم</span>
            </div>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-gray-400">مرحباً بك</span>
            </div>
          )}
          
          <h1 className="text-xl sm:text-5xl font-black mb-1 sm:mb-3 tracking-tight text-center text-white">
            <span>اهلاً بيك يا</span>{" "}
            <span className="bg-gradient-to-l from-amber-300 via-yellow-400 to-amber-400 bg-clip-text text-transparent">{username.split(" ")[0]}</span>{" "}
            <span className="text-red-400">💛</span>
          </h1>
          <p className={`text-xs sm:text-lg font-medium text-center ${
            RAMADAN_MODE ? "text-amber-400/80" : "text-gray-500"
          }`}>
            {RAMADAN_MODE 
              ? "كل عام وأنتم بخير 🤲" 
              : "اختر التطبيق الذي تريد استخدامه"
            }
          </p>
        </div>

        {/* App Cards Grid - Compact on mobile */}
        <div 
          className={`w-full max-w-sm sm:max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 px-2 ${shouldAnimate ? 'animate-in fade-in slide-in-from-bottom-6 duration-700' : ''}`} 
          style={shouldAnimate ? { animationDelay: "200ms" } : {}}
        >
          {apps.map((app, index) => (
            <button
              key={app.id}
              onClick={() => app.ready && router.push(app.href)}
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={() => setHoveredApp(null)}
              disabled={!app.ready}
              className={`
                group relative rounded-2xl sm:rounded-3xl overflow-hidden
                transition-all duration-500 ease-out
                ${app.ready ? "cursor-pointer active:scale-[0.98]" : "cursor-not-allowed"}
                ${hoveredApp === app.id ? "scale-[1.02] sm:scale-105" : "scale-100"}
              `}
              style={shouldAnimate ? { animationDelay: `${index * 100}ms` } : {}}
            >
              {/* Card Background with Gradient Border */}
              <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl p-[1px] ${
                RAMADAN_MODE 
                  ? "bg-gradient-to-br from-amber-400/20 via-white/10 to-emerald-400/20" 
                  : "bg-gradient-to-br from-white/10 to-white/5"
              }`}>
                <div className="absolute inset-[1px] rounded-[15px] sm:rounded-[23px] bg-[#12121a]" />
              </div>

              {/* Glowing Background Effect */}
              <div 
                className={`
                  absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 transition-opacity duration-500
                  ${hoveredApp === app.id ? "opacity-100" : ""}
                `}
              >
                <div className={`absolute inset-0 ${app.bgGlow} opacity-20 blur-2xl`} />
              </div>

              {/* Card Content - Horizontal on mobile */}
              <div className="relative p-4 sm:p-8 flex flex-row sm:flex-col items-center sm:items-center gap-3 sm:gap-0">
                {/* Icon Container */}
                <div className="shrink-0 sm:mb-5">
                  <div 
                    className={`
                      w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl 
                      bg-gradient-to-br ${app.gradient}
                      flex items-center justify-center
                      shadow-lg shadow-black/20
                      transition-all duration-500
                      ${hoveredApp === app.id ? "scale-110 rotate-3 shadow-xl" : ""}
                    `}
                  >
                    <span className="text-2xl sm:text-4xl">{app.emoji}</span>
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 w-full min-w-0 text-right sm:text-center">
                  <h2 className={`
                    text-lg sm:text-3xl font-bold mb-0.5 sm:mb-2
                    bg-gradient-to-l ${app.gradient} bg-clip-text
                    ${app.ready ? "text-transparent" : "text-gray-500"}
                    sm:text-center
                  `}>
                    {app.name}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-base truncate sm:text-center">
                    {app.subtitle}
                  </p>
                </div>

                {/* Action Indicator - Mobile arrow */}
                <div className="sm:hidden shrink-0">
                  {app.ready ? (
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">قريباً</span>
                  )}
                </div>

                {/* Desktop Action Indicator */}
                <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white transition-all duration-300 mt-4">
                  {app.ready ? (
                    <>
                      <span className="text-sm font-medium">فتح التطبيق</span>
                      <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${hoveredApp === app.id ? "-translate-x-1" : ""}`} />
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium">قريباً</span>
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </>
                  )}
                </div>

                {/* Coming Soon Badge - Desktop only */}
                {!app.ready && (
                  <div className="hidden sm:block absolute top-4 left-4">
                    <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold">
                      قريباً
                    </span>
                  </div>
                )}
              </div>

              {/* Shine Effect */}
              <div
                className={`
                  absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent
                  translate-x-[-100%] group-hover:translate-x-[100%]
                  transition-transform duration-1000
                `}
              />
            </button>
          ))}
        </div>

        {/* Logout Button - Compact on mobile */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`mt-4 sm:mt-14 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl
            bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30
            text-gray-500 hover:text-red-400 transition-all duration-300 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base
            ${shouldAnimate ? 'animate-in fade-in slide-in-from-bottom-8 duration-700' : ''}`}
          style={shouldAnimate ? { animationDelay: "400ms" } : {}}
        >
          <LogOut className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoggingOut ? "animate-spin" : ""}`} />
          <span className="font-medium">{isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}</span>
        </button>
      </div>

      {/* Footer */}
      <div className={`relative z-10 pb-3 sm:pb-6 text-center ${shouldAnimate ? 'animate-in fade-in duration-1000' : ''}`} style={shouldAnimate ? { animationDelay: "600ms" } : {}}>
        <p className="text-gray-700 text-[10px] sm:text-xs">
          صُنع بكل حب بواسطة <span className={RAMADAN_MODE ? "text-amber-500/60" : "text-gray-500"}>أحمد مصطفى {RAMADAN_MODE ? "🌙" : "❤️"}</span>
        </p>
      </div>
    </div>
  );
}
