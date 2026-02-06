export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Logo/Icon */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-violet-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-fuchsia-500 animate-spin reverse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">👨‍👩‍👧‍👦</span>
          </div>
        </div>
        <p className="text-purple-500/80 text-sm font-bold animate-pulse">جاري التحميل...</p>
      </div>
    </div>
  );
}
