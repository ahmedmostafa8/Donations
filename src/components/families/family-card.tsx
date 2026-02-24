"use client";

import { Phone, MessageCircle, Copy, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, type Family, type FamilyStatus } from "@/app/families/types";
import { toast } from "sonner";

interface FamilyCardProps {
  family: Family;
  onClick: () => void;
  onEdit: () => void;
}

export function FamilyCard({ family, onClick }: Omit<FamilyCardProps, 'onEdit'>) {
  const statusColor = STATUS_COLORS[family.status as FamilyStatus] || "gray";
  
  // Copy to clipboard with fallback
  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(`تم نسخ ${label}`);
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(`تم نسخ ${label}`);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('فشل النسخ');
    }
  };
  
  // Open WhatsApp
  const openWhatsApp = (phone: string) => {
    // Normalize phone number
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '2' + normalizedPhone; // Egypt country code
    }
    window.open(`https://wa.me/${normalizedPhone}`, '_blank');
  };
  
  // Open Phone
  const openPhone = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };
  
  // Status badge colors
  const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
    sky: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
    orange: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    gray: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" }
  };
  
  const style = statusStyles[statusColor] || statusStyles.gray;
  
  return (
    <div 
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Main Card Content - Clickable */}
      <button
        onClick={onClick}
        className="w-full px-3 py-3 text-right flex items-start gap-3 cursor-pointer"
      >
        {/* Family Code Badge */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md shadow-purple-200">
          {family.family_code}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0 text-right">
          {/* Wife Name + Status */}
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 truncate min-w-0">
              {family.wife_name}
            </h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
              style.bg, style.text
            )}>
              {family.status}
            </span>
          </div>
          
          {/* Husband */}
          {family.husband_name && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              👨 {family.husband_name}
              {family.husband_status === "متوفي" && <span className="text-red-500"> (متوفي)</span>}
            </div>
          )}
          
          {/* Address */}
          {family.address && (
            <div className="text-xs text-gray-400 mt-0.5 truncate dir-rtl" title={family.address}>
              📍 {family.address}
            </div>
          )}
        </div>
        
        {/* Arrow */}
        <ChevronLeft className="w-5 h-5 text-gray-300 shrink-0 mt-2" />
      </button>
      
      {/* Quick Actions - Compact */}
      {(family.wife_phone || family.husband_phone) && (
        <div className="flex items-center border-t border-gray-100">
          {/* WhatsApp */}
          {family.wife_phone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openWhatsApp(family.wife_phone!);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">واتساب</span>
            </button>
          )}
          
          {/* Divider */}
          {family.wife_phone && family.wife_phone && (
            <div className="w-px h-6 bg-gray-100" />
          )}
          
          {/* Call */}
          {family.wife_phone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openPhone(family.wife_phone!);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-violet-600 hover:bg-violet-50 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">اتصال</span>
            </button>
          )}
          
          {/* Divider */}
          {family.wife_phone && family.wife_national_id && (
            <div className="w-px h-6 bg-gray-100" />
          )}
          
          {/* Copy National ID */}
          {family.wife_national_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(family.wife_national_id!, "الرقم القومي");
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">نسخ القومي</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
