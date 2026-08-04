import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPostBySlug } from "@/lib/posts.functions";
import { listCategories } from "@/lib/categories.functions";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const [post, categories] = await Promise.all([
      getPostBySlug({ data: { slug: params.slug } }),
      listCategories(),
    ]);
    if (!post) throw notFound();
    return { post, categories };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.post.title} — Jessica Salgado` },
          { name: "description", content: loaderData.post.excerpt ?? loaderData.post.title },
          { property: "og:title", content: loaderData.post.title },
          { property: "og:description", content: loaderData.post.excerpt ?? "" },
          ...(loaderData.post.cover_image_url ? [{ property: "og:image", content: loaderData.post.cover_image_url }] : []),
        ]
      : [],
  }),
  component: PostPage,
  errorComponent: ({ error }) => <div style={{ padding: 32 }}>Error: {error.message}</div>,
  notFoundComponent: () => (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "Inter, sans-serif" }}>
      <h1>Post not found</h1>
      <Link to="/blog/">← Back to blog</Link>
    </div>
  ),
});

function PostPage() {
  const { post: p, categories } = Route.useLoaderData();
  const label = categories.find((c: any) => c.slug === p.category)?.label ?? p.category;
  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#f7f8fc", minHeight: "100vh" }}>
      <header style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none", color: "#1e3a8a", fontFamily: "'Dancing Script', cursive", fontSize: 24 }}>Jessica Salgado</a>
          <Link to="/blog/" style={{ color: "#334155", textDecoration: "none", fontSize: 14 }}>← Blog</Link>
        </div>
      </header>
      <article style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px" }}>
        <Link to="/blog/" search={{ category: p.category }} style={{ color: "#3b82f6", fontSize: 13, fontWeight: 600, textDecoration: "none", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </Link>
        <h1 style={{ margin: "8px 0 12px", fontSize: 36, color: "#0f172a", lineHeight: 1.2 }}>{p.title}</h1>
        {p.published_at && (
          <div style={{ color: "#64748b", fontSize: 14 }}>
            {new Date(p.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} · Jessica Salgado
          </div>
        )}
        {p.cover_image_url && <img src={p.cover_image_url} alt="" style={{ width: "100%", borderRadius: 14, marginTop: 24 }} />}
        <div style={{ marginTop: 32, fontSize: 17, lineHeight: 1.75, color: "#1e293b" }} dangerouslySetInnerHTML={{ __html: p.content ?? "" }} />
      </article>
      <SiteFooter />
    </div>
  );
}
