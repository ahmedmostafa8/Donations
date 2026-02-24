"use client";

import { Users, Heart, Stethoscope, Home as HomeIcon, Wallet, ShoppingBag, ExternalLink, GraduationCap, Baby, MapPin, ClipboardList, AlertTriangle, CalendarDays, UserCheck } from "lucide-react";
import { type Family, type FamilyStatus } from "@/app/families/types";
import { motion, PanInfo } from "framer-motion";

interface FamilyStatsProps {
  families: Family[];
  onBack: () => void;
}

const STATUS_ICONS: Record<FamilyStatus, React.ReactNode> = {
  "مرضي": <Stethoscope className="w-5 h-5" />,
  "أيتام": <Heart className="w-5 h-5" />,
  "ظروف خاصة": <Users className="w-5 h-5" />,
  "أسرة رقيقة الحال": <HomeIcon className="w-5 h-5" />,
  "أسرة غارمة": <Wallet className="w-5 h-5" />,
  "مشروع باب رزق": <ShoppingBag className="w-5 h-5" />,
  "أسرة خارجية": <ExternalLink className="w-5 h-5" />
};

export function FamilyStats({ families, onBack }: FamilyStatsProps) {
  // --- Calculations ---
  
  // 1. Status Analysis
  const statusCounts = families.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 2. Children Analysis
  const totalChildren = families.reduce((sum, f) => sum + (f.children?.length || 0), 0);
  const studentsCount = families.reduce((sum, f) => {
    return sum + (f.children?.filter(c => c.child_education && c.child_education.trim() !== "" && c.child_education !== "أمي").length || 0);
  }, 0);

  // 3. Area Analysis (Addresses)
  const areaCounts = families.reduce((acc, f) => {
    const area = f.address?.trim() || "غير محدد";
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 4. Researcher Workload Analysis
  const researcherCounts = families.reduce((acc, f) => {
    const name = f.researcher_name?.trim();
    if (name) {
      acc[name] = (acc[name] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const sortedResearchers = Object.entries(researcherCounts).sort((a, b) => b[1] - a[1]);
  const maxResearcherCount = sortedResearchers.length > 0 ? sortedResearchers[0][1] : 0;

  // 5. Research Timeline (by month)
  const monthCounts = families.reduce((acc, f) => {
    if (f.research_date) {
      const d = new Date(f.research_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const sortedMonths = Object.entries(monthCounts).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonthCount = sortedMonths.length > 0 ? Math.max(...sortedMonths.map(m => m[1])) : 0;

  // 6. Missing Data Report
  const missingData = {
    noPhone: families.filter(f => !f.wife_phone && !f.husband_phone).length,
    noAddress: families.filter(f => !f.address?.trim()).length,
    noAttachments: families.filter(f => !f.attachments || f.attachments.length === 0).length,
    noResearchDate: families.filter(f => !f.research_date).length,
    noResearcher: families.filter(f => !f.researcher_name?.trim()).length,
    noChildren: families.filter(f => !f.children || f.children.length === 0).length,
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe Right (Positive x for RTL? No, usually physical direction)
    // If I drag my finger from Left to Right, x is positive.
    // In LTR apps, Back is usually swipe Left-to-Right (drag Right).
    // In RTL apps, Back is usually swipe Right-to-Left (drag Left)?
    // Wait, in RTL:
    // [Next] <--- [Current] ---> [Previous/Back]
    // Swipe Right ( -> ) should go to Previous/Back?
    // Let's assume standard behavior: Swipe from edge to center (Left-to-Right on LTR, Right-to-Left on RTL).
    // But commonly "Back" is standard Left-to-Right swipe even in some RTL apps if they follow system gestures.
    // However, the user asked: "swibe back in phone it back to home".
    // I previously assumed x > 100 (Right swipe). Let's stick to that as it's the natural "Back" gesture on iOS/Android regardless of RTL often.
    if (info.offset.x > 100) {
      onBack();
    }
  };

  return (
    <motion.div 
      className="space-y-8 pb-20 touch-pan-y"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.2 }} // Only allow dragging right
      onDragEnd={handleDragEnd}
    >
      
      {/* Development Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
         هذه الصفحة قيد التطوير والتحسين 
        </div>
      </div>

      {/* Header Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
             <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{families.length}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">إجمالي الأسر</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-3">
             <Baby className="w-6 h-6 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{totalChildren}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">إجمالي الأطفال</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
             <GraduationCap className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{studentsCount}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">عدد الطلاب</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
             <MapPin className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{Object.keys(areaCounts).length}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">مناطق التوزيع</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Status Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-violet-500 rounded-full" />
            تحليل الحالات
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {Object.entries(STATUS_ICONS).map(([status, icon]) => {
              const count = statusCounts[status] || 0;
              const percentage = families.length > 0 ? (count / families.length) * 100 : 0;
              
              return (
                <div key={status} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                        {icon}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{status}</span>
                    </div>
                    <span className="text-sm font-black text-gray-900">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Children & Students Deep Dive */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-2">
                <h3 className="text-xl font-black">تقرير التعليم والأطفال</h3>
                <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                    يتم التركيز على دعم الطلاب لضمان استمرارية العملية التعليمية لجميع أبناء الأسر.
                </p>
                <div className="flex items-center gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-1">
                        <div className="text-2xl font-black">{studentsCount}</div>
                        <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">طالب مسجل</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-1">
                        <div className="text-2xl font-black">{totalChildren - studentsCount}</div>
                        <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">دون سن الدراسة</div>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-center">
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-white/10"
                        />
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={440}
                            strokeDashoffset={440 - (440 * (studentsCount / (totalChildren || 1)))}
                            className="text-white transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black">{Math.round((studentsCount / (totalChildren || 1)) * 100)}%</span>
                        <span className="text-[9px] font-bold uppercase tracking-tighter text-indigo-200">نسبة الطلاب</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Researcher Workload */}
      {sortedResearchers.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-teal-500 rounded-full" />
            أداء الباحثين
          </h3>
          <div className="space-y-4">
            {sortedResearchers.map(([name, count]) => (
              <div key={name} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition-colors">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900">{count} أسرة</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-1000" 
                    style={{ width: `${(count / maxResearcherCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Research Timeline */}
      {sortedMonths.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-sky-500 rounded-full" />
            خط سير البحث الشهري
          </h3>
          <div className="flex items-end gap-2 h-32">
            {sortedMonths.map(([month, count]) => {
              const height = maxMonthCount > 0 ? (count / maxMonthCount) * 100 : 0;
              const [year, m] = month.split('-');
              const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString('ar-EG', { month: 'short' });
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-black text-gray-900">{count}</span>
                  <div className="w-full rounded-t-lg bg-sky-500 transition-all duration-1000" style={{ height: `${Math.max(height, 8)}%` }} />
                  <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">{monthName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Missing Data Report */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-2 h-6 bg-rose-500 rounded-full" />
          تقرير جودة البيانات
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "بدون هاتف", count: missingData.noPhone, bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-500" },
            { label: "بدون عنوان", count: missingData.noAddress, bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-500" },
            { label: "بدون مرفقات", count: missingData.noAttachments, bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-500" },
            { label: "بدون تاريخ بحث", count: missingData.noResearchDate, bg: "bg-sky-50", border: "border-sky-200", icon: "text-sky-500" },
            { label: "بدون باحث", count: missingData.noResearcher, bg: "bg-teal-50", border: "border-teal-200", icon: "text-teal-500" },
            { label: "بدون أبناء", count: missingData.noChildren, bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-500" },
          ].map(item => (
            <div 
              key={item.label}
              className={`p-3 rounded-xl border transition-all ${
                item.count > 0 
                  ? `${item.bg} ${item.border}` 
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`w-3.5 h-3.5 ${
                  item.count > 0 ? item.icon : 'text-emerald-500'
                }`} />
                <span className="text-xs font-bold text-gray-600">{item.label}</span>
              </div>
              <div className={`text-xl font-black ${
                item.count > 0 ? 'text-gray-900' : 'text-emerald-600'
              }`}>
                {item.count > 0 ? item.count : '✓'}
              </div>
            </div>
          ))}
        </div>
      </div>

    </motion.div>
  );
}
