import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAuthors, upsertAuthor, deleteAuthor } from "@/lib/cms.functions";
import { PageHeader, Panel, Empty, ErrorNote, Field } from "@/components/admin/ui";
import { inputCls, btnPrimary, btnGhost, btnDanger } from "@/components/admin/styles";

export const Route = createFileRoute("/_authenticated/admin/authors")({
  component: Page,
  head: () => ({ meta: [{ title: "Autores — Physio to PhD" }] }),
});

type Draft = {
  id?: string; name: string; slug: string; role_title: string; bio: string;
  avatar_url: string; email: string; website: string; instagram: string; linkedin: string;
};

const blank: Draft = { name: "", slug: "", role_title: "", bio: "", avatar_url: "", email: "", website: "", instagram: "", linkedin: "" };

function Page() {
  const load = useServerFn(listAuthors);
  const save = useServerFn(upsertAuthor);
  const remove = useServerFn(deleteAuthor);
  const [rows, setRows] = useState<any[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => load().then((a: any) => setRows(a)).catch((e) => setErr(e.message));
  useEffect(() => { refresh(); }, []);

  return (
    <>
      <PageHeader
        title="Autores"
        description="Perfis exibidos ao final dos artigos."
        actions={<button className={btnPrimary} onClick={() => setDraft({ ...blank })}>Novo autor</button>}
      />
      <ErrorNote error={err} />

      {draft && (
        <div className="mb-4">
          <Panel title={draft.id ? "Editar autor" : "Novo autor"}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome"><input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="Endereço (slug)"><input className={`${inputCls} font-mono text-xs`} value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></Field>
              <Field label="Titulação / cargo"><input className={inputCls} value={draft.role_title} onChange={(e) => setDraft({ ...draft, role_title: e.target.value })} /></Field>
              <Field label="Foto (link)"><input className={inputCls} value={draft.avatar_url} onChange={(e) => setDraft({ ...draft, avatar_url: e.target.value })} /></Field>
              <Field label="E-mail (não aparece no site)"><input className={inputCls} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
              <Field label="Site"><input className={inputCls} value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} /></Field>
              <Field label="Instagram"><input className={inputCls} value={draft.instagram} onChange={(e) => setDraft({ ...draft, instagram: e.target.value })} /></Field>
              <Field label="LinkedIn"><input className={inputCls} value={draft.linkedin} onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })} /></Field>
              <Field label="Mini biografia" className="md:col-span-2">
                <textarea rows={4} className={`${inputCls} resize-y`} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
              </Field>
            </div>
            <div className="mt-4 flex gap-2">
              <button disabled={busy} className={btnPrimary} onClick={async () => {
                setBusy(true); setErr(null);
                try {
                  await save({ data: {
                    id: draft.id, name: draft.name, slug: draft.slug || undefined,
                    role_title: draft.role_title || undefined, bio: draft.bio || undefined,
                    avatar_url: draft.avatar_url || undefined, email: draft.email || undefined,
                    website: draft.website || undefined,
                    socials: { instagram: draft.instagram, linkedin: draft.linkedin },
                  } });
                  setDraft(null); refresh();
                } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
              }}>{busy ? "Salvando…" : "Salvar autor"}</button>
              <button className={btnGhost} onClick={() => setDraft(null)}>Cancelar</button>
            </div>
          </Panel>
        </div>
      )}

      <Panel title="Todos os autores">
        {rows === null ? <p className="text-sm text-muted-foreground">Carregando…</p> : rows.length === 0 ? (
          <Empty>Nenhum autor cadastrado ainda.</Empty>
        ) : (
          <ul className="divide-y">
            {rows.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                {a.avatar_url
                  ? <img src={a.avatar_url} alt={a.name} className="size-10 rounded-full object-cover" />
                  : <div className="size-10 rounded-full bg-muted" />}
                <div className="min-w-[180px] flex-1">
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.role_title}</div>
                </div>
                <button className={btnGhost} onClick={() => setDraft({
                  id: a.id, name: a.name, slug: a.slug, role_title: a.role_title ?? "", bio: a.bio ?? "",
                  avatar_url: a.avatar_url ?? "", email: "", website: a.website ?? "",
                  instagram: a.socials?.instagram ?? "", linkedin: a.socials?.linkedin ?? "",
                })}>Editar</button>
                <button className={btnDanger} onClick={async () => {
                  if (!confirm(`Excluir o autor "${a.name}"?`)) return;
                  try { await remove({ data: { id: a.id } }); refresh(); } catch (e: any) { setErr(e.message); }
                }}>Excluir</button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
