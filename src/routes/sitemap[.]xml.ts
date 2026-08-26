import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { publicClient } from "@/lib/cms.server";

const BASE_URL = "https://physiotophd.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/blog", changefreq: "weekly", priority: "0.9" },
        ];

        try {
          const sb = publicClient();
          const nowIso = new Date().toISOString();
          const [{ data: posts }, { data: pages }] = await Promise.all([
            sb
              .from("posts")
              .select("slug,published,published_at")
              .eq("published", true)
              .lte("published_at", nowIso),
            sb.from("pages").select("slug").eq("published", true),
          ]);

          for (const p of posts || []) {
            entries.push({ path: `/blog/${p.slug}`, changefreq: "monthly", priority: "0.8" });
          }
          for (const p of pages || []) {
            entries.push({ path: `/pagina/${p.slug}`, changefreq: "yearly", priority: "0.5" });
          }
        } catch {
          // fall back to static entries
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
