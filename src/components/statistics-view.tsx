"use client";

import { useMemo } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from "recharts";
import { TrendingUp, Package, Target, Wallet, Hourglass, PartyPopper } from "lucide-react";
import { type UnitGoalSettings } from "@/app/actions";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  date: string;
  createdAt: string;
  name: string;
  amount: number;
  note: string | null;
}

interface StatisticsViewProps {
  transactions: Transaction[];
  currentSheet: string;
  goal: number;
  loadingGoal?: boolean;
  onGoalChange: (newGoal: number) => void;
  onBack: () => void;
  unitGoal: UnitGoalSettings;
  onUnitGoalChange: (settings: UnitGoalSettings) => void;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export function StatisticsView({ 
  transactions, 
  currentSheet, 
  goal, 
  loadingGoal, 
  onGoalChange, 
  onBack,
  unitGoal,
  onUnitGoalChange
}: StatisticsViewProps) {
  // --- No internal state for goal, managed by parent for SPA feel ---

  // --- Calculations ---

  // 1. Financials
  const { totalIn, totalOut, net } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.amount >= 0) income += t.amount;
      else expense += Math.abs(t.amount);
    });
    return { totalIn: income, totalOut: expense, net: income - expense };
  }, [transactions]);

  // 2. Goal Progress
  const progress = goal > 0 ? (net / goal) * 100 : 0;
  const remaining = Math.max(0, goal - net);
  
  // Robust Number Parsing (handle "35,000" string case)
  const safeParse = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val.replace(/,/g, '')) || 0;
    return 0;
  };

  const isGoalReached = safeParse(goal) > 0 && safeParse(net) >= safeParse(goal);

  // 3. Confetti Effect
  useEffect(() => {
    if (isGoalReached) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isGoalReached]);

  // 3. Bar Chart Data (Monthly Trends)
  const monthlyData = useMemo(() => {
    const data: Record<string, { name: string; income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      // Use createdAt for reliable parsing, fallback to date if missing (legacy state)
      const d = new Date(t.createdAt || t.date); 
      const key = isNaN(d.getTime()) ? "Unknown" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = isNaN(d.getTime()) ? "غير معروف" : d.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' });

      if (!data[key]) data[key] = { name: label, income: 0, expense: 0 };
      
      if (t.amount >= 0) data[key].income += t.amount;
      else data[key].expense += Math.abs(t.amount);
    });

    // Sort by key (YYYY-MM)
    return Object.entries(data)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([, value]) => value);
  }, [transactions]);

  // 4. Pie Chart Data (Expenses by Name)
  const expenseDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.amount < 0).forEach(t => {
      const name = t.name.trim(); // Simplified grouping
      map[name] = (map[name] || 0) + Math.abs(t.amount);
    });

    // Convert to array and sort
    let result = Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Group small items into "Others" if too many
    if (result.length > 6) {
      const top5 = result.slice(0, 5);
      const others = result.slice(5).reduce((sum, item) => sum + item.value, 0);
      result = [...top5, { name: 'أخرى', value: others }];
    }

    return result;
  }, [transactions]);


  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          تحليلات {currentSheet}
        </h2>
      </div>

      {/* 🎯 GOALS SECTION - Animated Premium Design */}
      <div className="space-y-4">
        
        {/* Hero Card - Animated Violet Theme (Mobile) OR Gold Success Theme */}
        <div className={cn(
          "relative rounded-2xl p-4 text-white overflow-hidden shadow-xl transition-all duration-500",
          isGoalReached 
            ? "bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 shadow-emerald-500/25" 
            : "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-purple-500/25"
        )}>
          
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
            <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-6 left-1/3 w-1 h-1 bg-white/25 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
            {isGoalReached && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-300/20 blur-3xl rounded-full animate-pulse" />}
          </div>
          
          {/* Animated glow orbs */}
          <div className={`absolute -top-8 -left-8 w-24 h-24 rounded-full blur-2xl animate-pulse ${isGoalReached ? "bg-yellow-400/30" : "bg-pink-400/30"}`} />
          <div className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-3xl animate-pulse ${isGoalReached ? "bg-emerald-300/20" : "bg-violet-300/20"}`} style={{ animationDelay: '1s' }} />
          

          
          <div className="relative flex items-center gap-4">
            {/* Content - Right side in RTL (first in code) */}
            <div className="flex-1 space-y-1">
              {/* Row 1: الهدف المالي */}
              <div className="flex items-center gap-2">
                <span className="text-white/90 text-xs font-bold">الهدف المالي</span>
                <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center animate-pulse">
                  <Target className="w-3 h-3" />
                </div>
              </div>
              
              {/* Row 2: Amount */}
              <div className="text-[32px] font-black leading-none tracking-tight">
                {(goal > 0 ? goal : net).toLocaleString()}
              </div>
              <div className="text-white/70 text-xs font-semibold flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                <span>جنيه مصري</span>
              </div>
            </div>
            
            {/* Animated Progress Circle - LIVE Design (No Box) */}
            <div className="relative w-[72px] h-[72px] shrink-0">
              {/* Rotating outer ring - SVG based */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="0.5" 
                    strokeDasharray="4, 6"
                    className="opacity-30"
                  />
                </svg>
              </div>

              {/* Inner Circle */}
              <svg className="w-full h-full -rotate-90 relative" viewBox="0 0 36 36">
                {/* Background track */}
                <circle 
                  className="text-white/10" 
                  cx="18" cy="18" r="14" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                />
                {/* Progress arc */}
                <circle 
                  className="text-white" 
                  cx="18" cy="18" r="14" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(progress, 100) * 0.88}, 100`}
                  style={{ 
                    transition: 'stroke-dasharray 1s ease-out',
                    filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))'
                  }}
                />
                
                {/* Glowing dot at tip */}
                 <circle 
                  cx="18" cy="4" r="1.5"
                  fill="white"
                  className="animate-pulse origin-center"
                  style={{ 
                    transform: `rotate(${Math.min(progress, 100) * 3.6}deg)`,
                    transformOrigin: '18px 18px'
                  }}
                />
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-black animate-pulse" style={{ animationDuration: '3s' }}>
                  {progress.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Animated Progress Bar */}
          {goal > 0 && (
            <div className="space-y-2 mt-4">
              <div className="h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-pink-300 via-white to-violet-200 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
                </div>
              </div>
              
              {/* Stats Row with Icons */}
              <div className="flex justify-between text-xs font-bold mt-2">
                <div className="flex items-center gap-1 text-white/90 bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                  <TrendingUp className="w-3 h-3" />
                  <span>تم جمع {net.toLocaleString()}</span>
                </div>
                
                {isGoalReached ? (
                  <div className="flex items-center gap-1 text-white bg-emerald-500/20 rounded-lg px-2 py-1 backdrop-blur-md border border-white/20 shadow-sm">
                    <PartyPopper className="w-3.5 h-3.5 text-yellow-300" />
                    <span className="font-extrabold text-yellow-100">مبروك! الهدف مكتمل 🎉</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-white/80 bg-white/10 rounded-lg px-2 py-1">
                    <Hourglass className="w-3 h-3" />
                    <span>باقي {remaining > 0 ? remaining.toLocaleString() : '0'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Unit Tracking Card */}
        {unitGoal.enabled && unitGoal.unitPrice > 0 && (() => {
          const completed = Math.floor(net / unitGoal.unitPrice);
          const remaining = Math.max(0, unitGoal.unitTarget - completed);
          const pct = unitGoal.unitTarget > 0 ? (completed / unitGoal.unitTarget) * 100 : 0;
          
          return (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
              {/* Minimal Unit Tracking Card */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{unitGoal.unitName}</div>
                    <div className="text-[10px] font-medium text-gray-400">
                      {unitGoal.unitPrice.toLocaleString()} ج.م / {unitGoal.unitName}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-bold text-gray-400 mb-0.5">الهدف</div>
                  <div className="text-2xl font-black text-gray-900 leading-none">{unitGoal.unitTarget}</div>
                </div>
              </div>

              {/* Sleek Progress Bar */}
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div 
                  className="absolute inset-y-0 right-0 bg-gradient-to-l from-orange-400 to-amber-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              {/* Mini Stats Footer - Cards */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {/* Collected Card - Green */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex flex-col items-center justify-center text-center">
                  <div className="text-emerald-700 font-bold text-xs">
                    تم تجميع {completed} {unitGoal.unitName}
                  </div>
                </div>

                {/* Remaining Card - Red */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-2 flex flex-col items-center justify-center text-center">
                  <div className="text-red-700 font-bold text-xs">
                    متبقي {remaining}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center gap-1">
           <span className="text-[10px] uppercase font-bold text-emerald-600/60 tracking-wider">دخل</span>
           <span className="font-black text-emerald-600 text-lg leading-none">{totalIn.toLocaleString()}</span>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex flex-col items-center justify-center text-center gap-1">
           <span className="text-[10px] uppercase font-bold text-rose-600/60 tracking-wider">صرف</span>
           <span className="font-black text-rose-600 text-lg leading-none">{totalOut.toLocaleString()}</span>
        </div>
        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center gap-1">
           <span className="text-[10px] uppercase font-bold text-indigo-600/60 tracking-wider">صافي</span>
           <span className="font-black text-indigo-600 text-lg leading-none">{net.toLocaleString()}</span>
        </div>
      </div>

      {/* Top Expenses List */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
           <h3 className="font-black text-gray-700 text-sm">أعلى المصروفات</h3>
        </div>
        <div className="divide-y divide-gray-50">
           {expenseDistribution.slice(0, 5).map((item, i) => (
             <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
               <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-[10px] font-black text-gray-500">
                    {i + 1}
                  </span>
                  <span className="font-bold text-gray-700 text-sm">{item.name}</span>
               </div>
               <span className="font-black text-gray-900 text-sm">{item.value.toLocaleString()} <span className="text-[9px] text-gray-400 font-normal">ج.م</span></span>
             </div>
           ))}
           {expenseDistribution.length === 0 && (
             <div className="p-8 text-center text-gray-300 text-sm font-bold">لا توجد مصروفات حتى الآن</div>
           )}
        </div>
      </div>

      {/* Charts Grid - Hidden for Mobile Optimization Phase 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 pointer-events-none grayscale">
        ...
      </div>
      */}
    </div>
  );
}
