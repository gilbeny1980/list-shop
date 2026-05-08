"use client";

import { ShoppingItem } from "@/types";
import { Trash2 } from "lucide-react";

interface Props {
  item: ShoppingItem;
  onCheck: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

export default function ItemCard({ item, onCheck, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-gray-50 transition-colors group">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={item.is_checked}
        onChange={() => onCheck(item)}
        className="custom-checkbox"
      />

      {/* Name & info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-gray-800 ${item.is_checked ? "line-through text-gray-400" : ""}`}>
          {item.name}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
          {item.quantity > 1 && <span>כמות: {item.quantity}</span>}
          <span>{item.added_by_email?.split("@")[0]}</span>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        title="מחק"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
