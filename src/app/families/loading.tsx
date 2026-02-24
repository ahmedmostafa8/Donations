import { Search } from "lucide-react";

export default function Loading() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      
      {/* ============ HEADER SKELETON ============ */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-xl md:max-w-5xl mx-auto">
          
          {/* Top Row: Title + Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Search Skeleton */}
          <div className="h-12 w-full rounded-xl bg-gray-100 animate-pulse mb-3" />
          
          {/* Filters Skeleton */}
          <div className="flex gap-2 pb-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 w-16 rounded-full bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      
      {/* ============ MAIN CONTENT SKELETON ============ */}
      <main className="max-w-xl md:max-w-5xl mx-auto px-4 py-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse mb-3 border border-gray-100 shadow-sm">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="flex justify-between items-center mt-2">
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
