"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingItem, Category, CATEGORY_CONFIG } from "@/types";
import { Plus, LogOut, ClipboardPaste, RefreshCw, ShoppingCart, Trash2, CheckCircle } from "lucide-react";
import AddItemModal from "./AddItemModal";
import AISuggestions from "./AISuggestions";
import AuthScreen from "./AuthScreen";
import PasteListModal from "./PasteListModal";
import { getProductEmoji } from "@/lib/productEmoji";

export default function ShoppingPageClient() {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("auth_token");
    const n = localStorage.getItem("auth_name");
    if (t && n) { setToken(t); setUserName(n); }
  }, []);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/items");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchItems();
    const interval = setInterval(fetchItems, 4000);
    return () => clearInterval(interval);
  }, [token, fetchItems]);

  function handleAuth(t: string, n: string) { setToken(t); setUserName(n); }

  function handleSignOut() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_name");
    setToken(null);
    setUserName("");
    setItems([]);
  }

  async function handleCheckItem(item: ShoppingItem) {
    const newChecked = !item.is_checked;
    const newCategory: Category = newChecked ? "payment_basket" : item.category;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_checked: newChecked, category: newCategory } : i));
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_checked: newChecked, category: newCategory }),
    });
  }

  async function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  }

  async function handleUpdatePrice(id: string, price: number | null) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, price } : i));
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price }),
    });
  }

  async function handleAddItem(name: string, category: Category, quantity: number) {
    setLoading(true);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, quantity, added_by_name: userName }),
    });
    if (res.ok) { const newItem = await res.json(); setItems((prev) => [...prev, newItem]); }
    setLoading(false);
    setShowAddModal(false);
  }

  async function handleClearBasket() {
    setItems((prev) => prev.filter((i) => i.category !== "payment_basket"));
    await fetch("/api/items/basket", { method: "DELETE" });
  }

  if (!token) return <AuthScreen onAuth={handleAuth} />;

  const activeItems = items.filter((i) => i.category !== "payment_basket");
  const basketItems = items.filter((i) => i.category === "payment_basket");
  const totalPrice = basketItems.reduce((sum, i) => sum + (i.price || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
            <button onClick={fetchItems} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-32 space-y-4">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm">הוסף מוצר</span>
          </button>
          <button
            onClick={() => setShowPasteModal(true)}
            className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardPaste className="w-7 h-7" />
            </div>
            <span className="font-bold text-sm">הכנס רשימה</span>
          </button>
        </div>

        {/* Stats */}
        {items.length > 0 && (
          <div className="flex gap-2">
            <div className="bg-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm border border-gray-100">
              <span className="text-gray-500 text-xs">ברשימה:</span>
              <span className="text-gray-800 font-bold text-sm">{activeItems.length}</span>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm border border-gray-100">
              <span className="text-gray-500 text-xs">בסל:</span>
              <span className="text-gray-800 font-bold text-sm">{basketItems.length}</span>
            </div>
            {totalPrice > 0 && (
              <div className="bg-emerald-50 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm border border-emerald-100">
                <span className="text-emerald-600 font-bold text-sm">₪{totalPrice.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Shopping List */}
        {activeItems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h2 className="text-gray-700 font-semibold text-sm">רשימת קניות</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {activeItems.map((item) => {
                const config = CATEGORY_CONFIG[item.category];
                const emoji = getProductEmoji(item.name);
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                    <button
                      onClick={() => handleCheckItem(item)}
                      className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-purple-400 hover:bg-purple-50 transition-all flex-shrink-0"
                    >
                      <span className="text-lg">{emoji}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium text-sm truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                          {config.icon} {config.label}
                        </span>
                        {item.quantity > 1 && <span className="text-xs text-gray-400">×{item.quantity}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCheckItem(item)}
                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                        title="העבר לסל"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Basket */}
        {basketItems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-emerald-50 flex items-center justify-between">
              <h2 className="text-emerald-700 font-semibold text-sm">🛒 סל תשלום</h2>
              <button onClick={handleClearBasket} className="text-xs text-red-400 hover:text-red-600 font-medium">
                נקה הכל
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {basketItems.map((item) => {
                const emoji = getProductEmoji(item.name);
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 group">
                    <span className="text-xl">{emoji}</span>
                    <p className="flex-1 text-gray-700 text-sm font-medium line-through opacity-60">{item.name}</p>
                    <input
                      type="number"
                      placeholder="₪"
                      value={item.price ?? ""}
                      onChange={(e) => handleUpdatePrice(item.id, e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-20 px-2 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-400 text-center"
                    />
                    <button onClick={() => handleCheckItem(item)} className="p-1.5 text-gray-400 hover:text-purple-500 rounded-lg">
                      ↩
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            {totalPrice > 0 && (
              <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100 flex justify-between items-center">
                <span className="text-emerald-700 font-semibold text-sm">סה&quot;כ לתשלום</span>
                <span className="text-emerald-700 font-bold text-lg">₪{totalPrice.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* AI Suggestions */}
        <AISuggestions items={activeItems} onAdd={handleAddItem} />

        {/* Empty state */}
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
