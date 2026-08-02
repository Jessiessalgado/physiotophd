import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: Page,
  head: () => ({ meta: [{ title: "SEO — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="SEO" description="Metadados globais, sitemap e verificação de busca." />
      <Panel>
        <Empty>Este módulo está sendo finalizado e ficará disponível na próxima etapa.</Empty>
      </Panel>
    </>
  );
}
