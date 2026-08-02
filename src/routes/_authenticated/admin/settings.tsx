import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: Page,
  head: () => ({ meta: [{ title: "Configurações — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Configurações" description="Preferências gerais do blog." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
