"use client";
import { useState } from "react";
import { Users, Plus, LogIn, Loader2, Copy, Check } from "lucide-react";

interface Props {
  token: string;
  userName: string;
  onGroupReady: (groupId: string, groupName: string, inviteCode: string) => void;
}

export default function GroupSetupScreen({ token, userName, onGroupReady }: Props) {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ inviteCode: string; groupName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!groupName.trim()) return;
    setLoading(true); setError("");
    const res = await fetch("/api/groups/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: groupName.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setCreated({ inviteCode: data.inviteCode, groupName: data.groupName });
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setLoading(true); setError("");
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inviteCode: inviteCode.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    localStorage.setItem("group_id", data.groupId);
    localStorage.setItem("group_name", data.groupName);
    localStorage.setItem("invite_code", data.inviteCode);
    onGroupReady(data.groupId, data.groupName, data.inviteCode);
  }

  function handleCopy() {
    if (!created) return;
    navigator.clipboard.writeText(created.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEnter() {
    if (!created) return;
    localStorage.setItem("group_id", created.inviteCode);
    localStorage.setItem("group_name", created.groupName);
    localStorage.setItem("invite_code", created.inviteCode);
    // refetch group id from server
    fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inviteCode: created.inviteCode }),
    }).then(r => r.json()).then(data => {
      localStorage.setItem("group_id", data.groupId);
      onGroupReady(data.groupId, data.groupName, data.inviteCode);
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-white font-bold text-xl">שלום, {userName}!</h2>
          <p className="text-purple-200 text-sm mt-1">צור קבוצה משפחתית או הצטרף לקיימת</p>
        </div>

        {created ? (
          <div className="bg-white rounded-3xl p-6 text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h3 className="text-gray-800 font-bold text-lg">הקבוצה נוצרה!</h3>
            <p className="text-gray-500 text-sm">שלח את הקוד למשפחה להצטרפות:</p>
            <div className="bg-purple-50 rounded-2xl p-4">
              <p className="text-3xl font-bold text-purple-700 tracking-widest">{created.inviteCode}</p>
            </div>
            <button onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 border-2 border-purple-200 text-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all">
              {copied ? <><Check className="w-4 h-4" /> הועתק!</> : <><Copy className="w-4 h-4" /> העתק קוד</>}
            </button>
            <button onClick={handleEnter}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-xl font-bold">
              כנס לרשימה →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex border-b border-gray-100">
              <button onClick={() => { setTab("create"); setError(""); }}
                className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${tab === "create" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-400"}`}>
                <Plus className="w-4 h-4" /> צור קבוצה
              </button>
              <button onClick={() => { setTab("join"); setError(""); }}
                className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${tab === "join" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-400"}`}>
                <LogIn className="w-4 h-4" /> הצטרף
              </button>
            </div>
            <div className="p-6 space-y-4">
              {tab === "create" ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">שם הקבוצה</label>
                    <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      placeholder='לדוגמה: משפחת בן יהודה' autoFocus
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800 text-sm" />
                  </div>
                  {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl py-2 text-center">{error}</p>}
                  <button onClick={handleCreate} disabled={loading || !groupName.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "צור קבוצה"}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">קוד הצטרפות</label>
                    <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      placeholder="XXXXXX" autoFocus maxLength={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800 text-center text-2xl font-bold tracking-widest" />
                  </div>
                  {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl py-2 text-center">{error}</p>}
                  <button onClick={handleJoin} disabled={loading || inviteCode.length < 4}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "הצטרף לקבוצה"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
