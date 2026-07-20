import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin, listAllPostsAdmin, deletePost } from "@/lib/posts.functions";
import { CATEGORY_LABEL } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminList,
  head: () => ({ meta: [{ title: "Admin — Posts" }] }),
});

function AdminList() {
  const check = useServerFn(checkIsAdmin);
  const list = useServerFn(listAllPostsAdmin);
  const del = useServerFn(deletePost);
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    try {
      const { isAdmin } = await check();
      if (!isAdmin) { setErr("You are not an admin. Ask the owner to grant access."); return; }
      setPosts(await list());
    } catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { refresh(); }, []);

  async function onDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await del({ data: { id } });
    refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div style={wrap}>
      <header style={hdr}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: "#1e3a8a" }}>Blog Admin</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Manage your posts</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/admin/$id" params={{ id: "new" }} style={btnPrimary}>+ New post</Link>
          <button onClick={signOut} style={btnGhost}>Sign out</button>
        </div>
      </header>
      {err && <div style={{ color: "#dc2626", margin: "16px 0" }}>{err}</div>}
      {posts === null && !err ? <p>Loading…</p> : null}
      {posts && posts.length === 0 && <p style={{ color: "#64748b" }}>No posts yet. Create your first one.</p>}
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        {posts?.map((p) => (
          <div key={p.id} style={card}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                {CATEGORY_LABEL[p.category] ?? p.category} · {p.published ? <span style={{ color: "#059669" }}>Published</span> : <span style={{ color: "#d97706" }}>Draft</span>} · /{p.slug}
              </div>
            </div>
            <Link to="/admin/$id" params={{ id: p.id }} style={btnGhost}>Edit</Link>
            <button onClick={() => onDelete(p.id)} style={btnDanger}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { maxWidth: 900, margin: "0 auto", padding: 32, fontFamily: "Inter, sans-serif" };
const hdr: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 };
const card: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: 16, background: "white", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };
const btnPrimary: React.CSSProperties = { padding: "10px 16px", background: "#1e3a8a", color: "white", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 500, border: 0, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "8px 14px", background: "#f1f5f9", color: "#0f172a", borderRadius: 8, textDecoration: "none", fontSize: 14, border: 0, cursor: "pointer" };
const btnDanger: React.CSSProperties = { padding: "8px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 8, fontSize: 14, border: 0, cursor: "pointer" };
