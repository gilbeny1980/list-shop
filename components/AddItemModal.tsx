"use client";

import { useState, useEffect, useRef } from "react";
import { Category, CATEGORY_CONFIG } from "@/types";
import { X, Plus, Loader2, Sparkles } from "lucide-react";

const CATEGORIES_ORDER: Category[] = ["dry_goods", "meat", "dairy", "vegetables_fruits"];

interface Props {
  onAdd: (name: string, category: Category, quantity: number) => void;
  onClose: () => void;
  loading: boolean;
}

export default function AddItemModal({ onAdd, onClose, loading }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("dry_goods");
  const [quantity, setQuantity] = useState(1);
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (name.trim().length < 2) {
      setAiSuggested(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setAiCategorizing(true);
      try {
        const res = await fetch("/api/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        const data = await res.json();
        if (data.category) {
          setCategory(data.category);
          setAiSuggested(true);
        }
      } catch {
        // ignore
      } finally {
        setAiCategorizing(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), category, quantity);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-5 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">הוסף מוצר לרשימה</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              שם המוצר
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setAiSuggested(false); }}
                placeholder="לדוגמה: לחם, עגבניות, חלב..."
                required
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-gray-800 placeholder-gray-400 pl-10"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {aiCategorizing ? (
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                ) : aiSuggested ? (
                  <Sparkles className="w-4 h-4 text-purple-500" />
                ) : null}
              </div>
            </div>
            {aiSuggested && (
              <p className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                קטגוריה זוהתה אוטומטית ע&quot;י AI
              </p>
            )}
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              קטגוריה
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES_ORDER.map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setCategory(cat); setAiSuggested(false); }}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${config.borderColor} ${config.bgColor} ${config.color} font-semibold shadow-sm`
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xl">{config.icon}</span>
                    <span className="text-sm leading-tight">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              כמות
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all font-bold text-lg"
              >
                −
              </button>
              <span className="w-12 text-center font-bold text-gray-800 text-xl">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all font-bold text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 text-base"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" strokeWidth={2.5} />
                הוסף לרשימה
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
