import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: Page,
  head: () => ({ meta: [{ title: "SEO — Physio to PhD" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="SEO" description="Metadados globais, sitemap e verificação de busca." />
      <SettingsForm
        settingKey="seo"
        groups={[
          {
            title: "Metadados do site",
            description: "Como o blog aparece no Google e nas redes sociais.",
            fields: [
              { name: "seo_title", label: "Título do site nos buscadores", hint: "Até 60 caracteres" },
              { name: "keywords", label: "Palavras-chave", hint: "Separadas por vírgula" },
              { name: "meta_description", label: "Descrição nos buscadores", type: "textarea", hint: "Até 160 caracteres" },
              { name: "og_image", label: "Imagem de compartilhamento (link)" },
            ],
          },
          {
            title: "Indexação",
            fields: [
              { name: "sitemap_enabled", label: "Manter o mapa do site ativo", type: "checkbox" },
              { name: "noindex", label: "Pedir aos buscadores para não indexar o site", type: "checkbox" },
              { name: "robots_txt", label: "Regras do robots.txt", type: "textarea", rows: 5, mono: true },
            ],
          },
          {
            title: "Verificação e medição",
            fields: [
              { name: "google_site_verification", label: "Código de verificação do Google" },
              { name: "bing_site_verification", label: "Código de verificação do Bing" },
            ],
          },
        ]}
      />
    </>
  );
}
