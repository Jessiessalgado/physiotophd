import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/theme")({
  component: Page,
  head: () => ({ meta: [{ title: "Tema — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Tema" description="Cores, tipografia e identidade visual." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
