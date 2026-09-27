import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listTags, upsertTag, deleteTag } from "@/lib/cms.functions";
import { PageHeader, Panel, Empty, ErrorNote } from "@/components/admin/ui";
import { inputCls, btnPrimary, btnGhost, btnDanger } from "@/components/admin/styles";

export const Route = createFileRoute("/_authenticated/admin/tags")({
  component: Page,
  head: () => ({ meta: [{ title: "Tags — Physio to PhD" }] }),
});

type Tag = { slug: string; label: string; description: string | null };

function Page() {
  const load = useServerFn(listTags);
  const save = useServerFn(upsertTag);
  const remove = useServerFn(deleteTag);
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");

  const refresh = () => load().then((t: any) => setTags(t)).catch((e) => setErr(e.message));
  useEffect(() => { refresh(); }, []);

  return (
    <>
      <PageHeader title="Tags" description="Gerencie as tags científicas dos artigos." />
      <ErrorNote error={err} />
      <Panel title="Nova tag">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!label.trim()) return;
            try {
              await save({ data: { label, slug: slug || undefined, description: desc || undefined } });
              setLabel(""); setSlug(""); setDesc(""); refresh();
            } catch (e: any) { setErr(e.message); }
          }}
        >
          <input placeholder="Nome (ex: Realidade Virtual)" value={label} onChange={(e) => setLabel(e.target.value)} className={`${inputCls} max-w-xs`} />
          <input placeholder="slug (opcional)" value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputCls} max-w-[200px] font-mono text-xs`} />
          <input placeholder="Descrição (opcional)" value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inputCls} min-w-[220px] flex-1`} />
          <button className={btnPrimary}>Adicionar</button>
        </form>
      </Panel>
      <div className="mt-4">
        <Panel title="Todas as tags">
          {tags === null ? <p className="text-sm text-muted-foreground">Carregando…</p> : tags.length === 0 ? (
            <Empty>Nenhuma tag cadastrada ainda.</Empty>
          ) : (
            <ul className="divide-y">
              {tags.map((t) => <Row key={t.slug} t={t} save={save} remove={remove} refresh={refresh} setErr={setErr} />)}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Row({ t, save, remove, refresh, setErr }: any) {
  const [label, setLabel] = useState(t.label);
  const [slug, setSlug] = useState(t.slug);
  const [desc, setDesc] = useState(t.description ?? "");
  useEffect(() => { setLabel(t.label); setSlug(t.slug); setDesc(t.description ?? ""); }, [t.label, t.slug, t.description]);
  const dirty = label !== t.label || slug !== t.slug || desc !== (t.description ?? "");

  return (
    <li className="flex flex-wrap items-center gap-2 py-2.5">
      <input value={label} onChange={(e) => setLabel(e.target.value)} className={`${inputCls} w-52`} />
      <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputCls} w-44 font-mono text-xs`} />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição" className={`${inputCls} min-w-[180px] flex-1`} />
      <button disabled={!dirty} className={dirty ? btnPrimary : btnGhost}
        onClick={async () => {
          try { await save({ data: { original_slug: t.slug, slug, label, description: desc || undefined } }); refresh(); }
          catch (e: any) { setErr(e.message); }
        }}>Salvar</button>
      <button className={btnDanger}
        onClick={async () => {
          if (!confirm(`Excluir a tag "${t.label}"?`)) return;
          try { await remove({ data: { slug: t.slug } }); refresh(); } catch (e: any) { setErr(e.message); }
        }}>Excluir</button>
    </li>
  );
}
