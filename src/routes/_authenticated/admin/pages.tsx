import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  component: Page,
  head: () => ({ meta: [{ title: "Páginas — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Páginas" description="Páginas institucionais (Sobre, Aviso Médico, Contato…)." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
