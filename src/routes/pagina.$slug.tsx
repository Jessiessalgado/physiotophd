import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPublicPage } from "@/lib/cms.functions";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/pagina/$slug")({
  loader: async ({ params }) => {
    const page = await getPublicPage({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.page.title} — Physio to PhD` },
          { name: "description", content: loaderData.page.meta_description ?? loaderData.page.title },
          { property: "og:type", content: "article" },
          { name: "twitter:card", content: "summary" },
          { property: "og:title", content: loaderData.page.title },
          { property: "og:description", content: loaderData.page.meta_description ?? loaderData.page.title },
        ]
      : [],
  }),
  component: PagePublic,
  errorComponent: ({ error }) => <div style={{ padding: 32 }}>Erro: {error.message}</div>,
  notFoundComponent: () => (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "Inter, sans-serif" }}>
      <h1>Página não encontrada</h1>
      <a href="/">← Voltar ao início</a>
    </div>
  ),
});

function PagePublic() {
  const { page } = Route.useLoaderData();
  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#f7f8fc", minHeight: "100vh" }}>
      <header style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/" style={{ textDecoration: "none", color: "#1e3a8a", fontFamily: "'Dancing Script', cursive", fontSize: 24 }}>Jessica Salgado</a>
          <Link to="/blog" style={{ color: "#334155", textDecoration: "none", fontSize: 14 }}>Blog</Link>
        </div>
      </header>
      <article style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 34, color: "#0f172a", lineHeight: 1.2, marginBottom: 20 }}>{page.title}</h1>
        <div
          style={{ fontSize: 17, lineHeight: 1.75, color: "#1e293b" }}
          dangerouslySetInnerHTML={{ __html: page.content ?? "" }}
        />
        {page.slug === "contato" && <ContactForm />}
      </article>
      <SiteFooter />
    </div>
  );
}
