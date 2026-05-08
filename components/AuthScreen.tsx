"use client";
import { useState } from "react";
import { Loader2, ShoppingCart, User, Lock, UserPlus } from "lucide-react";

interface Props {
  onAuth: (token: string, name: string) => void;
}

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "שגיאה"); return; }
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_name", data.name);
      onAuth(data.token, data.name);
    } catch {
      setError("שגיאת חיבור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <ShoppingCart className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-white text-3xl font-bold">קניות הבית</h1>
          <p className="text-purple-200 text-sm mt-1">משפחת בן יהודה</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === "login" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-400"}`}
            >
              כניסה
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === "register" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-400"}`}
            >
              הרשמה
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === "register" && (
              <div className="relative">
                <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="שם מלא" required={mode === "register"}
                  className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800 text-sm"
                />
              </div>
            )}
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="שם משתמש" required
                className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800 text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה" required
                className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-gray-800 text-sm"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-2">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-violet-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "כניסה" : "הרשמה"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
