"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  onSearch: (term: string) => void;
  className?: string;
  placeholder?: string;
}

export function SearchInput({ onSearch, className, placeholder = "بحث..." }: SearchInputProps) {
  const [localTerm, setLocalTerm] = useState("");

  // Debounce Logic: Only call onSearch after 300ms of no typing
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(localTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localTerm, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      <input
        value={localTerm}
        onChange={(e) => setLocalTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 pr-11 font-bold text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all text-right shadow-sm"
      />
      {localTerm && (
        <button
          onClick={() => setLocalTerm("")}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
