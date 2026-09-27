import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { exportAll, importBackup } from "@/lib/cms.functions";
import { PageHeader, Panel, ErrorNote } from "@/components/admin/ui";
import { btnPrimary, btnGhost } from "@/components/admin/styles";

export const Route = createFileRoute("/_authenticated/admin/backup")({
  component: Page,
  head: () => ({ meta: [{ title: "Backup — Physio to PhD" }] }),
});

function Page() {
  const doExport = useServerFn(exportAll);
  const doImport = useServerFn(importBackup);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <PageHeader title="Backup" description="Baixe uma cópia de tudo ou restaure um arquivo salvo." />
      <ErrorNote error={err} />
      {msg && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</div>}

      <Panel title="Baixar cópia" description="Inclui artigos, categorias, tags, páginas, autores e configurações.">
        <button disabled={busy} className={btnPrimary} onClick={async () => {
          setBusy(true); setErr(null); setMsg(null);
          try {
            const data: any = await doExport();
            const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
            const a = document.createElement("a");
            a.href = url; a.download = `physiotophd-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
            URL.revokeObjectURL(url);
            setMsg("Cópia baixada com sucesso.");
          } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
        }}>{busy ? "Preparando…" : "Baixar backup"}</button>
      </Panel>

      <div className="mt-4">
        <Panel title="Restaurar" description="Selecione um arquivo de backup. Conteúdos com o mesmo endereço são atualizados.">
          <label className={`${btnGhost} cursor-pointer`}>
            Escolher arquivo
            <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (!confirm("Restaurar este backup? Conteúdos existentes podem ser sobrescritos.")) return;
              setBusy(true); setErr(null); setMsg(null);
              try {
                const json = await f.text();
                const counts: any = await doImport({ data: { json } });
                setMsg("Restaurado: " + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", "));
              } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
            }} />
          </label>
        </Panel>
      </div>
    </>
  );
}
