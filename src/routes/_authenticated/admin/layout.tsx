import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/layout")({
  component: Page,
  head: () => ({ meta: [{ title: "Layout — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Layout" description="Estrutura de menus, home e rodapé." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
