import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/cms.functions";
import { PageHeader, Panel, Empty, ErrorNote, StatusPill } from "@/components/admin/ui";
import { btnPrimary } from "@/components/admin/styles";
import {
  FileText, CheckCircle2, PencilLine, Eye, FolderTree, Tags, Clock, Circle, Plus,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Physio to PhD" }] }),
});

function Dashboard() {
  const load = useServerFn(getDashboard);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    load().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorNote error={err} />;
  if (!data) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const s = data.stats;
  const cards = [
    { label: "Total de artigos", value: s.total, icon: FileText },
    { label: "Publicados", value: s.published, icon: CheckCircle2 },
    { label: "Rascunhos", value: s.drafts, icon: PencilLine },
    { label: "Agendados", value: s.scheduled, icon: Clock },
    { label: "Visualizações", value: s.views, icon: Eye },
    { label: "Categorias", value: s.categories, icon: FolderTree },
    { label: "Tags", value: s.tags, icon: Tags },
  ];

  const done = data.checklist.filter((c: any) => c.ok).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral do blog Physio to PhD"
        actions={
          <Link to="/admin/posts/$id" params={{ id: "new" }} className={btnPrimary}>
            <Plus className="size-4" /> Novo artigo
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-background p-4 shadow-sm transition hover:shadow-md">
            <c.icon className="size-4 text-primary" />
            <div className="mt-3 text-2xl font-semibold tabular-nums">{c.value}</div>
            <div className="text-[11px] text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Artigos recentes" className="lg:col-span-2">
          {data.recent.length === 0 ? (
            <Empty>Nenhum artigo ainda.</Empty>
          ) : (
            <ul className="divide-y">
              {data.recent.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      to="/admin/posts/$id"
                      params={{ id: p.id }}
                      className="block truncate text-sm font-medium hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <div className="truncate text-[11px] text-muted-foreground">/{p.slug}</div>
                  </div>
                  {p.published ? (
                    <StatusPill tone="green">Publicado</StatusPill>
                  ) : (
                    <StatusPill tone="amber">Rascunho</StatusPill>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Checklist SEO geral" description={`${done}/${data.checklist.length} concluídos`}>
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(done / data.checklist.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-2">
            {data.checklist.map((c: any) => (
              <li key={c.label} className="flex items-start gap-2 text-xs">
                {c.ok ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className={c.ok ? "text-muted-foreground line-through" : ""}>{c.label}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Posts mais acessados">
          {data.top.length === 0 ? (
            <Empty>Sem visualizações registradas.</Empty>
          ) : (
            <ul className="space-y-2">
              {data.top.map((t: any) => (
                <li key={t.post.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{t.post.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{t.views}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Últimos comentários">
          {data.comments.length === 0 ? (
            <Empty>Nenhum comentário.</Empty>
          ) : (
            <ul className="space-y-3">
              {data.comments.map((c: any) => (
                <li key={c.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.author_name}</span>
                    <StatusPill tone={c.status === "approved" ? "green" : c.status === "spam" ? "red" : "amber"}>
                      {c.status}
                    </StatusPill>
                  </div>
                  <p className="mt-1 line-clamp-2 text-muted-foreground">{c.content}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Atividade recente">
          <ul className="space-y-2.5">
            {data.activity.map((a: any, i: number) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{a.title}</div>
                  <div className="text-muted-foreground">
                    {a.kind} · {new Date(a.at).toLocaleString("pt-BR")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
