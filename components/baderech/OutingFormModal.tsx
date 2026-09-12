"use client";
import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { CATEGORY_CONFIG, Outing, RETURN_METHODS_BY_CATEGORY, RETURN_METHOD_CONFIG, ReturnMethod, TeenProfile } from "@/types/baderech";

interface Props {
  teen: TeenProfile;
  token: string;
  onClose: () => void;
  onCreated: (outing: Outing) => void;
}

function defaultDateTime(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  d.setMinutes(Math.round(d.getMinutes() / 5) * 5);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OutingFormModal({ teen, token, onClose, onCreated }: Props) {
  const cfg = CATEGORY_CONFIG[teen.category];
  const methods = RETURN_METHODS_BY_CATEGORY[teen.category];

  const [title, setTitle] = useState("");
  const [departure, setDeparture] = useState(defaultDateTime(1));
  const [ret, setRet] = useState(defaultDateTime(5));
  const [returnMethod, setReturnMethod] = useState<ReturnMethod>(methods[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true); setError("");
    const res = await fetch("/api/baderech/outings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        teenId: teen.id,
        title: title.trim(),
        plannedDeparture: new Date(departure).toISOString(),
        plannedReturn: new Date(ret).toISOString(),
        returnMethod,
        notes: notes.trim(),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "שגיאה"); return; }
    onCreated(data);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span>{cfg.icon}</span> יציאה חדשה · {teen.name}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{cfg.titleLabel}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={cfg.titlePlaceholder} autoFocus required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{cfg.departureLabel}</label>
              <input type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} required
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 text-xs" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{cfg.returnLabel}</label>
              <input type="datetime-local" value={ret} onChange={(e) => setRet(e.target.value)} required
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 text-xs" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">איך חוזר/ת הביתה?</label>
            <div className="grid grid-cols-3 gap-2">
              {methods.map((m) => {
                const mc = RETURN_METHOD_CONFIG[m];
                const active = returnMethod === m;
                return (
                  <button key={m} type="button" onClick={() => setReturnMethod(m)}
                    className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${active ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                    <span className="text-xl">{mc.icon}</span>
                    <span className={`text-[11px] font-medium text-center leading-tight ${active ? "text-blue-700" : "text-gray-500"}`}>{mc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">הערות (אופציונלי)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="לדוגמה: יחזור עם דניאל, נמצא ברחוב הרצל 5"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 text-sm resize-none" />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl py-2 text-center">{error}</p>}

          <button type="submit" disabled={loading || !title.trim()}
            className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "שמור ועדכן את ההורים"}
          </button>
        </form>
      </div>
    </div>
  );
}
