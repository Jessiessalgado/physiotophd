import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listComments, moderateComment, deleteComment } from "@/lib/cms.functions";
import { PageHeader, Panel, Empty, ErrorNote, StatusPill } from "@/components/admin/ui";
import { inputCls, btnPrimary, btnGhost, btnDanger } from "@/components/admin/styles";

export const Route = createFileRoute("/_authenticated/admin/comments")({
  component: Page,
  head: () => ({ meta: [{ title: "Comentários — Physio to PhD" }] }),
});

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendentes" },
  { key: "approved", label: "Aprovados" },
  { key: "spam", label: "Spam" },
];

function Page() {
  const load = useServerFn(listComments);
  const moderate = useServerFn(moderateComment);
  const remove = useServerFn(deleteComment);
  const [rows, setRows] = useState<any[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [err, setErr] = useState<string | null>(null);

  const refresh = () => load().then((c: any) => setRows(c)).catch((e) => setErr(e.message));
  useEffect(() => { refresh(); }, []);

  const shown = (rows ?? []).filter((c) => filter === "all" || c.status === filter);

  return (
    <>
      <PageHeader title="Comentários" description="Aprove, responda ou remova comentários dos leitores." />
      <ErrorNote error={err} />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={filter === f.key ? btnPrimary : btnGhost}>
            {f.label}
          </button>
        ))}
      </div>
      <Panel>
        {rows === null ? <p className="text-sm text-muted-foreground">Carregando…</p> : shown.length === 0 ? (
          <Empty>Nenhum comentário nesta lista.</Empty>
        ) : (
          <ul className="divide-y">
            {shown.map((c) => <Item key={c.id} c={c} moderate={moderate} remove={remove} refresh={refresh} setErr={setErr} />)}
          </ul>
        )}
      </Panel>
    </>
  );
}

function Item({ c, moderate, remove, refresh, setErr }: any) {
  const [reply, setReply] = useState(c.admin_reply ?? "");
  useEffect(() => { setReply(c.admin_reply ?? ""); }, [c.admin_reply]);
  const tone = c.status === "approved" ? "green" : c.status === "spam" ? "red" : "amber";
  const act = async (patch: any) => { try { await moderate({ data: { id: c.id, ...patch } }); refresh(); } catch (e: any) { setErr(e.message); } };

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{c.author_name}</span>
        <StatusPill tone={tone as any}>{c.status === "approved" ? "Aprovado" : c.status === "spam" ? "Spam" : "Pendente"}</StatusPill>
        <span className="text-xs text-muted-foreground">
          {c.posts?.title ? `em “${c.posts.title}”` : ""} · {new Date(c.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>
      <textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Sua resposta (opcional)" className={`${inputCls} mt-2 resize-y`} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={() => act({ status: "approved", admin_reply: reply })}>Aprovar</button>
        <button className={btnGhost} onClick={() => act({ status: "pending" })}>Deixar pendente</button>
        <button className={btnGhost} onClick={() => act({ status: "spam" })}>Marcar spam</button>
        <button className={btnGhost} onClick={() => act({ admin_reply: reply })}>Salvar resposta</button>
        <button className={btnDanger} onClick={async () => {
          if (!confirm("Excluir este comentário?")) return;
          try { await remove({ data: { id: c.id } }); refresh(); } catch (e: any) { setErr(e.message); }
        }}>Excluir</button>
      </div>
    </li>
  );
}
