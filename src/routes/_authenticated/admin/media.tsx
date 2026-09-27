import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMedia, uploadMedia, updateMedia, deleteMedia } from "@/lib/cms.functions";
import { PageHeader, Panel, Empty, ErrorNote } from "@/components/admin/ui";
import { inputCls, btnPrimary, btnGhost, btnDanger } from "@/components/admin/styles";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: Page,
  head: () => ({ meta: [{ title: "Mídia — Physio to PhD" }] }),
});

type Item = { id: string; url: string; path: string; filename: string; alt_text: string | null; size_bytes: number | null };

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Page() {
  const load = useServerFn(listMedia);
  const upload = useServerFn(uploadMedia);
  const update = useServerFn(updateMedia);
  const remove = useServerFn(deleteMedia);
  const [items, setItems] = useState<Item[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => load().then((m: any) => setItems(m)).catch((e) => setErr(e.message));
  useEffect(() => { refresh(); }, []);

  return (
    <>
      <PageHeader title="Mídia" description="Imagens usadas nos artigos e nas páginas." />
      <ErrorNote error={err} />
      <Panel title="Enviar imagem">
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true); setErr(null);
            try {
              const base64 = await toBase64(f);
              await upload({ data: { filename: f.name, contentType: f.type || "image/jpeg", base64 } });
              refresh();
            } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
          }}
          className="text-sm"
        />
        {busy && <p className="mt-2 text-sm text-muted-foreground">Enviando…</p>}
      </Panel>
      <div className="mt-4">
        <Panel title="Biblioteca">
          {items === null ? <p className="text-sm text-muted-foreground">Carregando…</p> : items.length === 0 ? (
            <Empty>Nenhuma imagem enviada ainda.</Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => <Card key={m.id} m={m} update={update} remove={remove} refresh={refresh} setErr={setErr} />)}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function Card({ m, update, remove, refresh, setErr }: any) {
  const [alt, setAlt] = useState(m.alt_text ?? "");
  useEffect(() => { setAlt(m.alt_text ?? ""); }, [m.alt_text]);
  return (
    <div className="rounded-xl border p-3">
      <img src={m.url} alt={m.alt_text ?? ""} className="mb-2 h-40 w-full rounded-lg object-cover" />
      <div className="truncate text-xs text-muted-foreground">{m.filename}</div>
      <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Texto alternativo" className={`${inputCls} mt-2`} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={async () => {
          try { await update({ data: { id: m.id, alt_text: alt } }); refresh(); } catch (e: any) { setErr(e.message); }
        }}>Salvar</button>
        <button className={btnGhost} onClick={() => { navigator.clipboard?.writeText(new URL(m.url, window.location.origin).href); }}>Copiar link</button>
        <button className={btnDanger} onClick={async () => {
          if (!confirm("Excluir esta imagem?")) return;
          try { await remove({ data: { id: m.id, path: m.path } }); refresh(); } catch (e: any) { setErr(e.message); }
        }}>Excluir</button>
      </div>
    </div>
  );
}
