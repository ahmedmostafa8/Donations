"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ArrowLeft, User } from "lucide-react";
import { loginUser } from "@/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Smart keyboard detection using VisualViewport API
  useEffect(() => {
    const handleViewportResize = () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        const viewport = window.visualViewport;
        const windowHeight = window.innerHeight;
        const viewportHeight = viewport.height;
        const keyboardHeight = windowHeight - viewportHeight;
        
        // Only apply offset if keyboard is likely open (height difference > 150px)
        if (keyboardHeight > 150) {
          // Move container up by half the keyboard height for good visibility
          setKeyboardOffset(keyboardHeight * 0.5);
        } else {
          setKeyboardOffset(0);
        }
      }
    };

    // Also handle focus/blur for fallback
    const handleFocus = () => {
      // Small delay to let keyboard animate in
      setTimeout(() => {
        if (window.visualViewport) {
          handleViewportResize();
        }
      }, 300);
    };

    const handleBlur = () => {
      setTimeout(() => setKeyboardOffset(0), 100);
    };

    // Add event listeners
    if (typeof window !== "undefined") {
      window.visualViewport?.addEventListener("resize", handleViewportResize);
      window.visualViewport?.addEventListener("scroll", handleViewportResize);
      document.addEventListener("focusin", handleFocus);
      document.addEventListener("focusout", handleBlur);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.visualViewport?.removeEventListener("resize", handleViewportResize);
        window.visualViewport?.removeEventListener("scroll", handleViewportResize);
        document.removeEventListener("focusin", handleFocus);
        document.removeEventListener("focusout", handleBlur);
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const res = await loginUser(username.trim().toLowerCase());
      if (res.success) {
        toast.success(`أهلاً بك، ${username}!`);
        router.push("/");
      } else {
        toast.error("اسم المستخدم غير صحيح", {
          description: "تأكد من كتابة الاسم بشكل صحيح."
        });
      }
    } catch (err) {
      toast.error("حدث خطأ ما");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-[100dvh] w-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden" 
      dir="rtl"
    >
      {/* Animated Background Gradient Orbs - Same warm colors as app-selector */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[200px] h-[200px] bg-gradient-to-br from-rose-500/20 via-pink-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Dot Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Content Container - Moves up when keyboard opens */}
      <div 
        ref={containerRef}
        className="relative z-10 w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-6 duration-700"
        style={{
          transform: `translateY(-${keyboardOffset}px)`,
          transition: "transform 0.3s ease-out"
        }}
      >

        {/* Welcome Text */}
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            مرحباً بك 👋
          </h1>
          <p className="text-sm sm:text-base font-medium text-gray-500">
            سجل دخولك لمتابعة نفقاتك بسهولة
          </p>
        </div>

        {/* Login Card */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Card Border Gradient */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 p-[1px]">
            <div className="absolute inset-[1px] rounded-[23px] bg-[#12121a]" />
          </div>

          {/* Card Content */}
          <div className="relative p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Input Group */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-amber-400/80 block pr-1">
                  اسم المستخدم
                </label>
                <div className={`
                  relative rounded-2xl transition-all duration-300
                  ${isFocused ? "ring-2 ring-amber-500/50" : ""}
                `}>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <User className={`w-5 h-5 transition-colors duration-300 ${isFocused ? "text-amber-400" : "text-gray-600"}`} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="اكتب اسمك هنا..."
                    autoFocus
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 
                      focus:border-amber-500/50 focus:bg-white/10 
                      transition-all pr-12 pl-5 font-bold text-lg text-white 
                      outline-none placeholder:text-gray-600 placeholder:font-medium text-right"
                  />
                </div>
              </div>

              {/* Submit Button - Warm colors */}
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className={`
                  w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 
                  transition-all duration-300 cursor-pointer
                  bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500
                  hover:from-amber-400 hover:via-orange-400 hover:to-rose-400
                  text-white shadow-lg shadow-amber-500/25
                  active:scale-[0.98]
                  disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed
                `}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>دخول</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
        <p className="text-gray-700 text-[10px] sm:text-xs">
          صُنع بكل حب بواسطة <span className="text-gray-500">أحمد مصطفى ❤️</span>
        </p>  
        </div>
      </div>
    </div>
  );
}
