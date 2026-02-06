"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Coins, Users, LogOut, Sparkles, ChevronLeft } from "lucide-react";

interface AppSelectorProps {
  username: string;
}

export function AppSelector({ username }: AppSelectorProps) {
  const router = useRouter();
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { logoutUser } = await import("@/app/actions");
    await logoutUser();
    router.push("/login");
  };

  const apps = [
    {
      id: "donations",
      name: "التبرعات",
      subtitle: "إدارة التبرعات والمصروفات",
      icon: Coins,
      gradient: "from-amber-400 via-orange-500 to-rose-500",
      bgGlow: "bg-amber-500",
      iconBg: "from-amber-300 to-orange-400",
      href: "/donations",
      ready: true,
      emoji: "💰",
    },
    {
      id: "families",
      name: "العائلات",
      subtitle: "إدارة شؤون العائلات",
      icon: Users,
      gradient: "from-violet-400 via-purple-500 to-fuchsia-500",
      bgGlow: "bg-purple-500",
      iconBg: "from-violet-300 to-purple-400",
      href: "/families",
      ready: true,
      emoji: "👨‍👩‍👧‍👦",
    },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] bg-[#0a0a0f] relative overflow-hidden flex flex-col"
    >
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Dot Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Content Container - Flex grow to center */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-12">
        
        {/* Welcome Section - Compact on mobile */}
        <div className="text-center mb-4 sm:mb-14 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-gray-400">مرحباً بك</span>
          </div>
          
          <h1 className="text-xl sm:text-5xl font-black text-white mb-1 sm:mb-3 tracking-tight">
            أهلاً، <span className="bg-gradient-to-l from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">{username}</span>
          </h1>
          <p className="text-gray-500 text-xs sm:text-lg font-medium">اختر التطبيق الذي تريد استخدامه</p>
        </div>

        {/* App Cards Grid - Compact on mobile */}
        <div className="w-full max-w-sm sm:max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 px-2 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: "200ms" }}>
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
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card Background with Gradient Border */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 to-white/5 p-[1px]">
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
              <div className="relative p-4 sm:p-8 flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
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
                <div className="flex-1 text-right min-w-0">
                  <h2 className={`
                    text-lg sm:text-3xl font-bold mb-0.5 sm:mb-2
                    bg-gradient-to-l ${app.gradient} bg-clip-text
                    ${app.ready ? "text-transparent" : "text-gray-500"}
                  `}>
                    {app.name}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-base truncate">
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
          className="mt-4 sm:mt-14 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl
            bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30
            text-gray-500 hover:text-red-400 transition-all duration-300 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base
            animate-in fade-in slide-in-from-bottom-8 duration-700"
          style={{ animationDelay: "400ms" }}
        >
          <LogOut className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoggingOut ? "animate-spin" : ""}`} />
          <span className="font-medium">{isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}</span>
        </button>
      </div>

      {/* Footer - Hidden on very small screens */}
      <div className="relative z-10 pb-3 sm:pb-6 text-center animate-in fade-in duration-1000" style={{ animationDelay: "600ms" }}>
        <p className="text-gray-700 text-[10px] sm:text-xs">
          صُنع بكل حب بواسطة <span className="text-gray-500">أحمد مصطفى ❤️</span>
        </p>
      </div>
    </div>
  );
}
