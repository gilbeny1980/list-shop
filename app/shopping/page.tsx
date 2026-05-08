import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ShoppingPageClient from "@/components/ShoppingPageClient";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("shopping_items")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <ShoppingPageClient
      initialItems={items || []}
      userEmail={user.email!}
      userId={user.id}
    />
  );
}
