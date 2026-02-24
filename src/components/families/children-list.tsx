"use client";

import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Child, EDUCATION_OPTIONS } from "@/app/families/types";
import { CustomSelect } from "@/components/ui/custom-select";

interface ChildrenListProps {
  items: Child[];
  onChange: (items: Child[]) => void;
}

export function ChildrenList({ items, onChange }: ChildrenListProps) {
  
  // Add new child
  const addChild = () => {
    onChange([...items, {
      child_type: "ابن",
      child_name: "",
      child_age: undefined,
      child_education: ""
    }]);
  };
  
  // Update child
  const updateChild = (index: number, field: keyof Child, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };
  
  // Remove child
  const removeChild = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };
  
  return (
    <div className="space-y-3">
      {items.map((child, index) => (
        <div 
          key={index} 
          className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2"
        >
          {/* Header with Type Toggle and Delete */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {["ابن", "ابنة"].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateChild(index, 'child_type', type)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-sm font-bold transition-all",
                    child.child_type === type
                      ? type === "ابن" 
                        ? "bg-blue-500 text-white" 
                        : "bg-pink-500 text-white"
                      : "bg-white text-gray-500 border border-gray-200"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => removeChild(index)}
              className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Name */}
          <input
            type="text"
            value={child.child_name}
            onChange={(e) => updateChild(index, 'child_name', e.target.value)}
            placeholder="اسم الابن/الابنة"
            className="w-full h-9 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-right text-sm"
          />
          
          {/* Age & Education */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={child.child_age || ""}
              onChange={(e) => updateChild(index, 'child_age', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="السن"
              min={0}
              max={50}
              className="w-full h-9 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-center text-sm"
            />
            <CustomSelect
              value={child.child_education || ""}
              onChange={(val) => updateChild(index, 'child_education', val)}
              options={[...EDUCATION_OPTIONS]}
              placeholder="المرحلة"
              className="[&_button]:h-9 [&_button]:rounded-lg [&_button]:border-gray-200 [&_button]:text-sm [&_label]:hidden"
            />
          </div>
        </div>
      ))}
      
      {/* Add Button */}
      <button
        type="button"
        onClick={addChild}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 font-bold hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
      >
        <Plus className="w-4 h-4" />
        <span>إضافة ابن/ابنة</span>
      </button>
    </div>
  );
}

