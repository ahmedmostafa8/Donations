"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[] | readonly string[];
  placeholder?: string;
  className?: string;
  label?: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export function CustomSelect({ value, onChange, options, placeholder, className, label }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => { setMounted(true); }, []);

  // ===== MOBILE: Native <select> — guaranteed perfect scroll =====
  if (isMobile) {
    return (
      <div className={cn("relative", className)}>
        {label && <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>}
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "w-full h-11 px-3 rounded-xl border-2 border-gray-200 bg-white appearance-none font-bold text-right outline-none",
              !value && "text-gray-400"
            )}
            style={{ direction: 'rtl' }}
          >
            <option value="" disabled>{placeholder || "اختر..."}</option>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    );
  }

  // ===== DESKTOP: Custom bottom sheet dropdown =====
  const dropdown = isOpen && mounted ? createPortal(
    <div 
      className="fixed inset-0"
      style={{ zIndex: 9999 }}
      onClick={() => setIsOpen(false)}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-black text-gray-900">{label || "اختر"}</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div 
          className="p-2 overflow-y-auto overscroll-contain"
          style={{ maxHeight: '50vh' }}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-colors mb-1",
                value === option 
                  ? "bg-violet-50 text-violet-700 border border-violet-200" 
                  : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
              )}
            >
              <span>{option}</span>
              {value === option && <Check className="w-5 h-5" />}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className={cn("relative", className)}>
      {label && <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 px-3 rounded-xl border-2 flex items-center justify-between transition-all bg-white",
          isOpen ? "border-violet-500 ring-2 ring-violet-100" : "border-gray-200 hover:border-gray-300",
        )}
      >
        <span className={cn("font-bold", !value && "text-gray-400")}>
          {value || placeholder || "اختر..."}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {dropdown}
    </div>
  );
}
