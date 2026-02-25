"use client";

import { useState } from "react";
import { Phone, MessageCircle, Copy, Check, ChevronLeft, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, type Family, type FamilyStatus } from "@/app/families/types";
import { toast } from "sonner";

interface FamilyCardProps {
  family: Family;
  onClick: () => void;
  onEdit: () => void;
}

export function FamilyCard({ family, onClick }: Omit<FamilyCardProps, 'onEdit'>) {
  const familyStatuses = family.status.split(",").map(s => s.trim()).filter(Boolean);
  const primaryStatusColor = STATUS_COLORS[familyStatuses[0] as FamilyStatus] || "gray";
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
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
      copiedField !== text && setCopiedField(text);
      setTimeout(() => setCopiedField(null), 1500);
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
  
  const style = statusStyles[primaryStatusColor] || statusStyles.gray;
  
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
          {/* Wife Name */}
            <h3 className="font-bold text-gray-900 truncate">
              {family.wife_name}
            </h3>
            {/* Status Tags */}
            <div className="flex gap-1 flex-wrap mt-1">
            {familyStatuses.map((s, i) => {
              const sColor = STATUS_COLORS[s as FamilyStatus] || "gray";
              const sStyle = statusStyles[sColor] || statusStyles.gray;
              return (
                <span key={i} className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                  sStyle.bg, sStyle.text
                )}>
                  {s}
                </span>
              );
            })}
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronLeft className="w-5 h-5 text-gray-300 shrink-0 mt-2" />
      </button>
      
      {/* Husband Row + Mini Badges - Full width from far right */}
      {(family.husband_name || (family.children && family.children.length > 0) || family.monthly_income || (family.attachments && family.attachments.length > 0)) && (
        <div className="flex items-center justify-between px-3 pb-2 -mt-1">
          {/* Husband Name */}
          <div className="text-xs text-gray-500 truncate flex-1 min-w-0">
            {family.husband_name && (
              <>
                <User className="w-3.5 h-3.5 inline-block ml-1 text-gray-400" />
                {family.husband_name}
                {family.husband_status === "متوفي" && <span className="text-red-500"> (متوفي)</span>}
                {family.husband_status === "منفصل" && <span className="text-amber-500"> (منفصل)</span>}
              </>
            )}
          </div>
          
          {/* Mini Info Badges */}
          <div className="flex gap-1.5 shrink-0 mr-2">
            {family.children && family.children.length > 0 && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                👶 {family.children.length}
              </span>
            )}
            {family.monthly_income ? (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                {family.monthly_income} ج
              </span>
            ) : null}

          </div>
        </div>
      )}
      
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
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 transition-all duration-200",
                copiedField === family.wife_national_id
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {copiedField === family.wife_national_id ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">نسخ القومي</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
