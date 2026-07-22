import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPostAdmin, upsertPost, uploadCoverImage } from "@/lib/posts.functions";
import { listCategories } from "@/lib/categories.functions";
import { RichTextEditor } from "@/components/RichTextEditor";

export const Route = createFileRoute("/_authenticated/admin/$id")({
  component: Editor,
  head: () => ({ meta: [{ title: "Edit post" }] }),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function Editor() {
  const { id } = useParams({ from: "/_authenticated/admin/$id" });
  const isNew = id === "new";
  const navigate = useNavigate();
  const load = useServerFn(getPostAdmin);
  const save = useServerFn(upsertPost);
  const upload = useServerFn(uploadCoverImage);
  const loadCats = useServerFn(listCategories);

  const [cats, setCats] = useState<{ slug: string; label: string }[]>([]);
  const [form, setForm] = useState({
    id: undefined as string | undefined,
    title: "", slug: "", excerpt: "", content: "",
    cover_image_url: "", category: "", published: false,
    published_at: "" as string, // datetime-local value ("" = not set)
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCats().then((rows) => {
      setCats(rows as any);
      setForm((f) => f.category ? f : { ...f, category: rows[0]?.slug ?? "" });
    }).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (isNew) return;
    load({ data: { id } }).then((row) => {
      if (row) setForm({
        id: row.id, title: row.title, slug: row.slug,
        excerpt: row.excerpt ?? "", content: row.content ?? "",
        cover_image_url: row.cover_image_url ?? "",
        category: row.category, published: row.published,
        published_at: row.published_at ? toLocalInput(row.published_at) : "",
      });
    }).catch((e) => setErr(e.message));
  }, [id]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function fileToBase64(f: File) {
    const buf = await f.arrayBuffer();
    let s = ""; const bytes = new Uint8Array(buf);
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(s);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true); setErr(null);
    try {
      const b64 = await fileToBase64(f);
      const { url } = await upload({ data: { filename: f.name, contentType: f.type, base64: b64 } });
      set("cover_image_url", url);
    } catch (e: any) { setErr(e.message); }
    finally { setUploading(false); }
  }

  async function uploadInlineImage(f: File): Promise<string> {
    const b64 = await fileToBase64(f);
    const { url } = await upload({ data: { filename: f.name, contentType: f.type, base64: b64 } });
    return url;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const slug = form.slug || slugify(form.title);
      if (!form.category) throw new Error("Choose a category");
      await save({ data: { ...form, slug } });
      navigate({ to: "/admin" });
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 32, fontFamily: "Inter, sans-serif" }}>
      <Link to="/admin" style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>← Back</Link>
      <h1 style={{ color: "#1e3a8a", marginTop: 8 }}>{isNew ? "New post" : "Edit post"}</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 16, marginTop: 20 }}>
        <Field label="Title">
          <input required value={form.title} onChange={(e) => { set("title", e.target.value); if (isNew && !form.slug) set("slug", slugify(e.target.value)); }} style={inp} />
        </Field>
        <Field label="Slug (URL)">
          <input required value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} style={inp} />
        </Field>
        <Field label="Category (menu section)">
          <select value={form.category} onChange={(e) => set("category", e.target.value)} style={inp}>
            {cats.length === 0 && <option value="">Loading…</option>}
            {cats.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Manage categories on the <Link to="/admin" style={{ color: "#1e3a8a" }}>Admin</Link> page (Categories tab).
          </div>
        </Field>
        <Field label="Excerpt (short summary shown on the blog list)">
          <textarea rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} style={{ ...inp, resize: "vertical" }} />
        </Field>
        <Field label="Cover image">
          <input type="file" accept="image/*" onChange={onFile} />
          {uploading && <div style={{ fontSize: 13, color: "#64748b" }}>Uploading…</div>}
          {form.cover_image_url && <img src={form.cover_image_url} alt="" style={{ marginTop: 8, maxWidth: 240, borderRadius: 8 }} />}
          <input placeholder="…or paste an image URL" value={form.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} style={{ ...inp, marginTop: 8 }} />
        </Field>
        <Field label="Content">
          <RichTextEditor value={form.content} onChange={(v) => set("content", v)} onUploadImage={uploadInlineImage} />
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Use the toolbar for formatting. Toggle <b>HTML</b> to paste raw markup.
          </div>
        </Field>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
          <span>Published (visible on the site)</span>
        </label>
        {err && <div style={{ color: "#dc2626" }}>{err}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={busy} type="submit" style={{ padding: "12px 20px", background: "#1e3a8a", color: "white", border: 0, borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            {busy ? "Saving…" : "Save"}
          </button>
          <Link to="/admin" style={{ padding: "12px 20px", background: "#f1f5f9", color: "#0f172a", borderRadius: 8, textDecoration: "none" }}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#334155", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: "white" };
