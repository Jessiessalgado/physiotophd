import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/backup")({
  component: Page,
  head: () => ({ meta: [{ title: "Backup — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Backup" description="Exportação e importação de conteúdo." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
