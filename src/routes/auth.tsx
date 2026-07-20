import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { bootstrapFirstAdmin } from "@/lib/posts.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s.mode === "signup" ? "signup" : "login") as "login" | "signup",
  }),
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — Jessica Salgado" }] }),
});

function AuthPage() {
  const { mode } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const promote = useServerFn(bootstrapFirstAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Try to promote to admin if no admins exist yet
      try { await promote(); } catch {}
      navigate({ to: "/admin" });
    } catch (e: any) {
      setErr(e.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f7f8fc", fontFamily: "Inter, sans-serif", padding: 24 }}>
      <form onSubmit={submit} style={{ background: "white", padding: 32, borderRadius: 16, width: "100%", maxWidth: 380, boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#1e3a8a" }}>{mode === "signup" ? "Create account" : "Sign in"}</h1>
        <p style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>Admin area — Jessica Salgado</p>
        <label style={lbl}>Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inp} />
        <label style={lbl}>Password</label>
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} style={inp} />
        {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 12 }}>{err}</div>}
        <button disabled={busy} type="submit" style={btn}>{busy ? "..." : mode === "signup" ? "Sign up" : "Sign in"}</button>
        <div style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
          {mode === "signup" ? (
            <Link to="/auth" search={{ mode: "login" }}>Already have an account? Sign in</Link>
          ) : (
            <Link to="/auth" search={{ mode: "signup" }}>First time? Create account</Link>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, textAlign: "center" }}>
          <Link to="/">← Back to site</Link>
        </div>
      </form>
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", marginTop: 16, fontSize: 13, color: "#334155", fontWeight: 500 };
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", marginTop: 6, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" };
const btn: React.CSSProperties = { marginTop: 20, width: "100%", padding: "12px", background: "#1e3a8a", color: "white", border: 0, borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" };
