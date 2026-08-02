import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/newsletter")({
  component: Page,
  head: () => ({ meta: [{ title: "Newsletter — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Newsletter" description="Assinantes e integrações de e-mail." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
