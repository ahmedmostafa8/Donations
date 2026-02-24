"use client";
import { useRouter } from "next/navigation";

import { useState, useEffect, useRef, useMemo } from "react";
import { Home, Plus, Trash2, Loader2, X, Pencil, Check, LogOut, PieChart as PieChartIcon, Settings, DollarSign, Grid3X3, FolderOpen, ChevronLeft, Wallet, Target, Package, Coins, Database, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { StatisticsView } from "./statistics-view";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { TransactionList } from "./transaction-list";
import { SearchInput } from "./search-input";
import { NavigationHub } from "./navigation-hub"; // Import Hub
import { supabase } from "@/lib/supabase";
import { useSwipeTabs } from "@/hooks/use-swipe-tabs";
import { clearAllTransactions, createSheet, deleteSheet, logoutUser, renameSheet, type UnitGoalSettings, type Transaction } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";


// Inside Dashboard component...



export function Dashboard({
  initialSheets = [],
  initialTransactions = [],
  initialGoal = 0,
  initialUnitGoal = null,
  initialUsername = "جاري التحميل..."
}: {
  initialSheets?: string[],
  initialTransactions?: Transaction[],
  initialGoal?: number,
  initialUnitGoal?: UnitGoalSettings | null,
  initialUsername?: string
}) {
  // --- Cache Keys ---
  const STORAGE_KEY_DATA = "donations_data_v2";
  const STORAGE_KEY_USER = "donations_user_v1";

  // --- State Initialization ---
  // We initialize with props if available which avoids hydration mismatch. 
  // Cache loading happens in useEffect for client-side speed.
  const [currentSheet, setCurrentSheet] = useState(initialSheets[0] || "تبرعاتي");
  const [allSheets, setAllSheets] = useState<string[]>(initialSheets.length > 0 ? initialSheets : ["تبرعاتي"]);
  
  // Turbo Mode: Global transactions state
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(initialTransactions || []);
  
  // Goals State
  const [goals, setGoals] = useState<Record<string, number>>({ [initialSheets[0] || "تبرعاتي"]: initialGoal });
  const [unitGoals, setUnitGoals] = useState<Record<string, UnitGoalSettings | null>>({ [initialSheets[0] || "تبرعاتي"]: initialUnitGoal });
  
  const [username, setUsername] = useState(initialUsername !== "Unknown" ? initialUsername : "جاري التحميل...");

  // ... (Other UI states like edit mode, modal visibility, etc. kept as is) ...
  const [viewMode, setViewMode] = useState<'list' | 'stats' | 'settings'>('list');
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Swipe Navigation for Tabs
  const goToNextTab = () => {
    const idx = allSheets.indexOf(currentSheet);
    const nextIdx = idx < allSheets.length - 1 ? idx + 1 : 0;
    setCurrentSheet(allSheets[nextIdx]);
  };
  const goToPrevTab = () => {
    const idx = allSheets.indexOf(currentSheet);
    const prevIdx = idx > 0 ? idx - 1 : allSheets.length - 1;
    setCurrentSheet(allSheets[prevIdx]);
  };
  const swipeHandlers = useSwipeTabs({
    onSwipeLeft: goToNextTab,
    onSwipeRight: goToPrevTab,
    enabled: viewMode === 'list',
    threshold: 60,
  });
  const [newTabName, setNewTabName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState<Record<string, boolean>>({});

  const [showAddTabModal, setShowAddTabModal] = useState(false);



  // Sidebar Inline State
  const [isSidebarCreating, setIsSidebarCreating] = useState(false);
  const [newSidebarTabName, setNewSidebarTabName] = useState("");

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  const [editingSidebarSheet, setEditingSidebarSheet] = useState<string | null>(null);
  const [renameSidebarValue, setRenameSidebarValue] = useState("");
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);
  
  const goalDebounce = useRef<NodeJS.Timeout>(null);
  const unitTargetDebounce = useRef<NodeJS.Timeout>(null);
  const unitNameDebounce = useRef<NodeJS.Timeout>(null);
  const unitPriceDebounce = useRef<NodeJS.Timeout>(null);

  // --- 1. Load from Cache & Fetch Fresh Data (Instant Load Logic) ---
  useEffect(() => {
    setMounted(true);
    
    const loadData = async () => {
      // A. Try loading from LocalStorage first (Instant)
      try {
        const cachedData = localStorage.getItem(STORAGE_KEY_DATA);
        const cachedUser = localStorage.getItem(STORAGE_KEY_USER);

        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (parsed.sheets?.length) setAllSheets(parsed.sheets);
          if (parsed.allTransactions) setAllTransactions(parsed.allTransactions);
          if (parsed.goals) setGoals(parsed.goals);
          if (parsed.unitGoals) setUnitGoals(parsed.unitGoals);
        }
        
        if (cachedUser) setUsername(cachedUser);
      } catch {}

      // B. Fetch Fresh Data (Background Sync)
      try {
        const { getDashboardData } = await import("@/app/actions");
        const data = await getDashboardData(currentSheet);
        if (!data) return;

        const { profile, sheets, allTransactions: freshTxs, goal: g, unitGoal: ug } = data;

        // 1. Update Profile
        const name = profile?.displayName || profile?.username || "User";
        setUsername(name);
        localStorage.setItem(STORAGE_KEY_USER, name);

        // 2. Update Sheets & Data
        if (sheets.length > 0) {
            setAllSheets(sheets);
            setAllTransactions(freshTxs);
            
            // If current tab doesn't exist in fresh data, switch to first one
            if (!sheets.includes(currentSheet)) {
                setCurrentSheet(sheets[0]);
            }

            setGoals(prev => ({ ...prev, [data.activeSheet]: g }));
            setUnitGoals(prev => ({ ...prev, [data.activeSheet]: ug }));

            // Update Cache for NEXT reload
            const cachePayload = {
                sheets,
                allTransactions: freshTxs,
                goals: { ...goals, [data.activeSheet]: g },
                unitGoals: { ...unitGoals, [data.activeSheet]: ug}
            };
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(cachePayload));
        }
      } catch (err) {
        console.error("Background fetch error", err);
      }
    };

    loadData();
  }, [currentSheet]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update Cache when data changes (snappy persistence)
  useEffect(() => {
    if (!mounted) return;
    const cachePayload = {
        sheets: allSheets,
        allTransactions,
        goals,
        unitGoals
    };
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(cachePayload));
  }, [allSheets, allTransactions, goals, unitGoals, mounted]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key) {
        case 'ArrowRight':
          // RTL: Right Arrow -> Next Tab (Visually Left? No, usually Right arrow means go right)
          // In RTL list: [3] [2] [1]
          // If at [1], Right Arrow should probably go to [2] (Index + 1)?
          // Or does it follow visual direction?
          // Let's try: Right -> Index - 1 (Visually Right in RTL), Left -> Index + 1 (Visually Left in RTL)
          e.preventDefault();
          setAllSheets(sheets => {
            const idx = sheets.indexOf(currentSheet);
            const nextIdx = idx > 0 ? idx - 1 : sheets.length - 1; // Cycle
            setCurrentSheet(sheets[nextIdx]);
            return sheets; // No state change for sheets, just return
          });
          break;
        case 'ArrowLeft':
           e.preventDefault();
           setAllSheets(sheets => {
            const idx = sheets.indexOf(currentSheet);
            const nextIdx = idx < sheets.length - 1 ? idx + 1 : 0; // Cycle
            setCurrentSheet(sheets[nextIdx]);
            return sheets; 
          });
          break;
        case 'Escape':
          setIsNavOpen(false);
          setShowAddTabModal(false);
          // If we lift state for "Add Transaction", we could close it here too
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSheet]); // Re-bind when currentSheet changes to get fresh state? 
  // Actually setAllSheets updater gives fresh sheets, but we need currentSheet. 
  // Better use functional update or dependency.


  // ... (Rest of component logic remains similar) ...

  // handleRenameTab removed (unused)


  // Set mounted state for hydration stability
  useEffect(() => {
    setMounted(true);
  }, []);

  // Removed local cachedData in favor of global allTransactions
  /* 
  const [cachedData, setCachedData] = useState<Record<string, any[]>>({
    [initialSheets[0] || "تبرعاتي"]: initialTransactions
  });
  */

  const router = useRouter();

  // --- Back to Home Logic ---
  useEffect(() => {
    // 1. Setup Root Trap (Trap "Back" to go to Home)
    const initTrap = () => {
      // If we are not already in our "app" state, push the root state
      if (!window.history.state?.appRoot) {
        window.history.pushState({ appRoot: true }, '', window.location.href);
      }
    };
    
    // Run after mount to ensure router is ready
    setTimeout(initTrap, 50);

    const handlePopState = () => {
      // If we are here, we popped the root state.
      // Redirect to App Selector (Home)
      router.push('/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

  // Save Last Active App
  useEffect(() => {
    localStorage.setItem("last_app", "/donations");
  }, []);

  const handleLogout = () => {
    // Clear Client Cache
    localStorage.removeItem(STORAGE_KEY_DATA);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem("last_app");
    
    // Fire-and-forget: redirect immediately, server cleans up in background
    window.location.href = "/login"; // Force hard reload to clear cache
    logoutUser(); // No await - runs in background
  };

  const handleGoHome = () => {
    window.location.href = "/"; // Force reload to ensure App Selector loads fresh
  };

  // Search State
  // searchTerm is now updated via Debounce from SearchInput, so it doesn't cause lag
  
  // Turbo Mode: Derived transactions for current tab & search
  // Memoized to prevent re-calculations on every render, only when dependencies change
  const transactions = useMemo(() => {
    return allTransactions.filter(t => {
      if (t.category !== currentSheet) return false;
      
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return (
          t.name.toLowerCase().includes(q) || 
          (t.note && t.note.toLowerCase().includes(q))
        );
      }
      
      return true;
    });
  }, [allTransactions, currentSheet, searchTerm]);

  useEffect(() => {
    // Parallel Fetch Goal for SPA experience
    const fetchGoal = async () => {
      // Only fetch if we don't have it yet to avoid loops
      if (goals[currentSheet] === undefined) {
        setGoalsLoading(prev => ({ ...prev, [currentSheet]: true }));
        try {
          const { getCategoryGoal } = await import("@/app/actions");
          const g = await getCategoryGoal(currentSheet);
          setGoals(prev => ({ ...prev, [currentSheet]: g }));
        } finally {
          setGoalsLoading(prev => ({ ...prev, [currentSheet]: false }));
        }
      }
    };
    fetchGoal();

    // Fetch Unit Goal
    const fetchUnitGoal = async () => {
      if (unitGoals[currentSheet] === undefined) {
        try {
          const { getUnitGoal } = await import("@/app/actions");
          const ug = await getUnitGoal(currentSheet);
          setUnitGoals(prev => ({ ...prev, [currentSheet]: ug }));
        } catch (e) {
          console.error("Error fetching unit goal:", e);
        }
      }
    };
    fetchUnitGoal();
  }, [currentSheet]); // eslint-disable-line react-hooks/exhaustive-deps

  // Supabase Realtime - Sync changes globally (Run ONCE)
  useEffect(() => {
    const channel = supabase
      .channel('schema-tx-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          // No filter here for Turbo Mode -> Sync everything
        },
        async () => {
          // Refresh ALL data to keep global cache in sync
          const { getAllTransactions } = await import("@/app/actions");
          const fresh = await getAllTransactions();
          setAllTransactions(fresh);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateTab = () => {
    if (!newTabName.trim()) return;

    const prevSheets = [...allSheets];
    const name = newTabName.trim();
    
    // Optimistic UI: update immediately
    setAllSheets([...allSheets, name]);
    setCurrentSheet(name);
    setNewTabName("");
    setShowAddTabModal(false);

    // Save in background (no waiting)
    createSheet(name).then(res => {
      if (!res.success) {
        // Rollback on error
        setAllSheets(prevSheets);
        setCurrentSheet(prevSheets[0]);
        toast.error("فشل في إنشاء التصنيف");
      }
    }).catch(() => {
      setAllSheets(prevSheets);
      setCurrentSheet(prevSheets[0]);
    });
  };

  const handleDeleteTab = async (sheetName: string) => {
    // Prevent deleting the last remaining tab
    if (allSheets.length <= 1) {
      toast.error("لا يمكن حذف آخر تصنيف");
      return;
    }

    const previousSheets = [...allSheets];
    const filtered = allSheets.filter(s => s !== sheetName);
    setAllSheets(filtered);
    if (currentSheet === sheetName) setCurrentSheet(filtered[0]);

    try {
      const res = await deleteSheet(sheetName);
      if (!res.success) setAllSheets(previousSheets);
    } catch {
      setAllSheets(previousSheets);
    }
  }

  const handleDeleteTransaction = async (id: number) => {
    const prevAllTransactions = [...allTransactions];
    
    // Optimistic Delete
    const filtered = allTransactions.filter(t => t.id !== id);
    setAllTransactions(filtered);

    try {
      const { deleteTransaction } = await import("@/app/actions");
      const res = await deleteTransaction(currentSheet, id);
      if (!res.success) {
        setAllTransactions(prevAllTransactions);
      }
    } catch {
      setAllTransactions(prevAllTransactions);
    }
  }

  // Sidebar Handlers
  const handleSidebarCreate = () => {
    if (!newSidebarTabName.trim()) {
        setIsSidebarCreating(false);
        return;
    }
    const name = newSidebarTabName.trim();
    // Reusing existing logic but for specific state
    const prevSheets = [...allSheets];
    setAllSheets([...allSheets, name]);
    setCurrentSheet(name);
    setIsSidebarCreating(false);
    setNewSidebarTabName("");

    createSheet(name).then(res => {
      if (!res.success) {
        setAllSheets(prevSheets);
        setCurrentSheet(prevSheets[0]);
        toast.error("فشل في إنشاء التصنيف");
      }
    }).catch(() => {
        setAllSheets(prevSheets);
        setCurrentSheet(prevSheets[0]);
    });
  };

  const handleSidebarRenameSave = async () => {
      if (!editingSidebarSheet || !renameSidebarValue.trim() || renameSidebarValue === editingSidebarSheet) {
          setEditingSidebarSheet(null);
          return;
      }
      const oldName = editingSidebarSheet;
      const newName = renameSidebarValue.trim();
      
      const prevSheets = [...allSheets];
      const newSheets = allSheets.map(s => s === oldName ? newName : s);
      setAllSheets(newSheets);
      if (currentSheet === oldName) setCurrentSheet(newName);
      setEditingSidebarSheet(null);

      try {
        const res = await renameSheet(oldName, newName);
        if (!res.success) {
            toast.error("فشل في تغيير الاسم");
            setAllSheets(prevSheets);
            if (currentSheet === newName) setCurrentSheet(oldName);
        }
      } catch {
          setAllSheets(prevSheets);
          if (currentSheet === newName) setCurrentSheet(oldName);
      }
  };

  const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-20" suppressHydrationWarning>

      {/* ================= HEADER ================= */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-5 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-xl md:max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            
            {/* Avatar - Clickable for Navigation */}
            <button 
              onClick={() => setIsNavOpen(true)}
              className="relative group transition-transform active:scale-95 outline-none"
            >
              {(() => {
                if (username === "جاري التحميل...") {
                  return <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse shrink-0" />;
                }

                if (username.includes("ادم")) {
                   return (
                     <div className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-lg shadow-gray-200 shrink-0 overflow-hidden bg-white">
                        <Image src="/adam.jpg" alt="Avatar" width={48} height={48} className="w-full h-full object-cover" />
                     </div>
                   );
                }

                if (username.includes("نسرين")) {
                   return (
                     <div className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-lg shadow-gray-200 shrink-0 overflow-hidden bg-white">
                        <Image src="/nesreen.jpg" alt="Avatar" width={48} height={48} className="w-full h-full object-cover" />
                     </div>
                   );
                }

                if (username.includes("نور")) {
                   return (
                     <div className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-lg shadow-gray-200 shrink-0 overflow-hidden bg-white">
                            <Image src="/noor.webp" alt="Avatar" width={48} height={48} className="w-full h-full object-cover" />
                         </div>
                       );
                    }
                    
                    // Fallback to Gradient Letter for others (until photos are added)
                    return (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-gray-200 shrink-0">
                        {username.slice(0, 1)}
                      </div>
                    );
                  })()}
                  
                </button>

            <div className="space-y-0.5">
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                {username !== "جاري التحميل..." ? username.split(" ")[0] : "..."} 👋
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-bold text-gray-400">{currentSheet}</p>
                <div className="w-1 h-1 rounded-full bg-emerald-400 mr-[-5px] animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              </div>
            </div>
          </div>

          <div className="text-center bg-emerald-50/50 px-4 py-2 rounded-2xl border border-emerald-100/50 backdrop-blur-sm">
            <div className="text-[10px] text-emerald-600 font-black mb-0.5 uppercase tracking-wider opacity-80">إجمالي المبلغ</div>
            <div className="text-xl font-black text-emerald-600 leading-none tracking-tight">
              {total.toLocaleString()}
            </div>
          </div>

          {/* DESKTOP HEADER NAVIGATION */}
          <nav className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 bg-gray-50/50 p-1.5 rounded-xl border border-gray-200/50 backdrop-blur-sm">
             <button
              onClick={() => setViewMode('list')}
              className={cn(
                "h-9 px-4 rounded-lg flex items-center gap-2 transition-all outline-none focus:outline-none focus:ring-0 cursor-pointer",
                viewMode === 'list'
                  ? "bg-white text-emerald-600 shadow-sm border border-emerald-100 font-bold"
                  : "text-gray-500 hover:bg-gray-100 font-medium hover:text-gray-700"
              )}
            >
              <Home className="w-4 h-4" />
              <span className="text-xs">الرئيسية</span>
            </button>
             <button
              onClick={() => setViewMode('stats')}
              className={cn(
                "h-9 px-4 rounded-lg flex items-center gap-2 transition-all outline-none focus:outline-none focus:ring-0 cursor-pointer",
                viewMode === 'stats'
                  ? "bg-white text-emerald-600 shadow-sm border border-emerald-100 font-bold"
                  : "text-gray-500 hover:bg-gray-100 font-medium hover:text-gray-700"
              )}
            >
              <PieChartIcon className="w-4 h-4" />
              <span className="text-xs">الإحصائيات</span>
            </button>
             <button
              onClick={() => setViewMode('settings')}
              className={cn(
                "h-9 px-4 rounded-lg flex items-center gap-2 transition-all outline-none focus:outline-none focus:ring-0 cursor-pointer",
                viewMode === 'settings'
                  ? "bg-white text-emerald-600 shadow-sm border border-emerald-100 font-bold"
                  : "text-gray-500 hover:bg-gray-100 font-medium hover:text-gray-700"
              )}
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs">الإعدادات</span>
            </button>
          </nav>
        </div>
      </header>

      <div className="md:max-w-5xl md:mx-auto md:flex md:gap-8 md:items-start md:mt-8 md:px-6"> 
        {/* ================= DESKTOP SIDEBAR (SHEETS) ================= */}
        <aside className="hidden md:flex flex-col gap-4 w-64 sticky top-28 shrink-0 h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar pl-2 pb-6">
            
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">الدفاتر</h3>
                <button 
                  onClick={() => setIsSidebarCreating(true)}
                  className="w-6 h-6 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex flex-col gap-1.5 min-h-[50px]">
                {allSheets.map(sheet => {
                    if (editingSidebarSheet === sheet) {
                        return (
                            <div key={sheet} className="w-full p-1 bg-white border-2 border-emerald-500 rounded-xl flex items-center gap-2 shadow-sm">
                                <button onClick={handleSidebarRenameSave} className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-200 transition-colors cursor-pointer">
                                    <Check className="w-4 h-4" />
                                </button>
                                <input 
                                    autoFocus
                                    className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-gray-800 text-right min-w-0"
                                    value={renameSidebarValue}
                                    onChange={(e) => setRenameSidebarValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter') handleSidebarRenameSave();
                                        if(e.key === 'Escape') setEditingSidebarSheet(null);
                                    }}
                                />
                                <button onClick={() => setEditingSidebarSheet(null)} className="w-8 h-8 text-gray-400 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    }

                    return (
                        <ContextMenu key={sheet}>
                            <ContextMenuTrigger>
                                <div className="group relative">
                                    <button
                                        onClick={() => {
                                            setCurrentSheet(sheet);
                                            setViewMode('list'); 
                                        }}
                                        className={cn(
                                            "w-full h-11 rounded-xl flex items-center justify-between px-3 transition-all outline-none focus:outline-none focus:ring-0 relative cursor-pointer select-none",
                                            currentSheet === sheet
                                                ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-800 shadow-sm z-10"
                                                : "bg-white border border-transparent hover:border-emerald-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FolderOpen className={cn("w-4 h-4 shrink-0", currentSheet === sheet ? "fill-emerald-200 text-emerald-600" : "text-gray-400")} />
                                            <span className={cn("font-bold text-sm truncate", currentSheet === sheet ? "text-emerald-900" : "group-hover:text-gray-900")}>
                                                {sheet}
                                            </span>
                                        </div>
                                        {currentSheet === sheet && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />}
                                    </button>
                                </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-48">
                                <ContextMenuItem 
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => { setEditingSidebarSheet(sheet); setRenameSidebarValue(sheet); }}
                                >
                                    <Pencil className="w-4 h-4" />
                                    <span>تعديل الاسم</span>
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem 
                                    className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                    onClick={() => setSheetToDelete(sheet)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>حذف الدفتر</span>
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    );
                })}

                {/* Inline Creation */}
                {isSidebarCreating ? (
                    <div className="w-full p-1.5 bg-white border-2 border-emerald-500 rounded-xl flex items-center gap-2 shadow-md mt-2 animate-in fade-in slide-in-from-top-2">
                        <button onClick={handleSidebarCreate} className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer shadow-sm">
                            <Check className="w-4 h-4 stroke-[3px]" />
                        </button>
                        <input 
                            autoFocus
                            className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-gray-800 text-right min-w-0 placeholder:text-gray-300"
                            placeholder="اسم الدفتر..."
                            value={newSidebarTabName}
                            onChange={(e) => setNewSidebarTabName(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') handleSidebarCreate();
                                if(e.key === 'Escape') setIsSidebarCreating(false);
                            }}
                        />
                        <button onClick={() => setIsSidebarCreating(false)} className="w-8 h-8 text-gray-400 rounded-lg flex items-center justify-center hover:bg-gray-100 hover:text-red-500 transition-colors cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => { setIsSidebarCreating(true); setNewSidebarTabName(""); }}
                        className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold text-xs flex items-center justify-center gap-2 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all mt-3 cursor-pointer group"
                    >
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span>إنشاء دفتر جديد</span>
                    </button>
                )}
            </div>

            {/* Sidebar Footer */}
            {/* Sidebar Footer */}
            {/* Sidebar Footer */}
             <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-2.5">
                <a 
                   href="/families" 
                   className="w-full h-11 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 flex items-center justify-between group cursor-pointer transition-all duration-300 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-3 relative z-10 w-full">
                        <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                            <Grid3X3 className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-sm tracking-wide flex-1 text-right truncate">تطبيق العائلات</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 relative z-10 opacity-70 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all shrink-0" />
                </a>
                
                <button 
                  onClick={handleLogout}
                  className="w-full h-11 px-3 rounded-xl bg-white border border-red-100 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:shadow-md hover:shadow-red-50 flex items-center justify-between transition-all duration-300 group cursor-pointer"
                >
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-7 h-7 rounded-lg bg-red-50 group-hover:bg-white flex items-center justify-center transition-colors shrink-0">
                             <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600 group-hover:rotate-12 transition-all" />
                        </div>
                        <span className="font-bold text-sm flex-1 text-right truncate">تسجيل الخروج</span>
                    </div>
                </button>
            </div>
        </aside>

      <main {...swipeHandlers} className="flex-1 w-full max-w-xl mx-auto px-6 py-4 pb-24 space-y-6 text-right md:px-0 md:py-0 md:max-w-none">
        {/* ================= ACTIONS & DATA SECTION ================= */}
        <section className="space-y-6">
          {/* Redundant navigation icons removed for cleaner UI */}
          {viewMode === 'stats' ? (
            <StatisticsView 
              transactions={transactions}
              currentSheet={currentSheet}
              goal={goals[currentSheet] || 0}
              loadingGoal={goalsLoading[currentSheet]}
              onGoalChange={() => {}} // View only - no changes
              onBack={() => setViewMode('list')}
              unitGoal={unitGoals[currentSheet] || { enabled: false, unitName: '', unitPrice: 0, unitTarget: 0 }}
              onUnitGoalChange={() => {}} // View only - no changes
            />
          ) : viewMode === 'settings' ? (
            <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-500" />
                  الإعدادات
                </h2>
              </div>

              {/* Goals Card */}
              <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <h3 className="font-black text-gray-800">أهداف التبرع</h3>
                </div>

                {/* 4 Inputs Grid */}
                <div className="grid grid-cols-2 gap-5">
                  {/* Financial Goal */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                      الهدف المالي
                    </label>
                    <div className="relative group">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(goals[currentSheet] || 0) === 0 ? "" : (goals[currentSheet] || 0).toLocaleString()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '');
                          if (/^\d*$/.test(raw)) {
                            const newGoal = parseFloat(raw) || 0;
                            setGoals(prev => ({ ...prev, [currentSheet]: newGoal }));
                            // Debounced server call
                            if (goalDebounce.current) clearTimeout(goalDebounce.current);
                            goalDebounce.current = setTimeout(() => {
                              import("@/app/actions").then(({ updateCategoryGoal }) => {
                                updateCategoryGoal(currentSheet, newGoal);
                              });
                            }, 1000);
                          }
                        }}
                        placeholder="90,000"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 font-bold text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-right"
                      />
                    </div>
                  </div>
                  
                  {/* Unit Target */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-rose-500" />
                      هدف الوحدة
                    </label>
                    <div className="relative group">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors pointer-events-none">
                         <Target className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(unitGoals[currentSheet]?.unitTarget || 0) === 0 ? '' : unitGoals[currentSheet]?.unitTarget}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '');
                          if (/^\d*$/.test(raw)) {
                            const current = unitGoals[currentSheet] || { enabled: true, unitName: '', unitPrice: 0, unitTarget: 0 };
                            const newVal = parseInt(raw) || 0;
                            const isEnabled = newVal > 0 || current.unitName.trim() !== '' || current.unitPrice > 0;
                            const updated = { ...current, unitTarget: newVal, enabled: isEnabled };
                            setUnitGoals(prev => ({ ...prev, [currentSheet]: updated }));
                            // Debounced server call
                            if (unitTargetDebounce.current) clearTimeout(unitTargetDebounce.current);
                            unitTargetDebounce.current = setTimeout(() => {
                              import("@/app/actions").then(({ updateUnitGoal }) => {
                                updateUnitGoal(currentSheet, updated);
                              });
                            }, 1000);
                          }
                        }}
                        placeholder="50"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 font-bold text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all text-right"
                      />
                    </div>
                  </div>
                  
                  {/* Unit Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-500" />
                      اسم الوحدة
                    </label>
                    <div className="relative group">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">
                        <Package className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={unitGoals[currentSheet]?.unitName || ''}
                        onChange={(e) => {
                          const current = unitGoals[currentSheet] || { enabled: true, unitName: '', unitPrice: 0, unitTarget: 0 };
                          const newVal = e.target.value;
                          const isEnabled = newVal.trim() !== '' || current.unitPrice > 0 || current.unitTarget > 0;
                          const updated = { ...current, unitName: newVal, enabled: isEnabled };
                          setUnitGoals(prev => ({ ...prev, [currentSheet]: updated }));
                          // Debounced server call
                          if (unitNameDebounce.current) clearTimeout(unitNameDebounce.current);
                          unitNameDebounce.current = setTimeout(() => {
                            import("@/app/actions").then(({ updateUnitGoal }) => {
                              updateUnitGoal(currentSheet, updated);
                            });
                          }, 1000);
                        }}
                        placeholder="شنطة"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 font-bold text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all text-right"
                      />
                    </div>
                  </div>
                  
                  {/* Unit Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-blue-500" />
                      سعر الوحدة
                    </label>
                    <div className="relative group">
                       <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                        <Coins className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(unitGoals[currentSheet]?.unitPrice || 0) === 0 ? '' : unitGoals[currentSheet]?.unitPrice}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '');
                          if (/^\d*$/.test(raw)) {
                            const current = unitGoals[currentSheet] || { enabled: true, unitName: '', unitPrice: 0, unitTarget: 0 };
                            const newVal = parseFloat(raw) || 0;
                            const isEnabled = newVal > 0 || current.unitName.trim() !== '' || current.unitTarget > 0;
                            const updated = { ...current, unitPrice: newVal, enabled: isEnabled };
                            setUnitGoals(prev => ({ ...prev, [currentSheet]: updated }));
                            // Debounced server call
                            if (unitPriceDebounce.current) clearTimeout(unitPriceDebounce.current);
                            unitPriceDebounce.current = setTimeout(() => {
                              import("@/app/actions").then(({ updateUnitGoal }) => {
                                updateUnitGoal(currentSheet, updated);
                              });
                            }, 1000);
                          }
                        }}
                        placeholder="250"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 font-bold text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Management Card */}
              <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Database className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-black text-gray-800">إدارة البيانات</h3>
                </div>

                <div className="space-y-3">
                  {/* Export Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="w-full bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 p-4 rounded-xl flex items-center justify-between group transition-all focus:outline-none focus:ring-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Download className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">تصدير البيانات (CSV)</div>
                            <div className="text-[10px] text-indigo-400 font-semibold">تحميل نسخة من العمليات</div>
                          </div>
                        </div>
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md w-full rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl focus:outline-none">
                      <div className="p-8 flex flex-col items-center text-center gap-4 bg-white">
                        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
                           <Download className="w-8 h-8 text-indigo-500 stroke-[1.5]" />
                        </div>
                        
                        <div className="space-y-2">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-black text-gray-900 text-center">
                                    تصدير البيانات؟
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-center text-gray-500 font-medium">
                                    سيتم تجهيز ملف بصيغة CSV يحتوي على كافة العمليات <br/> المسجلة في دفتر <b>&quot;{currentSheet}&quot;</b>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                        </div>

                        <AlertDialogFooter className="flex-col-reverse sm:flex-row-reverse sm:space-x-2 w-full gap-2 mt-4">
                             <AlertDialogAction 
                                onClick={() => {
                                  try {
                                    // Calculate Summaries
                                    const totalIn = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
                                    const totalOut = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
                                    const netTotal = totalIn - totalOut;

                                    let csvContent = "\uFEFF";
                                    
                                    // Section 1: Meta Info
                                    csvContent += `Transactions Report\n`;
                                    csvContent += `Sheet Name,${currentSheet}\n`;
                                    csvContent += `User Name,${username !== "جاري التحميل..." ? username : ""}\n`;
                                    csvContent += `Export Date,${new Date().toLocaleDateString('en-US')}\n`;
                                    csvContent += `\n`; // Spacer

                                    // Section 2: Dashboard Summary
                                    csvContent += `Dashboard Summary\n`;
                                    csvContent += `Total In,${totalIn}\n`;
                                    csvContent += `Total Out,${totalOut}\n`;
                                    csvContent += `Net Total,${netTotal}\n`;
                                    csvContent += `\n`; // Spacer

                                    // Section 3: Details
                                    csvContent += `Transaction Details\n`;
                                    csvContent += `Date,Name,Type,Amount,Note\n`;

                                    transactions.forEach(row => {
                                      const type = row.amount >= 0 ? "Income" : "Expense";
                                      const absAmount = Math.abs(row.amount);
                                      // Escape quotes in note
                                      const safeNote = (row.note || "").replace(/"/g, '""');
                                      
                                      csvContent += `${row.date},${row.name},${type},${absAmount},"${safeNote}"\n`;
                                    });

                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement("a");
                                    link.href = URL.createObjectURL(blob);
                                    link.download = `Report_${currentSheet}_${new Date().toISOString().split('T')[0]}.csv`;
                                    link.click();
                                  } catch (e) {
                                    console.error(e);
                                    toast.error("Export Failed");
                                  }
                                }} 
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-indigo-200 focus:outline-none focus:ring-0 transition-all"
                            >
                                تصدير الآن
                            </AlertDialogAction>
                            <AlertDialogCancel className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-xl h-12 font-bold focus:outline-none focus:ring-0 transition-all">
                                إلغاء
                            </AlertDialogCancel>
                        </AlertDialogFooter>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Delete Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="w-full bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 p-4 rounded-xl flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">مسح كافة البيانات</div>
                            <div className="text-[10px] text-red-400 font-semibold">حذف نهائي لجميع العمليات</div>
                          </div>
                        </div>
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md w-full rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl focus:outline-none">
                      <div className="p-8 flex flex-col items-center text-center gap-4 bg-white">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
                           <Trash2 className="w-8 h-8 text-red-500 stroke-[1.5]" />
                        </div>
                        
                        <div className="space-y-2">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-black text-gray-900 text-center">
                                    مسح الدفتر؟
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-center text-gray-500 font-medium">
                                    هل أنت متأكد من مسح جميع العمليات في <b>&quot;{currentSheet}&quot;</b>؟ <br/>
                                    <span className="text-red-500 font-bold block mt-1">لا يمكن التراجع عن هذا الإجراء وسيتم تصفير الدفتر.</span>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                        </div>

                        <AlertDialogFooter className="flex-col-reverse sm:flex-row-reverse sm:space-x-2 w-full gap-2 mt-4">
                             <AlertDialogAction 
                                onClick={() => {
                                  const prevAll = [...allTransactions];
                                  // Optimistic clear for THIS category
                                  setAllTransactions(allTransactions.filter(t => t.category !== currentSheet));
                                  
                                  clearAllTransactions(currentSheet).then(res => {
                                    if (!res?.success) {
                                      setAllTransactions(prevAll);
                                    }
                                  }).catch(() => {
                                    setAllTransactions(prevAll);
                                  });
                                }} 
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-200 focus:outline-none focus:ring-0 transition-all"
                            >
                                نعم، امسح الكل
                            </AlertDialogAction>
                            <AlertDialogCancel className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-xl h-12 font-bold focus:outline-none focus:ring-0 transition-all">
                                إلغاء
                            </AlertDialogCancel>
                        </AlertDialogFooter>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
              {/* Search Bar - Isolated Component for Perf */}
              <SearchInput 
                onSearch={setSearchTerm} 
                placeholder="بحث في العمليات..." 
              />

              <TransactionList
                transactions={transactions}
                sheetName={currentSheet}
                onDelete={handleDeleteTransaction}
                onUpdate={(newList) => {
                  // newList is the filtered list, we need to merge it back into allTransactions
                  const otherTxs = allTransactions.filter(t => t.category !== currentSheet);
                  setAllTransactions([...otherTxs, ...newList]);
                }}
                onAddSuccess={() => {
                   import("@/app/actions").then(async ({ getAllTransactions }) => {
                      const data = await getAllTransactions();
                      setAllTransactions(data);
                   });
                }}
              />
            </div>
          )}
          
          {/* Logout Button Removed - Moved to NavigationHub */}

        </section>
      </main>
      </div>

      <Dialog open={showAddTabModal} onOpenChange={setShowAddTabModal}>
        <DialogContent className="max-w-md w-full rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl focus:outline-none">
          <div className="p-8 flex flex-col items-center text-center gap-4 bg-white">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
               <FolderOpen className="w-8 h-8 text-emerald-500 stroke-[1.5]" />
            </div>
            
            <div className="space-y-2 w-full">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-gray-900 text-center">
                        إضافة دفتر جديد
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500 font-medium">
                        قم بتسمية الدفتر الجديد لتنظيم عملياتك المالية بشكل أفضل.
                    </DialogDescription>
                </DialogHeader>
            </div>

            <div className="w-full mt-2">
               <input
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="اسم الدفتر (مثال: صدقة، زكاة)"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-base text-gray-800 focus:outline-none focus:ring-0 focus:border-emerald-500 transition-all text-right placeholder:text-gray-300"
                autoFocus
                onKeyDown={(e) => {
                    if(e.key === 'Enter') handleCreateTab();
                }}
              />
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row-reverse sm:space-x-2 w-full gap-2 mt-4">
                 <button 
                   onClick={handleCreateTab}
                   className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-14 font-black shadow-lg shadow-emerald-100 focus:outline-none focus:ring-0 transition-all flex items-center justify-center gap-2"
                 >
                    <Plus className="w-5 h-5 stroke-[3px]" />
                    إضافة الدفتر
                </button>
                <button 
                  onClick={() => setShowAddTabModal(false)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-500 border-0 rounded-xl h-14 font-bold focus:outline-none focus:ring-0 transition-all"
                >
                    تراجع
                </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Delete Confirmation */}
      <AlertDialog open={!!sheetToDelete} onOpenChange={(open) => !open && setSheetToDelete(null)}>
        <AlertDialogContent className="max-w-md w-full rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl focus:outline-none">
          <div className="p-8 flex flex-col items-center text-center gap-4 bg-white">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
               <Trash2 className="w-8 h-8 text-red-500 stroke-[1.5]" />
            </div>
            
            <div className="space-y-2">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black text-gray-900 text-center">
                        حذف &quot;{sheetToDelete}&quot;؟
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-gray-500 font-medium">
                        هل أنت متأكد من حذف هذا الدفتر؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع البيانات المرتبطة به.
                    </AlertDialogDescription>
                </AlertDialogHeader>
            </div>

            <AlertDialogFooter className="flex-col-reverse sm:flex-row-reverse sm:space-x-2 w-full gap-2 mt-4">
                 <AlertDialogAction 
                    onClick={() => {
                        if (sheetToDelete) handleDeleteTab(sheetToDelete);
                        setSheetToDelete(null);
                    }} 
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-200 hover:shadow-red-300 transition-all"
                >
                    نعم، حذف نهائي
                </AlertDialogAction>
                <AlertDialogCancel className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-xl h-12 font-bold transition-all">
                    تراجع
                </AlertDialogCancel>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <NavigationHub
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        currentView={viewMode}
        onViewChange={setViewMode}
        username={username}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        sheets={allSheets}
        currentSheet={currentSheet}
        onSheetChange={setCurrentSheet}
        onRename={async (oldName, newName) => {
             // Wrapper to handle rename from Hub
             if (!newName.trim() || newName === oldName) return;
             
             const prevSheets = [...allSheets];
             const newSheets = allSheets.map(s => s === oldName ? newName : s);
             setAllSheets(newSheets);
             if (currentSheet === oldName) setCurrentSheet(newName);

             try {
               const res = await renameSheet(oldName, newName);
               if (!res.success) {
                  toast.error("فشل في تغيير الاسم");
                  setAllSheets(prevSheets);
                  if (currentSheet === newName) setCurrentSheet(oldName);
               }
             } catch (e) {
                setAllSheets(prevSheets);
                if (currentSheet === newName) setCurrentSheet(oldName);
             }
        }}
        onDelete={handleDeleteTab}
        onAdd={(name) => {
           if (!name.trim()) return;
           const newName = name.trim();
           
           // Optimistic UI
           const prevSheets = [...allSheets];
           setAllSheets([...allSheets, newName]);
           setCurrentSheet(newName);

           createSheet(newName).then(res => {
             if (!res.success) {
               setAllSheets(prevSheets);
               setCurrentSheet(prevSheets[0]);
               toast.error("فشل في إنشاء التصنيف");
             }
           }).catch(() => {
             setAllSheets(prevSheets);
             setCurrentSheet(prevSheets[0]);
           });
        }}
      />

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="bg-white/95 backdrop-blur-3xl border-t border-gray-100 shadow-[0_-4px_25px_rgba(0,0,0,0.04)] rounded-t-[1.2rem] px-6 pt-3 pb-2.5 flex items-center justify-between">
          
          {/* Home Tab */}
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 transition-all active:scale-95",
              viewMode === 'list' 
                ? "text-emerald-600" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Home className={cn("w-7 h-7", viewMode === 'list' ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
            <span className={cn("text-[11px] font-black tracking-tight", viewMode === 'list' ? "opacity-100" : "opacity-60")}>الرئيسية</span>
          </button>

          {/* Stats Tab */}
          <button
            onClick={() => setViewMode('stats')}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 transition-all active:scale-95",
              viewMode === 'stats' 
                ? "text-indigo-600" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <PieChartIcon className={cn("w-7 h-7", viewMode === 'stats' ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
            <span className={cn("text-[11px] font-black tracking-tight", viewMode === 'stats' ? "opacity-100" : "opacity-60")}>الإحصائيات</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setViewMode('settings')}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 transition-all active:scale-95",
              viewMode === 'settings' 
                ? "text-amber-600" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Settings className={cn("w-7 h-7", viewMode === 'settings' ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
            <span className={cn("text-[11px] font-black tracking-tight", viewMode === 'settings' ? "opacity-100" : "opacity-60")}>الإعدادات</span>
          </button>

        </div>
      </div>
    </div>
  );
}
