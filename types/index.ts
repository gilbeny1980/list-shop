export type Category =
  | "dry_goods"
  | "meat"
  | "dairy"
  | "vegetables_fruits"
  | "payment_basket";

export interface ShoppingItem {
  id: string;
  name: string;
  category: Category;
  is_checked: boolean;
  price: number | null;
  quantity: number;
  added_by: string;
  added_by_email: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovedEmail {
  id: string;
  email: string;
  created_at: string;
}

export const CATEGORY_CONFIG: Record<
  Category,
  { label: string; icon: string; color: string; bgColor: string; borderColor: string }
> = {
  dry_goods: {
    label: "מוצרים יבשים",
    icon: "🥫",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
  },
  meat: {
    label: "מוצרי בשר",
    icon: "🥩",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
  },
  dairy: {
    label: "מוצרי חלב",
    icon: "🥛",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-300",
  },
  vegetables_fruits: {
    label: "ירקות ופירות",
    icon: "🥦",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
  },
  payment_basket: {
    label: "סל תשלום",
    icon: "🛒",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
  },
};
