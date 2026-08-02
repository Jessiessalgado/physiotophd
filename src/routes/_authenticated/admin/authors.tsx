import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/authors")({
  component: Page,
  head: () => ({ meta: [{ title: "Autores — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Autores" description="Perfis de autoria exibidos nos posts." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
