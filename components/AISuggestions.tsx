"use client";

import { useState } from "react";
import { Category, CATEGORY_CONFIG, ShoppingItem } from "@/types";
import { Sparkles, Loader2, Plus, X } from "lucide-react";

interface Suggestion {
  name: string;
  category: Category;
}

interface Props {
  items: ShoppingItem[];
  onAdd: (name: string, category: Category, quantity: number) => void;
}

export default function AISuggestions({ items, onAdd }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  async function fetchSuggestions() {
    setLoading(true);
    setShown(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ name: i.name })) }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd(s: Suggestion) {
    onAdd(s.name, s.category, 1);
    setSuggestions((prev) => prev.filter((x) => x.name !== s.name));
  }

  if (!shown) {
    return (
      <button
        onClick={fetchSuggestions}
        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3 hover:bg-white/20 transition-all group"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="text-right">
          <p className="text-white font-semibold text-sm">הצעות חכמות מ-AI</p>
          <p className="text-purple-200 text-xs">מה עוד כדאי לקנות?</p>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-300" />
          <span className="text-white font-semibold text-sm">הצעות AI</span>
        </div>
        <button
          onClick={() => { setShown(false); setSuggestions([]); }}
          className="text-white/50 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-5 h-5 text-purple-300 animate-spin" />
            <span className="text-purple-200 text-sm">Claude חושב...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-purple-200 text-sm text-center py-3">אין הצעות נוספות כרגע</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s) => {
              const config = CATEGORY_CONFIG[s.category];
              return (
                <div
                  key={s.name}
                  className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className="text-white text-sm font-medium">{s.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-white/10 ${config.color} hidden sm:block`}>
                      {config.label}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAdd(s)}
                    className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}
            <button
              onClick={fetchSuggestions}
              className="w-full text-purple-300 text-xs hover:text-white transition-colors py-1 flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              רענן הצעות
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
