// ============================================
// בדרך הביתה - מעקב יציאות לבני נוער
// Types & configuration
// ============================================

export type TeenCategory = "middle" | "high" | "army";

export type MemberRole = "parent" | "teen";

export type OutingStatus = "planned" | "out" | "on_way_home" | "home" | "cancelled";

export type ReturnMethod =
  | "parent_pickup"
  | "public_transport"
  | "walk"
  | "ride_friend"
  | "army_transport"
  | "hitchhike"
  | "other";

export interface TeenProfile {
  id: string;
  name: string;
  category: TeenCategory;
  inviteCode: string;
  createdBy: string; // username
  createdAt: string;
}

export interface TeenWithRole extends TeenProfile {
  myRole: MemberRole;
}

export interface CircleMember {
  username: string;
  name: string;
  role: MemberRole;
  joinedAt: string;
}

export interface StatusEvent {
  status: OutingStatus;
  at: string;
  by: string; // display name
}

export interface Outing {
  id: string;
  teenId: string;
  title: string;
  plannedDeparture: string; // ISO datetime
  plannedReturn: string; // ISO datetime
  returnMethod: ReturnMethod;
  notes: string;
  status: OutingStatus;
  history: StatusEvent[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_CONFIG: Record<
  TeenCategory,
  {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    titlePlaceholder: string;
    titleLabel: string;
    departureLabel: string;
    returnLabel: string;
  }
> = {
  middle: {
    label: "חטיבת ביניים",
    icon: "🎒",
    color: "text-fuchsia-700",
    bgColor: "bg-fuchsia-50",
    borderColor: "border-fuchsia-300",
    titlePlaceholder: "לדוגמה: מסיבת יום הולדת אצל נועה",
    titleLabel: "לאן יוצא/ת?",
    departureLabel: "שעת יציאה מהבית",
    returnLabel: "שעת חזרה משוערת",
  },
  high: {
    label: "תיכון",
    icon: "🎓",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    titlePlaceholder: "לדוגמה: הופעה בפארק הירקון",
    titleLabel: "לאן יוצא/ת?",
    departureLabel: "שעת יציאה מהבית",
    returnLabel: "שעת חזרה משוערת",
  },
  army: {
    label: "צבא",
    icon: "🪖",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    titlePlaceholder: "לדוגמה: יציאה הביתה מהבסיס",
    titleLabel: "יציאה מ...",
    departureLabel: "שעת יציאה מהבסיס",
    returnLabel: "שעת הגעה משוערת הביתה",
  },
};

export const RETURN_METHOD_CONFIG: Record<ReturnMethod, { label: string; icon: string }> = {
  parent_pickup: { label: "הורה אוסף/ת", icon: "🚗" },
  public_transport: { label: "תחבורה ציבורית", icon: "🚌" },
  walk: { label: "ברגל", icon: "🚶" },
  ride_friend: { label: "הסעה עם חבר/ה", icon: "🚙" },
  army_transport: { label: "הסעה צבאית", icon: "🚐" },
  hitchhike: { label: "טרמפ", icon: "👍" },
  other: { label: "אחר", icon: "❓" },
};

export const RETURN_METHODS_BY_CATEGORY: Record<TeenCategory, ReturnMethod[]> = {
  middle: ["parent_pickup", "public_transport", "walk", "ride_friend", "other"],
  high: ["parent_pickup", "public_transport", "walk", "ride_friend", "other"],
  army: ["hitchhike", "public_transport", "army_transport", "parent_pickup", "other"],
};

export const STATUS_CONFIG: Record<
  OutingStatus,
  { label: string; icon: string; color: string; bgColor: string; dot: string }
> = {
  planned: { label: "מתוכנן", icon: "🗓️", color: "text-slate-600", bgColor: "bg-slate-100", dot: "bg-slate-400" },
  out: { label: "בחוץ", icon: "🎉", color: "text-amber-700", bgColor: "bg-amber-100", dot: "bg-amber-500" },
  on_way_home: { label: "בדרך הביתה", icon: "🚕", color: "text-blue-700", bgColor: "bg-blue-100", dot: "bg-blue-500" },
  home: { label: "הגיע/ה הביתה", icon: "✅", color: "text-emerald-700", bgColor: "bg-emerald-100", dot: "bg-emerald-500" },
  cancelled: { label: "בוטל", icon: "✖️", color: "text-gray-500", bgColor: "bg-gray-100", dot: "bg-gray-400" },
};

export const STATUS_ORDER: OutingStatus[] = ["planned", "out", "on_way_home", "home"];

export function nextStatus(current: OutingStatus): OutingStatus | null {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
}

export function isOutingLate(outing: Outing): boolean {
  if (outing.status === "home" || outing.status === "cancelled") return false;
  return new Date(outing.plannedReturn).getTime() < Date.now();
}
