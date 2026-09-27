import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listSubscribers, deleteSubscriber } from "@/lib/cms.functions";
import { PageHeader, Panel, Empty, ErrorNote, StatusPill } from "@/components/admin/ui";
import { btnGhost, btnDanger } from "@/components/admin/styles";

export const Route = createFileRoute("/_authenticated/admin/newsletter")({
  component: Page,
  head: () => ({ meta: [{ title: "Newsletter — Physio to PhD" }] }),
});

function Page() {
  const load = useServerFn(listSubscribers);
  const remove = useServerFn(deleteSubscriber);
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = () => load().then((s: any) => setRows(s)).catch((e) => setErr(e.message));
  useEffect(() => { refresh(); }, []);

  function exportCsv() {
    const lines = ["email,nome,status,data", ...(rows ?? []).map((s) =>
      [s.email, s.name ?? "", s.status, new Date(s.created_at).toISOString()].join(","))];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "assinantes.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Newsletter"
        description="Pessoas inscritas para receber os novos artigos."
        actions={<button className={btnGhost} onClick={exportCsv} disabled={!rows?.length}>Baixar lista (CSV)</button>}
      />
      <ErrorNote error={err} />
      <Panel title={rows ? `${rows.length} inscrito(s)` : "Inscritos"}>
        {rows === null ? <p className="text-sm text-muted-foreground">Carregando…</p> : rows.length === 0 ? (
          <Empty>Ninguém se inscreveu ainda.</Empty>
        ) : (
          <ul className="divide-y">
            {rows.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <div className="min-w-[200px] flex-1">
                  <div className="text-sm font-medium">{s.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.name ? `${s.name} · ` : ""}{new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <StatusPill tone={s.status === "subscribed" ? "green" : "slate"}>
                  {s.status === "subscribed" ? "Ativo" : s.status}
                </StatusPill>
                <button className={btnDanger} onClick={async () => {
                  if (!confirm(`Remover ${s.email} da lista?`)) return;
                  try { await remove({ data: { id: s.id } }); refresh(); } catch (e: any) { setErr(e.message); }
                }}>Remover</button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
