"use client";
import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { CATEGORY_CONFIG, isOutingLate, nextStatus, Outing, RETURN_METHOD_CONFIG, STATUS_CONFIG, TeenCategory } from "@/types/baderech";

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
}

function lateBy(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} דק'`;
  return `${Math.floor(mins / 60)} שע' ו-${mins % 60} דק'`;
}

interface Props {
  outing: Outing;
  category: TeenCategory;
  canAct: boolean;
  onAdvance?: (outing: Outing, status: string) => void;
  onCancel?: (outing: Outing) => void;
  defaultOpen?: boolean;
}

export default function OutingCard({ outing, category, canAct, onAdvance, onCancel, defaultOpen }: Props) {
  const [open, setOpen] = useState(!!defaultOpen);
  const cfg = CATEGORY_CONFIG[category];
  const sCfg = STATUS_CONFIG[outing.status];
  const methodCfg = RETURN_METHOD_CONFIG[outing.returnMethod];
  const late = isOutingLate(outing);
  const next = nextStatus(outing.status);

  return (
    <div className={`rounded-2xl border ${late ? "border-red-300 bg-red-50" : "border-gray-100 bg-white"} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-right">
        <span className="text-2xl">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 font-semibold text-sm truncate">{outing.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sCfg.bgColor} ${sCfg.color} font-medium`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} /> {sCfg.icon} {sCfg.label}
            </span>
            {late && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                באיחור {lateBy(outing.plannedReturn)}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-gray-400">{cfg.departureLabel}</p>
              <p className="text-gray-700 font-semibold">{fmtTime(outing.plannedDeparture)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-gray-400">{cfg.returnLabel}</p>
              <p className="text-gray-700 font-semibold">{fmtTime(outing.plannedReturn)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{methodCfg.icon}</span> חוזר/ת: {methodCfg.label}
          </div>
          {outing.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">{outing.notes}</p>}

          {/* Timeline */}
          <div className="space-y-1.5 pt-1">
            {outing.history.map((h, i) => {
              const hc = STATUS_CONFIG[h.status];
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${hc.dot}`} />
                  <span className="text-gray-600 font-medium">{hc.label}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400">{fmtTime(h.at)}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400">{h.by}</span>
                </div>
              );
            })}
          </div>

          {canAct && outing.status !== "home" && outing.status !== "cancelled" && (
            <div className="flex gap-2 pt-1">
              {next && (
                <button onClick={() => onAdvance?.(outing, next)}
                  className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                  {STATUS_CONFIG[next].icon} סמן כ-{STATUS_CONFIG[next].label}
                </button>
              )}
              {outing.status === "planned" && (
                <button onClick={() => onCancel?.(outing)}
                  className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
