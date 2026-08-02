import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/tags")({
  component: Page,
  head: () => ({ meta: [{ title: "Tags — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Tags" description="Gerencie as tags científicas dos artigos." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
