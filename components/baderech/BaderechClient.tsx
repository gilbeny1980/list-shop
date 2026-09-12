"use client";
import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, Compass, LogOut, Plus } from "lucide-react";
import { TeenWithRole } from "@/types/baderech";
import BdAuthScreen from "./AuthScreen";
import OnboardingScreen from "./OnboardingScreen";
import TeenCircleCard from "./TeenCircleCard";

export default function BaderechClient() {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [teens, setTeens] = useState<TeenWithRole[]>([]);
  const [loadedTeens, setLoadedTeens] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    const t = localStorage.getItem("bd_token");
    const n = localStorage.getItem("bd_name");
    if (t && n) { setToken(t); setUserName(n); }
    if (typeof Notification !== "undefined") setNotifPermission(Notification.permission);
    else setNotifPermission("unsupported");
  }, []);

  const fetchTeens = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/baderech/teens", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (res.ok) setTeens(await res.json());
    setLoadedTeens(true);
  }, [token]);

  useEffect(() => { fetchTeens(); }, [fetchTeens]);

  function handleAuth(t: string, n: string) { setToken(t); setUserName(n); }
  function handleSignOut() {
    localStorage.removeItem("bd_token"); localStorage.removeItem("bd_name");
    setToken(null); setUserName(""); setTeens([]); setLoadedTeens(false);
  }
  function handleTeenReady() {
    setShowOnboarding(false);
    fetchTeens();
  }
  async function requestNotifications() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  }

  if (!token) return <BdAuthScreen onAuth={handleAuth} />;
  if (!loadedTeens) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900 flex items-center justify-center">
        <Compass className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }
  if (teens.length === 0 || showOnboarding) {
    return (
      <OnboardingScreen
        token={token}
        userName={userName}
        onTeenReady={handleTeenReady}
        onCancel={teens.length > 0 ? () => setShowOnboarding(false) : undefined}
      />
    );
  }

  const notifOn = notifPermission === "granted";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-700 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
              <Compass className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-gray-800 font-bold text-base leading-none">בדרך הביתה</h1>
              <p className="text-gray-400 text-xs">שלום, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {notifPermission !== "unsupported" && (
              <button onClick={requestNotifications}
                className={`p-2 rounded-xl transition-all ${notifOn ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:bg-gray-100"}`}
                title={notifOn ? "התראות פעילות" : "הפעל התראות"}>
                {notifOn ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </button>
            )}
            <button onClick={() => setShowOnboarding(true)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl" title="הוסף מעקב">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-20 space-y-4">
        {!notifOn && notifPermission !== "unsupported" && (
          <button onClick={requestNotifications}
            className="w-full bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl px-4 py-3 text-xs font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 flex-shrink-0" />
            הפעל/י התראות כדי לקבל עדכון כשהסטטוס משתנה (פועל כשהאפליקציה פתוחה בדפדפן)
          </button>
        )}
        {teens.map((teen) => (
          <TeenCircleCard key={teen.id} teen={teen} token={token} notificationsEnabled={notifOn} />
        ))}
      </main>
    </div>
  );
}
