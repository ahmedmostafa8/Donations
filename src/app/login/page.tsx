"use client";

import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react"; // Using ArrowLeft for RTL
import { loginUser } from "@/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const res = await loginUser(username.trim().toLowerCase()); // Normalize username
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
    <div className="h-screen w-screen bg-[#fafafc] flex items-center justify-center p-6 relative overflow-hidden overscroll-none fixed inset-0" dir="rtl">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-primary/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-[380px] z-10">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">مرحباً بك 👋</h1>
          <p className="text-sm font-bold text-gray-400">سجل دخولك لمتابعة نفقاتك بسهولة</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_40px_rgb(0,0,0,0.04)] p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-primary/80 block pr-1">اسم المستخدم</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اكتب اسمك هنا..."
                autoFocus
                className="w-full h-14 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-primary focus:bg-white transition-all px-5 font-bold text-lg text-gray-800 outline-none placeholder:text-gray-300 placeholder:font-bold text-right shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username}
              className={cn(
                "w-full h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-xl shadow-primary/20",
                "disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
              )}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>دخول</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>


      </div>
    </div>
  );
}
