"use client";

import { ShoppingItem, Category, CATEGORY_CONFIG } from "@/types";
import ItemCard from "./ItemCard";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Props {
  category: Category;
  items: ShoppingItem[];
  onCheck: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

export default function CategorySection({ category, items, onCheck, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const config = CATEGORY_CONFIG[category];

  return (
    <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} shadow-sm overflow-hidden animate-slide-up`}>
      {/* Category header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-5 py-4 ${config.bgColor} hover:brightness-95 transition-all`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div className="text-right">
            <h2 className={`font-bold text-base ${config.color}`}>{config.label}</h2>
            <p className="text-gray-500 text-xs">{items.length} פריטים</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className={`${config.color} bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm`}>
              {items.length}
            </span>
          )}
          {collapsed ? (
            <ChevronDown className={`w-5 h-5 ${config.color}`} />
          ) : (
            <ChevronUp className={`w-5 h-5 ${config.color}`} />
          )}
        </div>
      </button>

      {/* Items */}
      {!collapsed && (
        <div className="divide-y divide-gray-100">
          {items.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-5 italic">
              אין מוצרים בקטגוריה זו
            </p>
          ) : (
            items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onCheck={onCheck}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
