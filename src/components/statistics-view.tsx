"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";
import { TrendingUp, Target, Wallet, AlertCircle, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getCategoryGoal, updateCategoryGoal } from "@/app/actions";

interface Transaction {
  id: number;
  date: string;
  createdAt: string;
  name: string;
  amount: number;
  note: string;
}

interface StatisticsViewProps {
  transactions: Transaction[];
  currentSheet: string;
  goal: number;
  loadingGoal?: boolean;
  onGoalChange: (newGoal: number) => void;
  onBack: () => void;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export function StatisticsView({ 
  transactions, 
  currentSheet, 
  goal, 
  loadingGoal, 
  onGoalChange, 
  onBack 
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

      {/* Goal Section */}
      {/* Goal Section - Compact Horizontal */}
      <div className="bg-white p-4 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        
        {/* Right Side: Input & Collected */}
        <div className="flex flex-col gap-1 z-10 w-full">
           <div className="flex items-center gap-1.5 mb-1">
             <div className="p-1.5 bg-emerald-50 rounded-lg">
               <Target className="w-3.5 h-3.5 text-emerald-600" />
             </div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">هدفي المالي</span>
             {loadingGoal && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin ml-1" />}
           </div>
           
           <div className="relative group/input w-fit">
             <input 
               type="text" 
               inputMode="numeric"
               value={goal === 0 ? "" : goal.toLocaleString()}
               onChange={(e) => {
                 const rawValue = e.target.value.replace(/,/g, '');
                 if (/^\d*$/.test(rawValue)) {
                   onGoalChange(parseFloat(rawValue) || 0);
                 }
               }}
               placeholder="0"
               className="w-32 bg-transparent font-black text-3xl text-gray-800 placeholder:text-gray-200 outline-none transition-all p-0"
             />
             <span className="text-[10px] font-bold text-gray-400 absolute -left-16 bottom-1.5 pointer-events-none whitespace-nowrap">جُنَيْه مِصْرِيّ</span>
           </div>

           <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-1">
             <span>تم تجميع :</span>
             <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{net.toLocaleString()}</span>
           </div>
        </div>

        {/* Left Side: Circular Progress */}
        <div className="flex flex-col items-center gap-1 z-10 shrink-0">
          <div className="relative w-14 h-14">
            {/* SVG Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              {/* Background Circle */}
              <path
                className="text-gray-100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              {/* Progress Circle */}
              <path
                className="text-emerald-500 drop-shadow-sm transition-all duration-1000 ease-out"
                strokeDasharray={`${Math.min(progress, 100)}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <span className="text-[10px] font-black text-gray-700">{progress.toFixed(0)}%</span>
            </div>
          </div>
          
          <div className="text-[9px] font-bold text-gray-400 text-center">
            <span>باقي </span>
            <span className="text-rose-500">{remaining.toLocaleString()}</span>
          </div>
        </div>
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
