import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/comments")({
  component: Page,
  head: () => ({ meta: [{ title: "Comentários — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Comentários" description="Moderação de comentários dos leitores." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
