"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Plus, Users, Heart, BarChart3, ArrowRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getFamilies, getStatusCounts } from "@/app/families/actions";
import { 
  STATUS_OPTIONS, 
  type Family, type FamilyStatus, type Attachment 
} from "@/app/families/types";
import { uploadFamilyAttachmentsUtils } from "@/lib/upload-utils";
import { FamilyCard } from "@/components/families/family-card";
import { FamilyForm } from "@/components/families/family-form";
import { FamilyDetails } from "@/components/families/family-details";
import { FamilyStats } from "@/components/families/family-stats";


interface FamiliesDashboardProps {
  initialFamilies: Family[];
  initialCounts: Record<string, number>;
}

export function FamiliesDashboard({ initialFamilies, initialCounts }: FamiliesDashboardProps) {
  const router = useRouter();
  
  // State
  // Initialize with Server Data (Instant!)
  const [allFamilies, setAllFamilies] = useState<Family[]>(initialFamilies);
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  
  // Save Last Active App
  useEffect(() => {
    localStorage.setItem("last_app", "/families");
  }, []);
  
  // Optimistic UI for uploads
  const [optimisticAttachments, setOptimisticAttachments] = useState<Record<number, Attachment[]>>({});
  
  // No filtering state needed (computed)
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Request Guard to prevent duplicate fetches
  const isFetchingRef = useRef(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FamilyStatus | null>(null);
  
  // Modals (ID-Based State)
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFamilyId, setEditingFamilyId] = useState<number | null>(null);
  const [viewingFamilyId, setViewingFamilyId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');


  // --- HELPERS ---

  // Merge optimistic attachments with smart deduplication
  const getFamilyWithOptimistic = (family: Family): Family => {
    if (!family.id) return family;

    const mergedAttachments = [...(family.attachments || [])];
    const rawOptimistic = optimisticAttachments[family.id] || [];
    
    // Filter out optimistic attachments if we already have a real one with the same label
    const dedupedOptimistic = rawOptimistic.filter(opt => {
      const realCount = mergedAttachments.filter(r => r.label === opt.label).length;
      return realCount === 0;
    });

    mergedAttachments.push(...dedupedOptimistic);
    return { ...family, attachments: mergedAttachments };
  };

  // Get current active family objects (safe access)
  const viewingFamily = viewingFamilyId ? allFamilies.find(f => f.id === viewingFamilyId) : null;
  const editingFamily = editingFamilyId ? allFamilies.find(f => f.id === editingFamilyId) : null;

  // --- HISTORY STATE MANAGEMENT ---
  
  // Handle Back Button / Browser Navigation
  useEffect(() => {
    // 0. Persist "Last App"
    localStorage.setItem("last_app", "/families");

    // 1. Setup Root Trap (Trap "Back" to go to Home)
    const initTrap = () => {
      // If we are not already in our "app" state (root or modal), push the root state
      if (!window.history.state?.appRoot) {
        window.history.pushState({ appRoot: true }, '', window.location.href);
      }
    };
    
    // Run after mount to ensure router is ready
    setTimeout(initTrap, 50);

    const handlePopState = (event: PopStateEvent) => {
      // Handle Modals (Edit/View/Add)
      if (viewingFamilyId || showAddForm || editingFamilyId) {
        setViewingFamilyId(null);
        setEditingFamilyId(null);
        setShowAddForm(false);
        return;
      }
      
      // Handle Stats View Back
      if (viewMode === 'stats') {
        setViewMode('list');
        return;
      }
      
      // Handle Root Back (User pressed back from the dashboard root)
      router.push('/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewingFamilyId, showAddForm, editingFamilyId, router, viewMode]);

  // Helper to open modal with history state
  const openFamilyDetails = (familyId: number) => {
    window.history.pushState({ modal: 'family-details' }, '', window.location.href);
    setViewingFamilyId(familyId);
  };
  
  const openAddForm = () => {
    window.history.pushState({ modal: 'add-family' }, '', window.location.href);
    setShowAddForm(true);
  };
  
  // Unified Close Handler (Go Back)
  const handleCloseModal = () => {
    window.history.back();
  };
  
  // Fetch Data (CSR + Caching Strategy)
  const fetchFamilies = async (resetPage = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    if (resetPage) setRefreshing(true);
    else setLoadingMore(true);
    
    try {
      const [response, countsData] = await Promise.all([
        getFamilies({ limit: 1000 }),
        getStatusCounts()
      ]);

      if (response.data) {
        setAllFamilies(response.data);
        localStorage.setItem("families_cache", JSON.stringify(response.data));
      }
      
      setHasMore(false);
      setCounts(countsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (resetPage) setRefreshing(false);
      else setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    if (node) {
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          fetchFamilies(false);
        }
      }, { threshold: 0.1 });
      observerRef.current.observe(node);
    }
  }, [loadingMore, hasMore]); // Update observer when loadingMore/hasMore changes

  // Load from cache ONLY on mount (one-time)
  useEffect(() => {
    if (allFamilies.length === 0) {
      const cached = localStorage.getItem("families_cache");
      if (cached) {
        try { setAllFamilies(JSON.parse(cached)); } catch(e) {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run once on mount only

  // Persist to cache whenever families change (but never set state here)
  useEffect(() => {
    if (allFamilies.length > 0) {
      localStorage.setItem("families_cache", JSON.stringify(allFamilies));
    }
  }, [allFamilies]);

  // Real-time subscription (Refreshes current view)
  useEffect(() => {
    const channel = supabase
      .channel('families-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'families' },
        () => {
          fetchFamilies(true); 
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Refresh handler
  const handleRefresh = async () => {
    await fetchFamilies(true);
  };

  // Handle Save with Optimistic Uploads (Background)
  const handleSave = async (
    pendingFiles?: {file: File, label: string}[], 
    familyId?: number, 
    familyCode?: number
  ) => {
    // 1. Refresh data (Immediate update for the text changes)
    await fetchFamilies(true);
    
    // 2. Start uploads if any (Non-Blocking)
    if (pendingFiles && pendingFiles.length > 0 && familyId && familyCode) {
      // Create optimistic attachments
      const optimisticList: Attachment[] = pendingFiles.map((pf, index) => ({
        url: URL.createObjectURL(pf.file),
        label: pf.label,
        public_id: `optimistic-${Date.now()}-${index}` // Temporary ID
      }));
      
      // Update state to show them immediately
      setOptimisticAttachments(prev => ({
        ...prev,
        [familyId]: [...(prev[familyId] || []), ...optimisticList]
      }));
      
      // Start background upload
      uploadFamilyAttachmentsUtils(
        pendingFiles, 
        familyId, 
        familyCode,
        undefined, // onProgress
        (index) => {
          // On File Success: Remove the optimistic item one by one
          // This prevents duplication as the real item triggers a data refresh
          setOptimisticAttachments(prev => {
            const current = prev[familyId] || [];
            // Use index to find target (assuming order is preserved)
             // The optimistic list was created from 'pendingFiles'.
            // So optimisticList[index] corresponds to pendingFiles[index].
            const targetOptimisticId = optimisticList[index]?.public_id;
            
            if (!targetOptimisticId) return prev;

            return {
              ...prev,
              [familyId]: current.filter(att => att.public_id !== targetOptimisticId)
            };
          });
          
          // Trigger refresh to get the real item from DB
          // This will re-render the list/details with the REAL item.
          // Because the optimistic item is removed in the same tick (or just before/after),
          // the getFamilyWithOptimistic logic ensures we don't see dupes.
          fetchFamilies(true); 
        }
      );
    }
  };

  // Client-Side Filtering (Instant)
  const families = allFamilies.filter(family => {
    if (statusFilter && !family.status.split(",").map(s => s.trim()).includes(statusFilter)) return false;
    
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const childrenNames = (family.children || []).map(c => c.child_name || '').join(' ');
      const searchString = `
        ${family.family_code}
        ${family.husband_name || ''} 
        ${family.wife_name || ''} 
        ${family.husband_phone || ''}
        ${family.wife_phone || ''}
        ${family.husband_national_id || ''}
        ${family.wife_national_id || ''}
        ${family.address || ''}
        ${family.area || ''}
        ${family.street || ''}
        ${family.governorate || ''}
        ${childrenNames}
      `.toLowerCase();
      
      return searchString.includes(q);
    }
    
    return true;
  });
  
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* ============ HEADER ============ */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-xl md:max-w-5xl mx-auto">
          
          {/* Top Row: Title + Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                   localStorage.removeItem("last_app");
                   router.push("/");
                }}
                className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center hover:bg-violet-200 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <div 
                className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-all hover:opacity-90"
                onClick={() => {
                   if (viewMode === 'stats') {
                     window.history.back();
                   } else {
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                   }
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-gray-900 group-hover:text-violet-600 transition-colors">الأسر</h1>
                  <p className="text-xs text-gray-500 font-medium">
                    {counts.total} أسرة مسجلة
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (viewMode === 'list') {
                    window.history.pushState({ view: 'stats' }, '', window.location.href);
                    setViewMode('stats');
                  } else {
                    window.history.back();
                  }
                }}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95",
                  viewMode === 'stats' 
                    ? "bg-amber-500 text-white shadow-amber-200" 
                    : "bg-white text-gray-500 border border-gray-100 shadow-gray-100"
                )}
                title="الإحصائيات"
              >
                <BarChart3 className="w-5 h-5" />
              </button>


            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="إبحث باللي انت عايزه ♥"
              className="w-full h-12 pr-11 pl-4 rounded-xl bg-gray-100 border-2 border-transparent focus:border-violet-500 focus:bg-white outline-none text-right font-medium text-gray-800 placeholder:text-gray-400 transition-all"
            />
          </div>
          
          {/* Status Filter Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setStatusFilter(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2",
                statusFilter === null
                  ? "bg-violet-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              )}
            >
              <span>الكل</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", statusFilter === null ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>
                {counts.total}
              </span>
            </button>
            {STATUS_OPTIONS.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2",
                  statusFilter === status
                    ? "bg-violet-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                )}
              >
                <span>{status}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", statusFilter === status ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>
                  {counts[status] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>
      
      {/* ============ MAIN CONTENT ============ */}
      <main className="max-w-xl md:max-w-7xl mx-auto px-4 py-6 pb-24 flex-1 w-full">
        
        {viewMode === 'stats' ? (
          <FamilyStats 
            families={allFamilies} 
            onBack={() => window.history.back()} 
          />
        ) : families.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {searchTerm || statusFilter
                ? "لا توجد نتائج"
                : "لا توجد أسر مضافة"
              }
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm || statusFilter
                ? "جرب البحث بكلمات مختلفة أو غير الفلتر"
                : "ابدأ بإضافة أول أسرة الآن"
              }
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 text-white font-bold shadow-lg shadow-violet-200 hover:bg-violet-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>إضافة أسرة</span>
              </button>
            )}
          </div>
        ) : (
          /* Families List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-4 items-start animate-in fade-in duration-500">
            {families.map(family => {
              const familyWithOptimistic = getFamilyWithOptimistic(family);
              
              return (
                <div 
                  key={family.id}
                  className="transition-all duration-200 hover:-translate-y-1"
                >
                  <FamilyCard
                    family={familyWithOptimistic}
                    onClick={() => openFamilyDetails(family.id!)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* ============ MODALS (Shared Overlay) ============ */}
      {(showAddForm || editingFamilyId || viewingFamilyId) && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
          onClick={() => {
             window.history.back();
          }}
        >
          {/* Add/Edit Form Modal */}
          {(showAddForm || editingFamilyId) && (
            <FamilyForm
              family={editingFamily}
              onClose={handleCloseModal}
              onSave={handleSave}
              noOverlay={true}
            />
          )}
          
          {/* Details Modal */}
          {viewingFamilyId && !editingFamilyId && viewingFamily && (
            <FamilyDetails
              family={getFamilyWithOptimistic(viewingFamily)}
              onClose={handleCloseModal}
              onEdit={() => {
                setEditingFamilyId(viewingFamily.id!);
              }}
              onDelete={() => {
                window.history.back(); // Restore history from modal
                fetchFamilies(true);
              }}
              noOverlay={true}
            />
          )}
        </div>
      )}
      
      {/* Infinite Scroll Sentinel */}
      {families.length > 0 && hasMore && (
        <div 
          ref={sentinelRef}
          className="flex justify-center pb-20 pt-8"
        >
           <div className="flex items-center gap-2 text-gray-400 bg-white/50 px-4 py-2 rounded-full shadow-sm border border-gray-100">
             <Loader2 className="w-4 h-4 animate-spin" />
             <span className="text-xs font-bold">جاري تحميل المزيد...</span>
           </div>
        </div>
      )}
      
      {/* Floating Action Button (Visible on Mobile & Desktop) */}
      <button
        onClick={openAddForm}
        className="fixed bottom-16 right-6 md:bottom-16 md:right-12 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-xl shadow-purple-300 flex items-center justify-center z-30 active:scale-95 transition-transform hover:scale-110 cursor-pointer"
        title="إضافة أسرة جديدة"
      >
        <Plus className="w-6 h-6 md:w-8 md:h-8" />
      </button>
      
      {/* Footer - Fixed at bottom */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 py-3 text-center z-20">
        <p className="text-[10px] text-gray-500 font-bold">
          صُنع بكل حب بواسطة <span className="text-violet-600">أحمد مصطفى ❤️</span>
        </p>
      </footer>
    </div>
  );
}
