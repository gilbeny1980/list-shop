"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingItem, Category, CATEGORY_CONFIG } from "@/types";
import {
  Plus, LogOut, ClipboardPaste, RefreshCw, ShoppingCart,
  Trash2, CheckCircle, History, ChevronDown, Minus, ShoppingBag, ArrowRight
} from "lucide-react";
import AddItemModal from "./AddItemModal";
import AISuggestions from "./AISuggestions";
import AuthScreen from "./AuthScreen";
import PasteListModal from "./PasteListModal";
import { getProductEmoji } from "@/lib/productEmoji";

interface HistoryEntry {
  id: string;
  date: string;
  total: number;
  itemCount: number;
  items: { name: string; quantity: number }[];
}

type AppMode = "list" | "shopping" | "finish";

const CATEGORY_ORDER: Category[] = ["vegetables_fruits", "dairy", "meat", "dry_goods"];

export default function ShoppingPageClient() {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<AppMode>("list");
  const [totalInput, setTotalInput] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("auth_token");
    const n = localStorage.getItem("auth_name");
    if (t && n) { setToken(t); setUserName(n); }
  }, []);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/items");
    if (res.ok) setItems(await res.json());
  }, []);

  const fetchHistory = useCallback(async () => {
    const res = await fetch("/api/history");
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchItems();
    fetchHistory();
    const interval = setInterval(fetchItems, 4000);
    return () => clearInterval(interval);
  }, [token, fetchItems, fetchHistory]);

  function handleAuth(t: string, n: string) { setToken(t); setUserName(n); }
  function handleSignOut() {
    localStorage.removeItem("auth_token"); localStorage.removeItem("auth_name");
    setToken(null); setUserName(""); setItems([]);
  }

  async function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  }

  async function handleUpdateQuantity(id: string, quantity: number) {
    if (quantity < 1) return;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
    await fetch(`/api/items/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
  }

  async function handleAddItem(name: string, category: Category, quantity: number) {
    setLoading(true);
    const res = await fetch("/api/items", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, quantity, added_by_name: userName }),
    });
    if (res.ok) { const newItem = await res.json(); setItems((prev) => [...prev, newItem]); }
    setLoading(false);
    setShowAddModal(false);
  }

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleFinishShopping() {
    setSaving(true);
    const total = parseFloat(totalInput) || 0;
    await fetch("/api/history", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((i) => ({ name: i.name, quantity: i.quantity })), total }),
    });
    // Delete all items
    await Promise.all(items.map((i) => fetch(`/api/items/${i.id}`, { method: "DELETE" })));
    setItems([]);
    setCheckedIds(new Set());
    setTotalInput("");
    setMode("list");
    await fetchHistory();
    setSaving(false);
    setShowHistory(true);
  }

  if (!token) return <AuthScreen onAuth={handleAuth} />;

  const allDone = items.length > 0 && checkedIds.size === items.length;

  // ─── LIST MODE ────────────────────────────────────────────────
  if (mode === "list") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                <ShoppingCart className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-gray-800 font-bold text-base leading-none">קניות הבית</h1>
                <p className="text-gray-400 text-xs">שלום, {userName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setShowHistory(!showHistory); fetchHistory(); }}
                className={`p-2 rounded-xl transition-all ${showHistory ? "bg-purple-100 text-purple-600" : "text-gray-400 hover:bg-gray-100"}`}>
                <History className="w-4 h-4" />
              </button>
              <button onClick={fetchItems} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-5 pb-20 space-y-4">
          {/* History */}
          {showHistory && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-500" /> היסטוריית קניות
                </h2>
              </div>
              {history.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">אין היסטוריה עדיין</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {history.map((entry) => {
                    const d = new Date(entry.date);
                    return (
                      <details key={entry.id} className="group">
                        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 list-none">
                          <div>
                            <p className="text-gray-700 font-medium text-sm">
                              {d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })} · {entry.itemCount} פריטים
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 font-bold">₪{entry.total.toFixed(2)}</span>
                            <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                          </div>
                        </summary>
                        <div className="px-4 pb-3 space-y-1">
                          {entry.items.map((it, i) => (
                            <div key={i} className="flex justify-between text-xs text-gray-500 py-1 border-t border-gray-50">
                              <span>{getProductEmoji(it.name)} {it.name} {it.quantity > 1 ? `×${it.quantity}` : ""}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-7 h-7" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-sm">הוסף מוצר</span>
            </button>
            <button onClick={() => setShowPasteModal(true)}
              className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ClipboardPaste className="w-7 h-7" />
              </div>
              <span className="font-bold text-sm">הכנס רשימה</span>
            </button>
          </div>

          {/* Flat item list */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-gray-700 font-semibold text-sm">רשימת קניות · {items.length} פריטים</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((item) => {
                  const config = CATEGORY_CONFIG[item.category];
                  const emoji = getProductEmoji(item.name);
                  return (
                    <div key={item.id} className="px-4 py-3 group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{emoji}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-medium text-sm">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>{config.icon} {config.label}</span>
                            <span className="text-gray-400 text-xs">הוסיף: {item.added_by_email}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-gray-200 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Quantity */}
                      <div className="flex items-center gap-2 mt-2 pr-13">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5 w-fit">
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="text-gray-500 hover:text-gray-700">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-gray-700 font-bold text-sm w-5 text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="text-gray-500 hover:text-gray-700">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-gray-400 text-xs">יחידות</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <AISuggestions items={items} onAdd={handleAddItem} />

          {/* Go Shopping button */}
          {items.length > 0 && (
            <button onClick={() => { setCheckedIds(new Set()); setMode("shopping"); }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 transition-transform text-base">
              <ShoppingBag className="w-5 h-5" />
              יוצא לקניות!
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {items.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-gray-500 text-lg font-medium">הרשימה ריקה</h3>
              <p className="text-gray-400 text-sm mt-1">לחץ &quot;הוסף מוצר&quot; או &quot;הכנס רשימה&quot;</p>
            </div>
          )}
        </main>

        {showAddModal && <AddItemModal onAdd={handleAddItem} onClose={() => setShowAddModal(false)} loading={loading} />}
        {showPasteModal && <PasteListModal onAdd={handleAddItem} onClose={() => setShowPasteModal(false)} />}
      </div>
    );
  }

  // ─── SHOPPING MODE ────────────────────────────────────────────
  if (mode === "shopping") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-emerald-500 to-teal-600 sticky top-0 z-40 shadow-md">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setMode("list")} className="text-white/80 hover:text-white p-1">
              ← חזור
            </button>
            <div className="text-center">
              <h1 className="text-white font-bold text-base">🛒 בחנות</h1>
              <p className="text-emerald-100 text-xs">{checkedIds.size} / {items.length} נלקח</p>
            </div>
            <div className="w-12" />
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-emerald-700">
            <div className="h-1 bg-white transition-all duration-500"
              style={{ width: `${items.length ? (checkedIds.size / items.length) * 100 : 0}%` }} />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-4 pb-32 space-y-4">
          {CATEGORY_ORDER.map((category) => {
            const catItems = items.filter((i) => i.category === category);
            if (catItems.length === 0) return null;
            const config = CATEGORY_CONFIG[category];
            const doneCount = catItems.filter((i) => checkedIds.has(i.id)).length;
            return (
              <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`px-4 py-3 flex items-center justify-between ${config.bgColor} border-b ${config.borderColor}`}>
                  <h2 className={`font-bold text-sm flex items-center gap-2 ${config.color}`}>
                    <span className="text-xl">{config.icon}</span>
                    {config.label}
                  </h2>
                  <span className={`text-xs font-medium ${config.color}`}>{doneCount}/{catItems.length}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {catItems.map((item) => {
                    const done = checkedIds.has(item.id);
                    return (
                      <button key={item.id} onClick={() => toggleCheck(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-all hover:bg-gray-50 ${done ? "opacity-50" : ""}`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${done ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                          {done && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-2xl">{getProductEmoji(item.name)}</span>
                        <div className="flex-1">
                          <p className={`text-gray-800 font-medium text-sm ${done ? "line-through" : ""}`}>{item.name}</p>
                          {item.quantity > 1 && <p className="text-gray-400 text-xs">×{item.quantity} יחידות</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </main>

        {/* Finish button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setMode("finish")}
              className={`w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all ${allDone ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200 hover:scale-105" : "bg-gray-300"}`}>
              <CheckCircle className="w-5 h-5" />
              {allDone ? "סיים קנייה →" : `נשאר ${items.length - checkedIds.size} פריטים`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── FINISH MODE ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-white font-bold text-xl">הקנייה הסתיימה!</h2>
          <p className="text-emerald-100 text-sm mt-1">{items.length} פריטים נקנו</p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-2">כמה שילמת סה&quot;כ?</label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₪</span>
              <input
                type="number" value={totalInput} onChange={(e) => setTotalInput(e.target.value)}
                placeholder="0.00" autoFocus
                className="w-full pr-9 pl-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-400 text-gray-800 text-lg font-bold"
              />
            </div>
          </div>
          {totalInput && (
            <div className="bg-emerald-50 rounded-xl px-4 py-3 text-center">
              <p className="text-emerald-600 text-sm">סה&quot;כ שולם</p>
              <p className="text-emerald-700 font-bold text-2xl">₪{parseFloat(totalInput).toFixed(2)}</p>
            </div>
          )}
          <button onClick={handleFinishShopping} disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
            {saving ? "שומר..." : "✅ שמור בהיסטוריה"}
          </button>
          <button onClick={() => setMode("shopping")} className="w-full text-gray-400 text-sm hover:text-gray-600 py-2">
            ← חזור לרשימה
          </button>
        </div>
      </div>
    </div>
  );
}
