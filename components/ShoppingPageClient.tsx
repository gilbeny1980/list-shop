"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingItem, Category, CATEGORY_CONFIG } from "@/types";
import { ShoppingCart, Plus, RefreshCw } from "lucide-react";
import CategorySection from "./CategorySection";
import PaymentBasket from "./PaymentBasket";
import AddItemModal from "./AddItemModal";
import AISuggestions from "./AISuggestions";

export default function ShoppingPageClient() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [nameInput, setNameInput] = useState("");
  const [showNameScreen, setShowNameScreen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("shopping_user_name");
    if (stored) {
      setUserName(stored);
    } else {
      setShowNameScreen(true);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/items");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 3000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  function handleSaveName() {
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem("shopping_user_name", name);
    setUserName(name);
    setShowNameScreen(false);
  }

  async function handleCheckItem(item: ShoppingItem) {
    const newChecked = !item.is_checked;
    const newCategory: Category = newChecked ? "payment_basket" : item.category;
    setItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, is_checked: newChecked, category: newCategory } : i)
    );
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
    if (res.ok) {
      const newItem = await res.json();
      setItems((prev) => [...prev, newItem]);
    }
    setLoading(false);
    setShowAddModal(false);
  }

  async function handleClearBasket() {
    setItems((prev) => prev.filter((i) => i.category !== "payment_basket"));
    await fetch("/api/items/basket", { method: "DELETE" });
  }

  const activeCategories: Category[] = ["dry_goods", "meat", "dairy", "vegetables_fruits"];
  const activeItems = items.filter((i) => i.category !== "payment_basket");
  const basketItems = items.filter((i) => i.category === "payment_basket");
  const totalPrice = basketItems.reduce((sum, i) => sum + (i.price || 0), 0);

  if (showNameScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">קניות הבית</h1>
          <p className="text-purple-500 mb-6 text-sm">משפחת בן יהודה</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            placeholder="מה השם שלך?"
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-gray-800 text-lg focus:outline-none focus:border-purple-500 mb-4"
          />
          <button
            onClick={handleSaveName}
            disabled={!nameInput.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-xl font-bold disabled:opacity-40"
          >
            כניסה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">קניות הבית</h1>
              <p className="text-purple-200 text-xs">משפחת בן יהודה</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchItems}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="bg-white/10 rounded-xl px-3 py-2">
              <span className="text-purple-200 text-xs">שלום, {userName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="text-white/70 text-sm">פריטים ברשימה:</span>
            <span className="text-white font-bold">{activeItems.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="text-white/70 text-sm">בסל תשלום:</span>
            <span className="text-white font-bold">{basketItems.length}</span>
          </div>
          {totalPrice > 0 && (
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-emerald-200 text-sm">סה&quot;כ:</span>
              <span className="text-emerald-100 font-bold">₪{totalPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 pb-24 space-y-4">
        {activeCategories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            items={activeItems.filter((i) => i.category === category)}
            onCheck={handleCheckItem}
            onDelete={handleDeleteItem}
          />
        ))}

        {basketItems.length > 0 && (
          <PaymentBasket
            items={basketItems}
            onUpdatePrice={handleUpdatePrice}
            onUncheck={handleCheckItem}
            onDelete={handleDeleteItem}
            onClearAll={handleClearBasket}
            totalPrice={totalPrice}
          />
        )}

        <AISuggestions items={activeItems} onAdd={handleAddItem} />

        {items.length === 0 && (
          <div className="text-center py-8 animate-fade-in">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-white text-xl font-bold mb-2">הרשימה ריקה</h3>
            <p className="text-purple-200 text-sm">לחץ על &quot;+&quot; להוספת מוצר ראשון</p>
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-purple-900/50 flex items-center gap-2 font-bold text-base hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
        הוסף מוצר
      </button>

      {showAddModal && (
        <AddItemModal
          onAdd={handleAddItem}
          onClose={() => setShowAddModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
