import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { listPublishedPosts } from "@/lib/posts.functions";
import { listCategories } from "@/lib/categories.functions";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/blog/")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : undefined,
  }),
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: async ({ deps }) => {
    const [posts, categories] = await Promise.all([
      listPublishedPosts({ data: { category: deps.category } }),
      listCategories(),
    ]);
    return { posts, categories };
  },
  component: BlogList,
  head: ({ loaderData }) => ({
    meta: [
      { title: "Blog — Jessica Salgado" },
      { name: "description", content: "Articles on neurorehabilitation, VR, biomechanics and digital health." },
      { property: "og:title", content: "Blog — Jessica Salgado" },
      { property: "og:description", content: "Articles on neurorehabilitation, VR, biomechanics and digital health." },
    ],
  }),
  errorComponent: ({ error }) => <div style={pad}>Error: {error.message}</div>,
  notFoundComponent: () => <div style={pad}>No posts.</div>,
});

const pad: React.CSSProperties = { padding: 32, fontFamily: "Inter, sans-serif" };

function BlogList() {
  const { posts, categories } = Route.useLoaderData();
  const { category } = useSearch({ from: "/blog/" });
  const label = (slug: string) => categories.find((c: any) => c.slug === slug)?.label ?? slug;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", minHeight: "100vh", background: "#f7f8fc" }}>
      <TopBar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "inline-block", width: 6, height: 28, background: "#3b82f6", borderRadius: 3 }} />
          <h1 style={{ margin: 0, fontSize: 32, color: "#0f172a" }}>Blog</h1>
        </div>
        <p style={{ color: "#64748b", marginTop: 8 }}>{category ? label(category) : "All research areas"}</p>

        <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "20px 0 32px" }}>
          <Link to="/blog" search={{ category: undefined }} style={chip(!category)}>All</Link>
          {categories.map((c: any) => (
            <Link key={c.slug} to="/blog" search={{ category: c.slug }} style={chip(category === c.slug)}>
              {c.label}
            </Link>
          ))}
        </nav>

        {posts.length === 0 ? (
          <p style={{ color: "#64748b" }}>No posts published in this section yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {posts.map((p: any) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} style={cardLink}>
                {p.cover_image_url && <img src={p.cover_image_url} alt="" style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover" }} />}
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label(p.category)}</div>
                  <h3 style={{ margin: "6px 0 8px", fontSize: 18, color: "#0f172a" }}>{p.title}</h3>
                  {p.excerpt && <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>{p.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function TopBar() {
  return (
    <header style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ textDecoration: "none", color: "#1e3a8a", fontFamily: "'Dancing Script', cursive", fontSize: 24, fontWeight: 700 }}>Jessica Salgado</a>
        <nav style={{ display: "flex", gap: 20, fontSize: 14 }}>
          <a href="/" style={navL}>Home</a>
          <Link to="/blog" style={{ ...navL, color: "#1e3a8a", fontWeight: 600 }}>Blog</Link>
        </nav>
      </div>
    </header>
  );
}

const navL: React.CSSProperties = { textDecoration: "none", color: "#334155" };
const cardLink: React.CSSProperties = { display: "block", background: "white", borderRadius: 14, overflow: "hidden", textDecoration: "none", color: "inherit", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", transition: "transform .15s" };
const chip = (active: boolean): React.CSSProperties => ({
  padding: "6px 14px", borderRadius: 999,
  background: active ? "#1e3a8a" : "white",
  color: active ? "white" : "#334155",
  fontSize: 13, textDecoration: "none", border: "1px solid #e2e8f0", fontWeight: 500,
});
