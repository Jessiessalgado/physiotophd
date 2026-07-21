import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin, listAllPostsAdmin, deletePost } from "@/lib/posts.functions";
import { listCategories, createCategory, updateCategory, deleteCategory } from "@/lib/categories.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminList,
  head: () => ({ meta: [{ title: "Admin — Posts" }] }),
});

type Category = { slug: string; label: string; sort_order: number };

function AdminList() {
  const check = useServerFn(checkIsAdmin);
  const list = useServerFn(listAllPostsAdmin);
  const del = useServerFn(deletePost);
  const loadCats = useServerFn(listCategories);
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[] | null>(null);
  const [cats, setCats] = useState<Category[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"posts" | "categories">("posts");

  async function refresh() {
    try {
      const { isAdmin } = await check();
      if (!isAdmin) { setErr("You are not an admin. Ask the owner to grant access."); return; }
      const [p, c] = await Promise.all([list(), loadCats()]);
      setPosts(p); setCats(c as any);
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
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Manage posts and categories</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/api/public/blogger-theme.xml" style={btnGhost}>⬇ Download Blogger XML</a>
          <button onClick={signOut} style={btnGhost}>Sign out</button>
        </div>
      </header>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e2e8f0", margin: "20px 0 16px" }}>
        <TabBtn active={tab === "posts"} onClick={() => setTab("posts")}>Posts</TabBtn>
        <TabBtn active={tab === "categories"} onClick={() => setTab("categories")}>Categories</TabBtn>
      </div>

      {err && <div style={{ color: "#dc2626", margin: "16px 0" }}>{err}</div>}

      {tab === "posts" && (
        <PostsTab posts={posts} cats={cats ?? []} onDelete={onDelete} />
      )}
      {tab === "categories" && (
        <CategoriesTab cats={cats} refresh={refresh} />
      )}
    </div>
  );
}

function PostsTab({ posts, cats, onDelete }: { posts: any[] | null; cats: Category[]; onDelete: (id: string) => void }) {
  const label = (slug: string) => cats.find((c) => c.slug === slug)?.label ?? slug;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Link to="/admin/$id" params={{ id: "new" }} style={btnPrimary}>+ New post</Link>
      </div>
      {posts === null ? <p>Loading…</p> : posts.length === 0 ? (
        <p style={{ color: "#64748b" }}>No posts yet. Create your first one.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {posts.map((p) => (
            <div key={p.id} style={card}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.title}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  {label(p.category)} · {p.published ? <span style={{ color: "#059669" }}>Published</span> : <span style={{ color: "#d97706" }}>Draft</span>} · /{p.slug}
                </div>
              </div>
              <Link to="/admin/$id" params={{ id: p.id }} style={btnGhost}>Edit</Link>
              <button onClick={() => onDelete(p.id)} style={btnDanger}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesTab({ cats, refresh }: { cats: Category[] | null; refresh: () => void }) {
  const create = useServerFn(createCategory);
  const update = useServerFn(updateCategory);
  const remove = useServerFn(deleteCategory);
  const [newLabel, setNewLabel] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setBusy(true); setErr(null);
    try {
      await create({ data: { label: newLabel, slug: newSlug || undefined } });
      setNewLabel(""); setNewSlug(""); refresh();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }
  async function save(c: Category, patch: Partial<Category> & { new_slug?: string }) {
    setErr(null);
    try {
      await update({ data: { slug: c.slug, new_slug: patch.new_slug, label: patch.label, sort_order: patch.sort_order } });
      refresh();
    } catch (e: any) { setErr(e.message); }
  }
  async function del(c: Category) {
    const others = (cats ?? []).filter((x) => x.slug !== c.slug);
    let reassign: string | undefined;
    if (others.length > 0) {
      const choice = prompt(`Delete "${c.label}". Reassign its posts to which category slug? Leave empty to skip (posts will keep the removed slug).\n\nAvailable: ${others.map((o) => o.slug).join(", ")}`);
      reassign = choice?.trim() || undefined;
      if (reassign && !others.some((o) => o.slug === reassign)) { alert("Unknown slug."); return; }
    }
    if (!confirm(`Really delete category "${c.label}"?`)) return;
    try {
      await remove({ data: { slug: c.slug, reassign_to: reassign } });
      refresh();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div>
      <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input placeholder="New category name (e.g. Sports Rehab)" value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          style={{ ...inp, flex: 2, minWidth: 200 }} />
        <input placeholder="slug (optional, auto)" value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          style={{ ...inp, flex: 1, minWidth: 160 }} />
        <button type="submit" disabled={busy} style={btnPrimary}>Add</button>
      </form>
      {err && <div style={{ color: "#dc2626", marginBottom: 12 }}>{err}</div>}
      {cats === null ? <p>Loading…</p> : cats.length === 0 ? (
        <p style={{ color: "#64748b" }}>No categories.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {cats.map((c) => <CategoryRow key={c.slug} c={c} onSave={save} onDelete={del} />)}
        </div>
      )}
      <p style={{ marginTop: 20, fontSize: 13, color: "#64748b" }}>
        Categories appear as the filter chips on <code>/blog</code>. Editing a slug also updates all posts pointing to it.
      </p>
    </div>
  );
}

function CategoryRow({ c, onSave, onDelete }: {
  c: Category;
  onSave: (c: Category, patch: Partial<Category> & { new_slug?: string }) => void;
  onDelete: (c: Category) => void;
}) {
  const [label, setLabel] = useState(c.label);
  const [slug, setSlug] = useState(c.slug);
  const [order, setOrder] = useState(c.sort_order);
  const dirty = label !== c.label || slug !== c.slug || order !== c.sort_order;

  useEffect(() => { setLabel(c.label); setSlug(c.slug); setOrder(c.sort_order); }, [c.label, c.slug, c.sort_order]);

  return (
    <div style={card}>
      <input value={label} onChange={(e) => setLabel(e.target.value)} style={{ ...inp, flex: 2 }} />
      <input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ ...inp, flex: 1, fontFamily: "ui-monospace, monospace", fontSize: 13 }} />
      <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} style={{ ...inp, width: 80 }} title="Sort order" />
      <button disabled={!dirty} onClick={() => onSave(c, { label, new_slug: slug, sort_order: order })} style={dirty ? btnPrimary : btnGhost}>Save</button>
      <button onClick={() => onDelete(c)} style={btnDanger}>Delete</button>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 16px", border: 0, background: "transparent", cursor: "pointer",
      color: active ? "#1e3a8a" : "#64748b", fontWeight: active ? 600 : 500,
      borderBottom: active ? "2px solid #1e3a8a" : "2px solid transparent", fontSize: 14,
    }}>{children}</button>
  );
}

const wrap: React.CSSProperties = { maxWidth: 900, margin: "0 auto", padding: 32, fontFamily: "Inter, sans-serif" };
const hdr: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 };
const card: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: 12, background: "white", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };
const btnPrimary: React.CSSProperties = { padding: "10px 16px", background: "#1e3a8a", color: "white", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 500, border: 0, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "8px 14px", background: "#f1f5f9", color: "#0f172a", borderRadius: 8, textDecoration: "none", fontSize: 14, border: 0, cursor: "pointer" };
const btnDanger: React.CSSProperties = { padding: "8px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 8, fontSize: 14, border: 0, cursor: "pointer" };
const inp: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, background: "white", boxSizing: "border-box" };
