import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserProfile } from "../actions";
import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FamiliesPage() {
  // Server-side auth check
  const cookieStore = await cookies();
  const user = cookieStore.get("app_user")?.value;
  if (!user) redirect("/login");

  const userProfile = await getUserProfile();
  const username = userProfile?.displayName || userProfile?.username || "User";

  return (
    <div 
      dir="rtl" 
      className="min-h-[100dvh] bg-[#0a0a0f] flex flex-col items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-br from-fuchsia-500/30 via-pink-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[200px] h-[200px] bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Dot Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
          <span className="text-4xl sm:text-5xl">👨‍👩‍👧‍👦</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-black text-white mb-3">
          العائلات
        </h1>
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-purple-500/30 mb-6">
          <Wrench className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300 font-medium">قيد التطوير</span>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-sm sm:text-base max-w-xs mx-auto mb-8">
          نعمل على تطوير تطبيق إدارة العائلات
          <br />
          <span className="text-purple-400">سيتم إطلاقه قريباً! ✨</span>
        </p>

        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl
            bg-gradient-to-l from-violet-500 via-purple-500 to-fuchsia-500
            hover:from-violet-400 hover:via-purple-400 hover:to-fuchsia-400
            text-white font-bold text-sm sm:text-base
            shadow-lg shadow-purple-500/25
            transition-all duration-300 active:scale-[0.98] cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-gray-700 text-[10px] sm:text-xs">
          صُنع بكل حب بواسطة <span className="text-gray-500">أحمد مصطفى ❤️</span>
        </p>
      </div>
    </div>
  );
}
