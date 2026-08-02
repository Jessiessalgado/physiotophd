import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAllPostsAdmin, deletePost } from "@/lib/posts.functions";
import { listCategories } from "@/lib/categories.functions";
import { PageHeader, Panel, Empty, ErrorNote, StatusPill } from "@/components/admin/ui";
import { btnPrimary, btnGhost, btnDanger, inputCls } from "@/components/admin/styles";
import { Plus, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/posts/")({
  component: PostsList,
  head: () => ({ meta: [{ title: "Postagens — Physio to PhD" }] }),
});

function PostsList() {
  const list = useServerFn(listAllPostsAdmin);
  const del = useServerFn(deletePost);
  const loadCats = useServerFn(listCategories);
  const [posts, setPosts] = useState<any[] | null>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  async function refresh() {
    try {
      const [p, c] = await Promise.all([list(), loadCats()]);
      setPosts(p as any);
      setCats(c as any);
    } catch (e: any) {
      setErr(e.message);
    }
  }
  useEffect(() => { refresh(); }, []);

  const label = (slug: string) => cats.find((c) => c.slug === slug)?.label ?? slug;
  const now = Date.now();
  const rows = (posts ?? []).filter((p) => {
    const scheduled = p.published && p.published_at && new Date(p.published_at).getTime() > now;
    const state = !p.published ? "draft" : scheduled ? "scheduled" : "published";
    return (filter === "all" || filter === state) && p.title.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <>
      <PageHeader
        title="Postagens"
        description="Todos os artigos do blog"
        actions={
          <>
            <Link to="/admin/posts/$id" params={{ id: "new" }} search={{ template: "science" }} className={btnGhost}>
              <FlaskConical className="size-4" /> Novo artigo científico
            </Link>
            <Link to="/admin/posts/$id" params={{ id: "new" }} className={btnPrimary}>
              <Plus className="size-4" /> Nova postagem
            </Link>
          </>
        }
      />
      <ErrorNote error={err} />
      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          <input placeholder="Buscar por título…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} max-w-xs`} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputCls} max-w-[180px]`}>
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="scheduled">Agendados</option>
            <option value="draft">Rascunhos</option>
          </select>
        </div>
        {posts === null ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <Empty>Nenhuma postagem encontrada.</Empty>
        ) : (
          <ul className="divide-y">
            {rows.map((p) => {
              const scheduled = p.published && p.published_at && new Date(p.published_at).getTime() > now;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to="/admin/posts/$id" params={{ id: p.id }} className="truncate font-medium hover:text-primary">
                        {p.title}
                      </Link>
                      {p.featured && <StatusPill tone="violet">Destaque</StatusPill>}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {label(p.category)} · /{p.slug}
                      {p.reading_time ? ` · ${p.reading_time} min` : ""}
                      {typeof p.seo_score === "number" ? ` · SEO ${p.seo_score}` : ""}
                    </div>
                  </div>
                  {!p.published ? (
                    <StatusPill tone="amber">Rascunho</StatusPill>
                  ) : scheduled ? (
                    <StatusPill tone="violet">⏱ {new Date(p.published_at).toLocaleString("pt-BR")}</StatusPill>
                  ) : (
                    <StatusPill tone="green">Publicado</StatusPill>
                  )}
                  <Link to="/admin/posts/$id" params={{ id: p.id }} className={btnGhost}>Editar</Link>
                  <button
                    className={btnDanger}
                    onClick={async () => {
                      if (!confirm("Excluir esta postagem?")) return;
                      await del({ data: { id: p.id } });
                      refresh();
                    }}
                  >
                    Excluir
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
