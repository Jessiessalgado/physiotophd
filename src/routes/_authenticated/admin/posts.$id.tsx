import { createFileRoute, Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPostAdmin, upsertPost, uploadCoverImage } from "@/lib/posts.functions";
import { listCategories } from "@/lib/categories.functions";
import { listTags, listAuthors } from "@/lib/cms.functions";
import { RichTextEditor } from "@/components/RichTextEditor";
import { PageHeader, Panel, Field, ErrorNote } from "@/components/admin/ui";
import { inputCls, btnPrimary, btnGhost } from "@/components/admin/styles";
import { markdownToHtml, readingTime } from "@/lib/markdown";
import { seoChecks, seoScore, SCIENTIFIC_TEMPLATE, TAG_SUGGESTIONS } from "@/lib/seo-score";
import { CheckCircle2, Circle, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/posts/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ template: (s.template as string) || "" }),
  component: Editor,
  head: () => ({ meta: [{ title: "Editor — Physio to PhD" }] }),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Editor() {
  const { id } = useParams({ from: "/_authenticated/admin/posts/$id" });
  const { template } = useSearch({ from: "/_authenticated/admin/posts/$id" });
  const isNew = id === "new";
  const navigate = useNavigate();
  const load = useServerFn(getPostAdmin);
  const save = useServerFn(upsertPost);
  const upload = useServerFn(uploadCoverImage);
  const loadCats = useServerFn(listCategories);
  const loadTags = useServerFn(listTags);
  const loadAuthors = useServerFn(listAuthors);

  const [cats, setCats] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [mode, setMode] = useState<"visual" | "markdown">("visual");
  const [md, setMd] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    id: undefined as string | undefined,
    title: "", slug: "", excerpt: "", meta_description: "", content: template === "science" ? SCIENTIFIC_TEMPLATE : "",
    cover_image_url: "", category: "", published: false, published_at: "",
    featured: false, author_id: "", doi: "", references_text: "", tags: [] as string[],
  });

  useEffect(() => {
    Promise.all([loadCats(), loadTags(), loadAuthors()])
      .then(([c, t, a]: any) => {
        setCats(c); setAllTags(t); setAuthors(a);
        setForm((f) => (f.category ? f : { ...f, category: c[0]?.slug ?? "" }));
      })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (isNew) return;
    load({ data: { id } })
      .then((row: any) => {
        if (!row?.id) return;
        setForm({
          id: row.id, title: row.title, slug: row.slug, excerpt: row.excerpt ?? "",
          meta_description: row.meta_description ?? "", content: row.content ?? "",
          cover_image_url: row.cover_image_url ?? "", category: row.category,
          published: row.published, published_at: row.published_at ? toLocalInput(row.published_at) : "",
          featured: !!row.featured, author_id: row.author_id ?? "", doi: row.doi ?? "",
          references_text: row.references_text ?? "", tags: row.tags ?? [],
        });
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function fileToBase64(f: File) {
    const buf = await f.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  async function uploadInline(f: File) {
    const { url } = await upload({ data: { filename: f.name, contentType: f.type, base64: await fileToBase64(f) } });
    return url;
  }
  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try { set("cover_image_url", await uploadInline(f)); } catch (e: any) { setErr(e.message); } finally { setUploading(false); }
  }

  const contentHtml = mode === "markdown" ? markdownToHtml(md) : form.content;
  const checks = useMemo(
    () => seoChecks({ ...form, content: contentHtml, cover: form.cover_image_url, metaDescription: form.meta_description }),
    [form, contentHtml],
  );
  const score = seoScore(checks);
  const minutes = readingTime(contentHtml);

  const suggestions = (TAG_SUGGESTIONS[form.category] ?? []).filter((t) => !form.tags.includes(t));
  const filteredTags = allTags
    .filter((t) => !form.tags.includes(t.slug) && (t.label.toLowerCase().includes(tagQuery.toLowerCase()) || t.slug.includes(tagQuery.toLowerCase())))
    .slice(0, 8);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      if (!form.category) throw new Error("Escolha uma categoria");
      await save({
        data: {
          ...form,
          content: contentHtml,
          slug: form.slug || slugify(form.title),
          published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
          author_id: form.author_id || null,
          reading_time: minutes,
          seo_score: score,
        },
      });
      navigate({ to: "/admin/posts" });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit}>
      <PageHeader
        title={isNew ? "Nova postagem" : "Editar postagem"}
        description={`${minutes} min de leitura · SEO ${score}/100`}
        actions={
          <>
            <Link to="/admin/posts" className={btnGhost}>Cancelar</Link>
            <button disabled={busy} className={btnPrimary}>{busy ? "Salvando…" : "Salvar"}</button>
          </>
        }
      />
      <ErrorNote error={err} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <div className="grid gap-4">
              <Field label="Título">
                <input
                  required value={form.title} className={inputCls}
                  onChange={(e) => { set("title", e.target.value); if (isNew && !form.slug) set("slug", slugify(e.target.value)); }}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Slug (URL)">
                  <input required value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} className={`${inputCls} font-mono text-xs`} />
                </Field>
                <Field label="DOI (opcional)">
                  <input value={form.doi} onChange={(e) => set("doi", e.target.value)} className={inputCls} placeholder="10.1000/xyz123" />
                </Field>
              </div>
              <Field label="Resumo" hint="Aparece nos cards do blog.">
                <textarea rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={`${inputCls} resize-y`} />
              </Field>
              <Field label="Meta description" hint={`${form.meta_description.length}/160 caracteres`}>
                <textarea rows={2} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} className={`${inputCls} resize-y`} />
              </Field>
            </div>
          </Panel>

          <Panel
            title="Conteúdo"
            actions={
              <div className="flex gap-1 rounded-lg border p-0.5">
                {(["visual", "markdown"] as const).map((m) => (
                  <button
                    key={m} type="button"
                    onClick={() => {
                      if (m === "markdown" && mode === "visual") setMd(md || "");
                      setMode(m);
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {m === "visual" ? "Visual" : "Markdown"}
                  </button>
                ))}
              </div>
            }
          >
            {mode === "visual" ? (
              <RichTextEditor value={form.content} onChange={(v) => set("content", v)} onUploadImage={uploadInline} />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <textarea
                  rows={22} value={md} onChange={(e) => setMd(e.target.value)}
                  placeholder={"# Título\n\n**negrito**, `código`, > citação\n\n| col | col |\n| --- | --- |\n| a | b |"}
                  className={`${inputCls} resize-y font-mono text-xs`}
                />
                <div
                  className="prose prose-sm max-w-none overflow-auto rounded-lg border p-3"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(md) }}
                />
              </div>
            )}
            {mode === "markdown" && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Ao salvar, o Markdown é convertido em HTML e substitui o conteúdo atual.
              </p>
            )}
            {!form.content && (
              <button
                type="button"
                onClick={() => (mode === "visual" ? set("content", SCIENTIFIC_TEMPLATE) : setMd(""))}
                className={`${btnGhost} mt-3`}
              >
                <FlaskConical className="size-4" /> Inserir template de artigo científico
              </button>
            )}
          </Panel>

          <Panel title="Referências bibliográficas">
            <textarea
              rows={5} value={form.references_text} onChange={(e) => set("references_text", e.target.value)}
              placeholder="Uma referência por linha (ABNT ou Vancouver)."
              className={`${inputCls} resize-y`}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Publicação">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
                Publicado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
                Artigo em destaque
              </label>
              <Field label="Data / agendamento">
                <input type="datetime-local" value={form.published_at} onChange={(e) => set("published_at", e.target.value)} className={inputCls} />
              </Field>
              <div className="flex gap-2">
                <button type="button" className={btnGhost} onClick={() => set("published_at", toLocalInput(new Date().toISOString()))}>Agora</button>
                {form.published_at && <button type="button" className={btnGhost} onClick={() => set("published_at", "")}>Limpar</button>}
              </div>
            </div>
          </Panel>

          <Panel title="Organização">
            <div className="space-y-3">
              <Field label="Categoria">
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                  {cats.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Autor">
                <select value={form.author_id} onChange={(e) => set("author_id", e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
              <Field label="Tags">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {form.tags.map((t) => (
                    <button key={t} type="button" onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                      {allTags.find((x) => x.slug === t)?.label ?? t} ×
                    </button>
                  ))}
                </div>
                <input value={tagQuery} onChange={(e) => setTagQuery(e.target.value)} placeholder="Buscar tag…" className={inputCls} />
                {tagQuery && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {filteredTags.map((t) => (
                      <button key={t.slug} type="button" onClick={() => { set("tags", [...form.tags, t.slug]); setTagQuery(""); }}
                        className="rounded-full border px-2 py-0.5 text-[11px] hover:bg-muted">+ {t.label}</button>
                    ))}
                  </div>
                )}
                {suggestions.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[11px] text-muted-foreground">Sugeridas para esta categoria:</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {suggestions.map((t) => (
                        <button key={t} type="button" onClick={() => set("tags", [...form.tags, t])}
                          className="rounded-full border px-2 py-0.5 text-[11px] hover:bg-muted">
                          + {allTags.find((x) => x.slug === t)?.label ?? t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Field>
            </div>
          </Panel>

          <Panel title="Imagem destaque">
            <input type="file" accept="image/*" onChange={onCover} className="text-xs" />
            {uploading && <p className="mt-2 text-xs text-muted-foreground">Enviando…</p>}
            {form.cover_image_url && <img src={form.cover_image_url} alt="" className="mt-3 w-full rounded-lg" />}
            <input value={form.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} placeholder="…ou cole uma URL" className={`${inputCls} mt-2`} />
          </Panel>

          <Panel title="Checklist SEO" description={`Pontuação ${score}/100`}>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${score}%` }} />
            </div>
            <ul className="space-y-1.5">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2 text-xs">
                  {c.ok ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />}
                  <span className={c.ok ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </form>
  );
}
