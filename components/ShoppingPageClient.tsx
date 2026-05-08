"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShoppingItem, Category, CATEGORY_CONFIG } from "@/types";
import {
  ShoppingCart,
  LogOut,
  Plus,
  User,
  RefreshCw,
} from "lucide-react";
import CategorySection from "./CategorySection";
import PaymentBasket from "./PaymentBasket";
import AddItemModal from "./AddItemModal";
import AISuggestions from "./AISuggestions";

interface Props {
  initialItems: ShoppingItem[];
  userEmail: string;
  userId: string;
}

export default function ShoppingPageClient({ initialItems, userEmail, userId }: Props) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("shopping_items")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setItems(data);
  }, [supabase]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("shopping_items_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items" },
        () => { fetchItems(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchItems]);

  async function handleCheckItem(item: ShoppingItem) {
    const newChecked = !item.is_checked;
    const newCategory: Category = newChecked ? "payment_basket" : item.category;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, is_checked: newChecked, category: newCategory }
          : i
      )
    );

    await supabase
      .from("shopping_items")
      .update({
        is_checked: newChecked,
        category: newChecked ? "payment_basket" : item.category,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  }

  async function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("shopping_items").delete().eq("id", id);
  }

  async function handleUpdatePrice(id: string, price: number | null) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, price } : i))
    );
    await supabase
      .from("shopping_items")
      .update({ price, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  async function handleAddItem(name: string, category: Category, quantity: number) {
    setLoading(true);
    const { data } = await supabase
      .from("shopping_items")
      .insert({
        name,
        category,
        quantity,
        is_checked: false,
        price: null,
        added_by: userId,
        added_by_email: userEmail,
      })
      .select()
      .single();

    if (data) {
      setItems((prev) => [...prev, data]);
    }
    setLoading(false);
    setShowAddModal(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function handleClearBasket() {
    const basketItems = items.filter((i) => i.category === "payment_basket");
    const ids = basketItems.map((i) => i.id);
    if (ids.length === 0) return;
    setItems((prev) => prev.filter((i) => i.category !== "payment_basket"));
    await supabase.from("shopping_items").delete().in("id", ids);
  }

  const activeCategories: Category[] = ["dry_goods", "meat", "dairy", "vegetables_fruits"];
  const activeItems = items.filter((i) => i.category !== "payment_basket");
  const basketItems = items.filter((i) => i.category === "payment_basket");
  const totalPrice = basketItems.reduce((sum, i) => sum + (i.price || 0), 0);

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
              title="רענן"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <User className="w-4 h-4 text-purple-200" />
              <span className="text-purple-200 text-xs hidden sm:block">{userEmail}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-white/70 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
              title="התנתק"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats bar */}
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
        {/* Active categories */}
        {activeCategories.map((category) => {
          const categoryItems = activeItems.filter((i) => i.category === category);
          return (
            <CategorySection
              key={category}
              category={category}
              items={categoryItems}
              onCheck={handleCheckItem}
              onDelete={handleDeleteItem}
            />
          );
        })}

        {/* Payment basket */}
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

        {/* AI Suggestions */}
        <AISuggestions items={activeItems} onAdd={handleAddItem} />

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-8 animate-fade-in">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-white text-xl font-bold mb-2">הרשימה ריקה</h3>
            <p className="text-purple-200 text-sm">לחץ על &quot;+&quot; להוספת מוצר ראשון</p>
          </div>
        )}
      </main>

      {/* FAB - Add Item */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-purple-900/50 flex items-center gap-2 font-bold text-base hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
        הוסף מוצר
      </button>

      {/* Add Item Modal */}
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
