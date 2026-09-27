import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listPages, getPage, upsertPage, deletePage } from "@/lib/cms.functions";
import { PageHeader, Panel, Empty, ErrorNote, Field, StatusPill } from "@/components/admin/ui";
import { inputCls, btnPrimary, btnGhost, btnDanger } from "@/components/admin/styles";
import { RichTextEditor } from "@/components/RichTextEditor";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  component: Page,
  head: () => ({ meta: [{ title: "Páginas — Physio to PhD" }] }),
});

type Row = { id: string; slug: string; title: string; excerpt: string | null; published: boolean; sort_order: number };
type Draft = {
  id?: string; slug: string; title: string; excerpt: string; content: string;
  meta_description: string; published: boolean; sort_order: number;
};

const blank: Draft = { slug: "", title: "", excerpt: "", content: "", meta_description: "", published: true, sort_order: 100 };

function Page() {
  const load = useServerFn(listPages);
  const one = useServerFn(getPage);
  const save = useServerFn(upsertPage);
  const remove = useServerFn(deletePage);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => load().then((r: any) => setRows(r)).catch((e) => setErr(e.message));
  useEffect(() => { refresh(); }, []);

  async function edit(id: string) {
    try {
      const p: any = await one({ data: { id } });
      setDraft({
        id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt ?? "", content: p.content ?? "",
        meta_description: p.meta_description ?? "", published: p.published, sort_order: p.sort_order,
      });
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <>
      <PageHeader
        title="Páginas"
        description="Páginas institucionais (Sobre, Contato, Termos, Política de Privacidade…)."
        actions={<button className={btnPrimary} onClick={() => setDraft({ ...blank })}>Nova página</button>}
      />
      <ErrorNote error={err} />

      {draft && (
        <div className="mb-4">
          <Panel title={draft.id ? "Editar página" : "Nova página"}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Título"><input className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
              <Field label="Endereço (slug)" hint="Ex.: sobre → /pagina/sobre">
                <input className={`${inputCls} font-mono text-xs`} value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
              </Field>
              <Field label="Resumo" className="md:col-span-2">
                <input className={inputCls} value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} />
              </Field>
              <Field label="Descrição para buscadores" className="md:col-span-2">
                <input className={inputCls} value={draft.meta_description} onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })} />
              </Field>
              <Field label="Ordem no menu"><input type="number" className={inputCls} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></Field>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
                <span>Publicada</span>
              </label>
            </div>
            <div className="mt-4">
              <span className="mb-1.5 block text-xs font-medium">Conteúdo</span>
              <RichTextEditor value={draft.content} onChange={(html) => setDraft((d) => (d ? { ...d, content: html } : d))} />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                disabled={busy}
                className={btnPrimary}
                onClick={async () => {
                  setBusy(true); setErr(null);
                  try {
                    await save({ data: { ...draft, excerpt: draft.excerpt || undefined, meta_description: draft.meta_description || undefined } });
                    setDraft(null); refresh();
                  } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
                }}
              >{busy ? "Salvando…" : "Salvar página"}</button>
              <button className={btnGhost} onClick={() => setDraft(null)}>Cancelar</button>
            </div>
          </Panel>
        </div>
      )}

      <Panel title="Todas as páginas">
        {rows === null ? <p className="text-sm text-muted-foreground">Carregando…</p> : rows.length === 0 ? (
          <Empty>Nenhuma página criada ainda.</Empty>
        ) : (
          <ul className="divide-y">
            {rows.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[200px] flex-1">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">/pagina/{p.slug}</div>
                </div>
                <StatusPill tone={p.published ? "green" : "slate"}>{p.published ? "Publicada" : "Rascunho"}</StatusPill>
                <button className={btnGhost} onClick={() => edit(p.id)}>Editar</button>
                <a className={btnGhost} href={`/pagina/${p.slug}`} target="_blank" rel="noreferrer">Ver</a>
                <button className={btnDanger} onClick={async () => {
                  if (!confirm(`Excluir a página "${p.title}"?`)) return;
                  try { await remove({ data: { id: p.id } }); refresh(); } catch (e: any) { setErr(e.message); }
                }}>Excluir</button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
