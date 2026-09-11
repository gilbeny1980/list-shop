"use client";
import { useState } from "react";
import { Loader2, Copy, Check, ArrowRight } from "lucide-react";
import { CATEGORY_CONFIG, MemberRole, TeenCategory, TeenProfile } from "@/types/baderech";

interface Props {
  token: string;
  userName: string;
  onTeenReady: (teen: TeenProfile) => void;
  onCancel?: () => void;
}

type Step = "role" | "action" | "create" | "join" | "created";

export default function OnboardingScreen({ token, userName, onTeenReady, onCancel }: Props) {
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<MemberRole>("parent");
  const [teenName, setTeenName] = useState("");
  const [category, setCategory] = useState<TeenCategory>("high");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<TeenProfile | null>(null);
  const [copied, setCopied] = useState(false);

  function pickRole(r: MemberRole) {
    setRole(r);
    setStep("action");
  }

  async function handleCreate() {
    if (!teenName.trim()) return;
    setLoading(true); setError("");
    const res = await fetch("/api/baderech/teens", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: teenName.trim(), category, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setCreated(data);
    setStep("created");
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setLoading(true); setError("");
    const res = await fetch("/api/baderech/teens/join", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inviteCode: inviteCode.trim(), role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    onTeenReady(data);
  }

  function handleCopy() {
    if (!created) return;
    navigator.clipboard.writeText(created.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {onCancel && step === "role" && (
          <button onClick={onCancel} className="text-blue-200 text-sm mb-3 hover:text-white">← חזרה ללוח הבקרה</button>
        )}

        {/* Step: choose role */}
        {step === "role" && (
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h2 className="text-gray-800 font-bold text-xl text-center mb-1">שלום, {userName}!</h2>
            <p className="text-gray-400 text-sm text-center mb-6">מי אתה במעגל הזה?</p>
            <div className="space-y-3">
              <button onClick={() => pickRole("parent")}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-right">
                <span className="text-3xl">👨‍👩‍👧</span>
                <div>
                  <p className="font-bold text-gray-800">אני הורה</p>
                  <p className="text-gray-400 text-xs">רוצה לעקוב אחרי הבן/בת שלי</p>
                </div>
              </button>
              <button onClick={() => pickRole("teen")}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-right">
                <span className="text-3xl">🧑</span>
                <div>
                  <p className="font-bold text-gray-800">אני הנער/ה</p>
                  <p className="text-gray-400 text-xs">רוצה לעדכן את ההורים שלי</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step: create vs join */}
        {step === "action" && (
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <button onClick={() => setStep("role")} className="text-gray-400 text-xs mb-3 hover:text-gray-600">← חזרה</button>
            <h2 className="text-gray-800 font-bold text-lg text-center mb-6">
              {role === "parent" ? "מעקב אחרי מי?" : "בואו נתחיל"}
            </h2>
            <div className="space-y-3">
              <button onClick={() => { setStep("create"); setError(""); }}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-bold text-right flex items-center justify-between">
                <span>{role === "parent" ? "צור מעקב חדש לילד/ה" : "צור פרופיל חדש"}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <button onClick={() => { setStep("join"); setError(""); }}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-right hover:border-blue-400 hover:bg-blue-50">
                יש לי כבר קוד הזמנה
              </button>
            </div>
          </div>
        )}

        {/* Step: create */}
        {step === "create" && (
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <button onClick={() => setStep("action")} className="text-gray-400 text-xs mb-3 hover:text-gray-600">← חזרה</button>
            <h2 className="text-gray-800 font-bold text-lg mb-4">
              {role === "parent" ? "פרטי הילד/ה" : "הפרופיל שלך"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">שם</label>
                <input type="text" value={teenName} onChange={(e) => setTeenName(e.target.value)}
                  placeholder="לדוגמה: נועה" autoFocus
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">שלב</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as TeenCategory[]).map((c) => {
                    const cfg = CATEGORY_CONFIG[c];
                    const active = category === c;
                    return (
                      <button key={c} onClick={() => setCategory(c)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${active ? `${cfg.borderColor} ${cfg.bgColor}` : "border-gray-200"}`}>
                        <span className="text-2xl">{cfg.icon}</span>
                        <span className={`text-xs font-semibold ${active ? cfg.color : "text-gray-500"}`}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl py-2 text-center">{error}</p>}
              <button onClick={handleCreate} disabled={loading || !teenName.trim()}
                className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "המשך"}
              </button>
            </div>
          </div>
        )}

        {/* Step: join */}
        {step === "join" && (
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <button onClick={() => setStep("action")} className="text-gray-400 text-xs mb-3 hover:text-gray-600">← חזרה</button>
            <h2 className="text-gray-800 font-bold text-lg mb-4">קוד הצטרפות</h2>
            <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="XXXXXX" autoFocus maxLength={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 text-center text-2xl font-bold tracking-widest mb-4" />
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl py-2 text-center mb-4">{error}</p>}
            <button onClick={handleJoin} disabled={loading || inviteCode.length < 4}
              className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "הצטרף"}
            </button>
          </div>
        )}

        {/* Step: created (show invite code) */}
        {step === "created" && created && (
          <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="text-4xl">🎉</div>
            <h3 className="text-gray-800 font-bold text-lg">נוצר בהצלחה!</h3>
            <p className="text-gray-500 text-sm">
              {role === "parent"
                ? "שלח את הקוד הזה לילד/ה כדי שיוכל/תוכל להתחבר ולעדכן:"
                : "שלח את הקוד הזה להורים שלך כדי שיוכלו לעקוב:"}
            </p>
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-3xl font-bold text-blue-700 tracking-widest">{created.inviteCode}</p>
            </div>
            <button onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 border-2 border-blue-200 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all">
              {copied ? <><Check className="w-4 h-4" /> הועתק!</> : <><Copy className="w-4 h-4" /> העתק קוד</>}
            </button>
            <button onClick={() => onTeenReady(created)}
              className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-3 rounded-xl font-bold">
              המשך ללוח הבקרה →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
