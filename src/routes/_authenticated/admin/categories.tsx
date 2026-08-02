import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listCategories, createCategory, updateCategory, deleteCategory } from "@/lib/categories.functions";
import { PageHeader, Panel, Empty, ErrorNote } from "@/components/admin/ui";
import { inputCls, btnPrimary, btnGhost, btnDanger } from "@/components/admin/styles";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: Categories,
  head: () => ({ meta: [{ title: "Categorias — Physio to PhD" }] }),
});

type Cat = { slug: string; label: string; sort_order: number };

function Categories() {
  const load = useServerFn(listCategories);
  const create = useServerFn(createCategory);
  const update = useServerFn(updateCategory);
  const remove = useServerFn(deleteCategory);
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");

  const refresh = () => load().then((c: any) => setCats(c)).catch((e) => setErr(e.message));
  useEffect(() => { refresh(); }, []);

  return (
    <>
      <PageHeader title="Categorias" description="Seções científicas do blog e do menu" />
      <ErrorNote error={err} />
      <Panel title="Nova categoria">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!label.trim()) return;
            try { await create({ data: { label, slug: slug || undefined } }); setLabel(""); setSlug(""); refresh(); }
            catch (e: any) { setErr(e.message); }
          }}
        >
          <input placeholder="Nome (ex: Telerreabilitação)" value={label} onChange={(e) => setLabel(e.target.value)} className={`${inputCls} max-w-xs`} />
          <input placeholder="slug (opcional)" value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputCls} max-w-[200px] font-mono text-xs`} />
          <button className={btnPrimary}>Adicionar</button>
        </form>
      </Panel>
      <div className="mt-4">
        <Panel title="Todas as categorias">
          {cats === null ? <p className="text-sm text-muted-foreground">Carregando…</p> : cats.length === 0 ? (
            <Empty>Nenhuma categoria.</Empty>
          ) : (
            <ul className="divide-y">
              {cats.map((c) => <Row key={c.slug} c={c} cats={cats} onSave={update} onDelete={remove} refresh={refresh} setErr={setErr} />)}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Row({ c, cats, onSave, onDelete, refresh, setErr }: any) {
  const [label, setLabel] = useState(c.label);
  const [slug, setSlug] = useState(c.slug);
  const [order, setOrder] = useState(c.sort_order);
  useEffect(() => { setLabel(c.label); setSlug(c.slug); setOrder(c.sort_order); }, [c.label, c.slug, c.sort_order]);
  const dirty = label !== c.label || slug !== c.slug || order !== c.sort_order;

  return (
    <li className="flex flex-wrap items-center gap-2 py-2.5">
      <input value={label} onChange={(e) => setLabel(e.target.value)} className={`${inputCls} min-w-[180px] flex-1`} />
      <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputCls} w-48 font-mono text-xs`} />
      <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className={`${inputCls} w-20`} />
      <button disabled={!dirty} className={dirty ? btnPrimary : btnGhost}
        onClick={async () => { try { await onSave({ data: { slug: c.slug, new_slug: slug, label, sort_order: order } }); refresh(); } catch (e: any) { setErr(e.message); } }}>
        Salvar
      </button>
      <button className={btnDanger}
        onClick={async () => {
          const others = cats.filter((x: any) => x.slug !== c.slug);
          const choice = prompt(`Excluir "${c.label}". Reatribuir os posts para qual slug? (vazio = manter)\n\nDisponíveis: ${others.map((o: any) => o.slug).join(", ")}`);
          if (choice === null) return;
          try { await onDelete({ data: { slug: c.slug, reassign_to: choice.trim() || undefined } }); refresh(); } catch (e: any) { setErr(e.message); }
        }}>
        Excluir
      </button>
    </li>
  );
}
