import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function isNewSupabaseApiKey(v: string) {
  return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_");
}
function fetchShim(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (isNewSupabaseApiKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function esc(s: string | null | undefined) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/api/public/blogger-theme.xml")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const sb = createClient<Database>(process.env.SUPABASE_URL!, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          global: { fetch: fetchShim(key) },
        });
        const [{ data: cats }, { data: posts }] = await Promise.all([
          sb.from("categories").select("slug,label,sort_order").order("sort_order"),
          sb.from("posts")
            .select("title,slug,excerpt,content,cover_image_url,category,published_at")
            .eq("published", true)
            .order("published_at", { ascending: false }),
        ]);

        const xml = buildBloggerXml(cats ?? [], posts ?? []);
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Content-Disposition": 'attachment; filename="blogger-theme.xml"',
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});

function buildBloggerXml(
  cats: { slug: string; label: string }[],
  posts: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    cover_image_url: string | null;
    category: string;
    published_at: string | null;
  }[],
) {
  const nav = cats
    .map((c) => `<li><a href="/search/label/${esc(c.label)}">${esc(c.label)}</a></li>`)
    .join("");

  const now = new Date().toISOString();
  const postEntries = posts
    .map((p) => {
      const label = cats.find((c) => c.slug === p.category)?.label ?? p.category;
      const published = p.published_at ?? now;
      const html = p.cover_image_url
        ? `<p><img src="${esc(p.cover_image_url)}" alt="" style="width:100%;border-radius:14px;margin:0 0 24px;"/></p>${p.content ?? ""}`
        : (p.content ?? "");
      return `  <entry>
    <id>tag:blogger.com,1999:blog.post-${esc(p.slug)}</id>
    <published>${esc(published)}</published>
    <updated>${esc(published)}</updated>
    <category scheme="http://www.blogger.com/atom/ns#" term="${esc(label)}"/>
    <title type="text">${esc(p.title)}</title>
    <content type="html"><![CDATA[${html}]]></content>
    <author><name>Jessica Salgado</name></author>
  </entry>`;
    })
    .join("\n");

  const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', system-ui, sans-serif; background: #f7f8fc; color: #0f172a; -webkit-font-smoothing: antialiased; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }

.site-header { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.04); position: sticky; top: 0; z-index: 10; }
.site-header .inner { max-width: 1100px; margin: 0 auto; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
.brand { font-family: 'Dancing Script', cursive; font-size: 26px; font-weight: 700; color: #1e3a8a; }
.nav ul { display: flex; gap: 20px; font-size: 14px; list-style: none; flex-wrap: wrap; }
.nav a:hover { color: #1e3a8a; }

.hero { position: relative; min-height: 420px; padding: 80px 24px; background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%); }
.hero .inner { max-width: 1100px; margin: 0 auto; }
.hero h1 { font-size: 44px; line-height: 1.15; color: #1e3a8a; max-width: 720px; font-weight: 700; }
.hero p { margin-top: 16px; max-width: 640px; color: #334155; font-size: 17px; line-height: 1.6; }

.wrap { max-width: 1100px; margin: 0 auto; padding: 48px 24px; }
.section-title { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.section-title::before { content: ''; display: inline-block; width: 6px; height: 26px; background: #3b82f6; border-radius: 3px; }
.section-title h2 { font-size: 26px; color: #0f172a; }

.posts { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 22px; }
.post-card { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,.05); transition: transform .15s; }
.post-card:hover { transform: translateY(-3px); }
.post-card .thumb { width: 100%; aspect-ratio: 16/10; object-fit: cover; background: #e2e8f0; }
.post-card .body { padding: 18px; }
.post-card .label { font-size: 12px; color: #3b82f6; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
.post-card h3 { font-size: 18px; margin: 6px 0 8px; color: #0f172a; line-height: 1.35; }
.post-card p.snippet { color: #64748b; font-size: 14px; line-height: 1.55; }

.post-full { background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,.04); }
.post-full h1 { font-size: 36px; color: #0f172a; line-height: 1.2; margin-bottom: 12px; }
.post-full .meta { color: #64748b; font-size: 14px; margin-bottom: 24px; }
.post-full .body { font-size: 17px; line-height: 1.75; color: #1e293b; }
.post-full .body h2 { font-size: 26px; color: #1e3a8a; margin: 32px 0 12px; }
.post-full .body h3 { font-size: 20px; color: #1e3a8a; margin: 24px 0 10px; }
.post-full .body p { margin: 0 0 16px; }
.post-full .body img { border-radius: 10px; margin: 20px 0; }
.post-full .body ul, .post-full .body ol { padding-left: 24px; margin: 0 0 16px; }
.post-full .body blockquote { border-left: 4px solid #3b82f6; padding: 8px 16px; color: #334155; background: #f1f5f9; border-radius: 0 8px 8px 0; margin: 16px 0; }
.post-full .body a { color: #1e3a8a; text-decoration: underline; }

footer.site { text-align: center; padding: 40px 24px; color: #64748b; font-size: 14px; }
`.replace(/]]>/g, "]]]]><![CDATA[>");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:version='2' class='v2' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
<b:include data='blog' name='all-head-content'/>
<title><data:blog.pageTitle/></title>
<link href='https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&amp;family=Inter:wght@400;500;600;700&amp;display=swap' rel='stylesheet'/>
<b:skin><![CDATA[${css}]]></b:skin>
</head>
<body>
<header class='site-header'>
  <div class='inner'>
    <a class='brand' href='/'>Jessica Salgado</a>
    <nav class='nav'><ul>
      <li><a href='/'>Home</a></li>
      ${nav}
    </ul></nav>
  </div>
</header>

<b:section class='main' id='main' showaddelement='no'>
  <b:widget id='Blog1' locked='true' title='Blog Posts' type='Blog' version='2'>
    <b:includable id='main'>
      <b:if cond='data:view.isSingleItem'>
        <div class='wrap'>
          <b:loop values='data:posts' var='post'>
            <article class='post-full'>
              <h1><data:post.title/></h1>
              <div class='meta'>
                <b:if cond='data:post.date'><data:post.date/> · </b:if>
                <data:post.author.name/>
                <b:if cond='data:post.labels'>
                  · <b:loop values='data:post.labels' var='label'><a expr:href='data:label.url'><data:label.name/></a> </b:loop>
                </b:if>
              </div>
              <div class='body'><data:post.body/></div>
            </article>
          </b:loop>
        </div>
      <b:else/>
        <section class='hero'><div class='inner'>
          <h1>Bridging Physiotherapy and Technology</h1>
          <p>Research, clinical insights and evidence-based articles on neurorehabilitation, virtual reality, biomechanics and digital health.</p>
        </div></section>
        <div class='wrap'>
          <div class='section-title'><h2>Latest Articles</h2></div>
          <div class='posts'>
            <b:loop values='data:posts' var='post'>
              <a class='post-card' expr:href='data:post.url'>
                <b:if cond='data:post.featuredImage'><img class='thumb' expr:src='data:post.featuredImage'/></b:if>
                <div class='body'>
                  <b:if cond='data:post.labels'><div class='label'><data:post.labels.first.name/></div></b:if>
                  <h3><data:post.title/></h3>
                  <p class='snippet'><data:post.snippet/></p>
                </div>
              </a>
            </b:loop>
          </div>
        </div>
      </b:if>
    </b:includable>
  </b:widget>
</b:section>

<footer class='site'>© <data:blog.title/> · Powered by Blogger</footer>

<!--
  Pre-seeded content export (${cats.length} categories, ${posts.length} posts) so you can
  import posts via Settings → Import & back up → Import content in Blogger.
  The <entry> block below is a valid Atom feed.
-->
<b:comment>
<![CDATA[
<?xml version="1.0" encoding="UTF-8" ?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:blogger="http://schemas.google.com/blogger/2018">
  <title>Jessica Salgado — Blog Export</title>
${postEntries}
</feed>
]]>
</b:comment>

</body>
</html>`;
}
