"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Check, Plus, Users } from "lucide-react";
import { CATEGORY_CONFIG, CircleMember, isOutingLate, Outing, OutingStatus, STATUS_CONFIG, TeenWithRole } from "@/types/baderech";
import OutingCard from "./OutingCard";
import OutingFormModal from "./OutingFormModal";

interface Props {
  teen: TeenWithRole;
  token: string;
  notificationsEnabled: boolean;
}

function notify(title: string, body: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-192.png" });
    }
  } catch {
    // notifications unsupported — ignore
  }
}

export default function TeenCircleCard({ teen, token, notificationsEnabled }: Props) {
  const [outings, setOutings] = useState<Outing[]>([]);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const prevRef = useRef<Map<string, OutingStatus>>(new Map());
  const wasLateRef = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const cfg = CATEGORY_CONFIG[teen.category];

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchOutings = useCallback(async () => {
    const res = await fetch(`/api/baderech/outings?teenId=${teen.id}`, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) return;
    const data: Outing[] = await res.json();

    if (notificationsEnabled && !firstLoad.current) {
      for (const o of data) {
        const prevStatus = prevRef.current.get(o.id);
        if (prevStatus && prevStatus !== o.status) {
          notify(`${teen.name} · ${STATUS_CONFIG[o.status].label}`, o.title);
        }
        const late = isOutingLate(o);
        if (late && !wasLateRef.current.has(o.id)) {
          wasLateRef.current.add(o.id);
          notify(`${teen.name} באיחור`, `${o.title} — עדיין לא הגיע/ה הביתה`);
        }
        if (!late) wasLateRef.current.delete(o.id);
      }
    }
    prevRef.current = new Map(data.map((o) => [o.id, o.status]));
    firstLoad.current = false;
    setOutings(data);
  }, [teen.id, teen.name, authHeaders, notificationsEnabled]);

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`/api/baderech/teens/${teen.id}`, { headers: authHeaders(), cache: "no-store" });
    if (res.ok) { const data = await res.json(); setMembers(data.members); }
  }, [teen.id, authHeaders]);

  useEffect(() => {
    fetchOutings();
    fetchMembers();
    const interval = setInterval(fetchOutings, 6000);
    return () => clearInterval(interval);
  }, [fetchOutings, fetchMembers]);

  async function handleAdvance(outing: Outing, status: string) {
    setOutings((prev) => prev.map((o) => (o.id === outing.id ? { ...o, status: status as OutingStatus } : o)));
    const res = await fetch(`/api/baderech/outings/${outing.id}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ teenId: teen.id, status }),
    });
    if (res.ok) fetchOutings();
  }

  async function handleCancel(outing: Outing) {
    setOutings((prev) => prev.filter((o) => o.id !== outing.id));
    await fetch(`/api/baderech/outings/${outing.id}?teenId=${teen.id}`, { method: "DELETE", headers: authHeaders() });
  }

  function handleCopy() {
    navigator.clipboard.writeText(teen.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const active = outings.find((o) => o.status !== "home" && o.status !== "cancelled");
  const past = outings.filter((o) => o !== active);
  const late = active ? isOutingLate(active) : false;

  return (
    <div className={`rounded-3xl shadow-sm border overflow-hidden ${late ? "border-red-300" : "border-gray-100"} bg-white`}>
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between ${cfg.bgColor} border-b ${cfg.borderColor}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{cfg.icon}</span>
          <div>
            <h2 className="font-bold text-gray-800">{teen.name}</h2>
            <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label} · {teen.myRole === "teen" ? "הפרופיל שלי" : "מעקב הורה"}</p>
          </div>
        </div>
        {active && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${late ? "bg-red-100 text-red-700" : `${STATUS_CONFIG[active.status].bgColor} ${STATUS_CONFIG[active.status].color}`}`}>
            {late ? "⚠️ באיחור" : `${STATUS_CONFIG[active.status].icon} ${STATUS_CONFIG[active.status].label}`}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Active outing hero */}
        {active ? (
          <OutingCard outing={active} category={teen.category} canAct onAdvance={handleAdvance} onCancel={handleCancel} defaultOpen />
        ) : (
          <button onClick={() => setShowForm(true)}
            className="w-full py-6 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex flex-col items-center gap-1">
            <Plus className="w-6 h-6" />
            <span className="text-sm font-semibold">אין יציאה פעילה · לחץ/י ליצירת יציאה חדשה</span>
          </button>
        )}

        {active && (
          <button onClick={() => setShowForm(true)}
            className="w-full py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50">
            + יציאה נוספת
          </button>
        )}

        {/* History */}
        {past.length > 0 && (
          <details className="pt-1">
            <summary className="text-xs text-gray-400 font-semibold cursor-pointer select-none">היסטוריית יציאות ({past.length})</summary>
            <div className="space-y-2 mt-2">
              {past.map((o) => <OutingCard key={o.id} outing={o} category={teen.category} canAct={false} />)}
            </div>
          </details>
        )}

        {/* Members + invite */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Users className="w-3.5 h-3.5" />
            {members.map((m) => m.name).join(", ") || "רק אני"}
          </div>
          <button onClick={handleCopy} className="flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-800">
            {copied ? <><Check className="w-3.5 h-3.5" /> הועתק</> : <><Copy className="w-3.5 h-3.5" /> קוד: {teen.inviteCode}</>}
          </button>
        </div>
      </div>

      {showForm && (
        <OutingFormModal teen={teen} token={token} onClose={() => setShowForm(false)}
          onCreated={(o) => { setOutings((prev) => [o, ...prev]); setShowForm(false); }} />
      )}
    </div>
  );
}
