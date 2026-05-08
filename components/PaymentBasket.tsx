"use client";

import { ShoppingItem } from "@/types";
import { Trash2, RotateCcw, ShoppingBag, X } from "lucide-react";
import { useState } from "react";

interface Props {
  items: ShoppingItem[];
  onUpdatePrice: (id: string, price: number | null) => void;
  onUncheck: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  totalPrice: number;
}

export default function PaymentBasket({
  items,
  onUpdatePrice,
  onUncheck,
  onDelete,
  onClearAll,
  totalPrice,
}: Props) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-purple-300 bg-purple-50 shadow-sm overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-white" />
          <div>
            <h2 className="font-bold text-white text-base">סל תשלום</h2>
            <p className="text-purple-200 text-xs">{items.length} מוצרים שנרכשו</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-purple-200 text-xs">סה&quot;כ</p>
          <p className="text-white font-bold text-xl">₪{totalPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-purple-100">
        {items.map((item) => (
          <BasketItem
            key={item.id}
            item={item}
            onUpdatePrice={onUpdatePrice}
            onUncheck={onUncheck}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Footer - Clear all */}
      <div className="px-5 py-4 bg-purple-50 border-t border-purple-200">
        {!showConfirmClear ? (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="w-full text-purple-600 border-2 border-purple-200 rounded-xl py-2.5 font-semibold text-sm hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            נקה את הסל (סיום קניות)
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-gray-700 text-sm font-medium">
              האם לנקות את כל הסל?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { onClearAll(); setShowConfirmClear(false); }}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-red-600 transition-colors"
              >
                כן, נקה הכל
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 bg-gray-200 text-gray-700 rounded-xl py-2.5 font-semibold text-sm hover:bg-gray-300 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BasketItem({
  item,
  onUpdatePrice,
  onUncheck,
  onDelete,
}: {
  item: ShoppingItem;
  onUpdatePrice: (id: string, price: number | null) => void;
  onUncheck: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(item.price?.toString() || "");

  function handlePriceBlur() {
    setEditingPrice(false);
    const val = parseFloat(priceInput);
    onUpdatePrice(item.id, isNaN(val) ? null : val);
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-purple-50 transition-colors group">
      {/* Check indicator */}
      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs">✓</span>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-700 line-through text-sm">{item.name}</p>
        {item.quantity > 1 && (
          <p className="text-xs text-gray-400">כמות: {item.quantity}</p>
        )}
      </div>

      {/* Price input */}
      <div className="flex items-center gap-1">
        {editingPrice ? (
          <input
            type="number"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={handlePriceBlur}
            onKeyDown={(e) => e.key === "Enter" && handlePriceBlur()}
            autoFocus
            placeholder="0.00"
            className="w-20 border-2 border-purple-400 rounded-lg px-2 py-1 text-sm text-center focus:outline-none text-gray-700"
            dir="ltr"
          />
        ) : (
          <button
            onClick={() => setEditingPrice(true)}
            className={`text-sm px-3 py-1 rounded-lg border-2 transition-colors ${
              item.price !== null
                ? "border-purple-300 text-purple-700 bg-purple-50 font-semibold"
                : "border-dashed border-gray-300 text-gray-400 hover:border-purple-300 hover:text-purple-500"
            }`}
          >
            {item.price !== null ? `₪${item.price.toFixed(2)}` : "הוסף מחיר"}
          </button>
        )}
        <span className="text-gray-400 text-xs">₪</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onUncheck(item)}
          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
          title="החזר לרשימה"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="מחק"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
