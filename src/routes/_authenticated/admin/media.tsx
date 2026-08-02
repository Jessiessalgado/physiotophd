import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: Page,
  head: () => ({ meta: [{ title: "Mídia — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Mídia" description="Biblioteca de imagens enviadas." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
