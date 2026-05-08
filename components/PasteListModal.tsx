"use client";
import { useState } from "react";
import { X, Loader2, ClipboardPaste, CheckCircle } from "lucide-react";
import { Category } from "@/types";
import { getProductEmoji } from "@/lib/productEmoji";
import { CATEGORY_CONFIG } from "@/types";

interface ParsedItem { name: string; category: Category; quantity: number; }

interface Props {
  onAdd: (name: string, category: Category, quantity: number) => Promise<void>;
  onClose: () => void;
}

export default function PasteListModal({ onAdd, onClose }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/parse-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAll() {
    setAdding(true);
    for (const item of items) {
      await onAdd(item.name, item.category, item.quantity || 1);
    }
    setAdding(false);
    setDone(true);
    setTimeout(onClose, 1200);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-lg">הכנס רשימה</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {items.length === 0 ? (
            <>
              <p className="text-gray-500 text-sm text-center">הדבק רשימת קניות — AI יסדר אוטומטית לפי קטגוריות</p>
              <textarea
                value={text} onChange={(e) => setText(e.target.value)}
                placeholder={"לדוגמה:\nחלב 2, לחם, עגבניות, עוף שלם, גבינה צהובה, אורז"}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800 text-sm resize-none"
              />
              <button
                onClick={handleParse} disabled={loading || !text.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "✨ נתח עם AI"}
              </button>
            </>
          ) : done ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-gray-700 font-bold">הרשימה נוספה!</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm font-medium">זוהו {items.length} פריטים:</p>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const config = CATEGORY_CONFIG[item.category];
                  return (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <span className="text-2xl">{getProductEmoji(item.name)}</span>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium text-sm">{item.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-white ${config.color} border ${config.borderColor}`}>
                          {config.icon} {config.label}
                        </span>
                      </div>
                      {item.quantity > 1 && <span className="text-gray-400 text-sm">×{item.quantity}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setItems([])} className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm">
                  חזור
                </button>
                <button
                  onClick={handleAddAll} disabled={adding}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : `הוסף הכל`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
