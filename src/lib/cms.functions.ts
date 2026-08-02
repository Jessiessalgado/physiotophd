import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, publicClient, slugify } from "@/lib/cms.server";

/* ============================ SETTINGS ============================ */

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("settings").select("key,value,is_public");
    if (error) throw new Error(error.message);
    const out: Record<string, any> = {};
    for (const row of data ?? []) out[row.key] = row.value;
    return out;
  });

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("settings").select("key,value").eq("is_public", true);
  if (error) throw new Error(error.message);
  const out: Record<string, any> = {};
  for (const row of data ?? []) out[row.key] = row.value;
  return out;
});

export const saveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: Record<string, any> }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================== TAGS ============================== */

export const listTags = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("tags").select("slug,label,description").order("label");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug?: string; label: string; description?: string; original_slug?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const slug = slugify(data.slug || data.label);
    if (!slug) throw new Error("Slug inválido");
    if (data.original_slug) {
      const { error } = await context.supabase
        .from("tags")
        .update({ slug, label: data.label.trim(), description: data.description ?? null })
        .eq("slug", data.original_slug);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("tags")
        .insert({ slug, label: data.label.trim(), description: data.description ?? null });
      if (error) throw new Error(error.message);
    }
    return { slug };
  });

export const deleteTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tags").delete().eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================== PAGES ============================= */

export const listPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("pages")
      .select("id,slug,title,excerpt,published,sort_order,updated_at")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase.from("pages").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const upsertPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      slug: string;
      title: string;
      excerpt?: string;
      content: string;
      meta_description?: string;
      published: boolean;
      sort_order?: number;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      slug: slugify(data.slug || data.title),
      title: data.title,
      excerpt: data.excerpt ?? null,
      content: data.content,
      meta_description: data.meta_description ?? null,
      published: data.published,
      sort_order: data.sort_order ?? 100,
    };
    if (data.id) {
      const { error } = await context.supabase.from("pages").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase.from("pages").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deletePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("pages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================== MEDIA ============================= */

export const listMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { filename: string; contentType: string; base64: string; alt_text?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${Date.now()}-${data.filename.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const buf = Buffer.from(data.base64, "base64");
    const { error } = await supabaseAdmin.storage
      .from("post-images")
      .upload(path, buf, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    const url = `/api/public/post-image/${path}`;
    await context.supabase.from("media").insert({
      path,
      url,
      filename: data.filename,
      content_type: data.contentType,
      size_bytes: buf.length,
      alt_text: data.alt_text ?? null,
    });
    return { url, path };
  });

export const updateMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; alt_text: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("media").update({ alt_text: data.alt_text }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; path: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from("post-images").remove([data.path]);
    const { error } = await context.supabase.from("media").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================ COMMENTS ============================ */

export const listComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("comments")
      .select("*, posts(title,slug)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const moderateComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status?: string; admin_reply?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: any = {};
    if (data.status) patch.status = data.status;
    if (data.admin_reply !== undefined) {
      patch.admin_reply = data.admin_reply;
      patch.replied_at = new Date().toISOString();
    }
    const { error } = await context.supabase.from("comments").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("comments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================= AUTHORS ============================ */

export const listAuthors = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("authors").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      name: string;
      slug?: string;
      role_title?: string;
      bio?: string;
      avatar_url?: string;
      email?: string;
      website?: string;
      socials?: Record<string, string>;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      name: data.name,
      slug: slugify(data.slug || data.name),
      role_title: data.role_title ?? null,
      bio: data.bio ?? null,
      avatar_url: data.avatar_url ?? null,
      email: data.email ?? null,
      website: data.website ?? null,
      socials: data.socials ?? {},
    };
    if (data.id) {
      const { error } = await context.supabase.from("authors").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase.from("authors").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("authors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* =========================== NEWSLETTER =========================== */

export const listSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("newsletter_subscribers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* =========================== DASHBOARD ============================ */

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [posts, cats, tags, comments, views, settings] = await Promise.all([
      sb.from("posts").select("id,title,slug,category,published,published_at,updated_at,excerpt,meta_description,cover_image_url").order("updated_at", { ascending: false }),
      sb.from("categories").select("slug", { count: "exact", head: true }),
      sb.from("tags").select("slug", { count: "exact", head: true }),
      sb.from("comments").select("id,author_name,content,status,created_at,posts(title)").order("created_at", { ascending: false }).limit(5),
      sb.from("post_views").select("post_id,views").order("views", { ascending: false }).limit(5),
      sb.from("settings").select("key,value"),
    ]);
    if (posts.error) throw new Error(posts.error.message);
    const rows = posts.data ?? [];
    const now = Date.now();
    const published = rows.filter((p: any) => p.published && p.published_at && new Date(p.published_at).getTime() <= now);
    const scheduled = rows.filter((p: any) => p.published && p.published_at && new Date(p.published_at).getTime() > now);
    const drafts = rows.filter((p: any) => !p.published);
    const viewsMap = new Map((views.data ?? []).map((v: any) => [v.post_id, v.views]));
    const totalViews = (views.data ?? []).reduce((a: number, v: any) => a + Number(v.views), 0);
    const seoRows = Object.fromEntries((settings.data ?? []).map((s: any) => [s.key, s.value]));

    const checklist = [
      { label: "Descrição do blog preenchida", ok: Boolean(seoRows.general?.description) },
      { label: "Título SEO definido", ok: Boolean(seoRows.seo?.seo_title) },
      { label: "Meta description definida", ok: Boolean(seoRows.seo?.meta_description) },
      { label: "Palavras-chave definidas", ok: Boolean(seoRows.seo?.keywords) },
      { label: "Google Analytics conectado", ok: Boolean(seoRows.integrations?.google_analytics) },
      { label: "Google Search Console verificado", ok: Boolean(seoRows.integrations?.google_search_console) },
      { label: "robots.txt configurado", ok: Boolean(seoRows.seo?.robots_txt) },
      { label: "Sitemap ativo", ok: Boolean(seoRows.seo?.sitemap_enabled) },
      { label: "Todos os artigos com meta description", ok: rows.length > 0 && rows.every((p: any) => p.meta_description) },
      { label: "Todos os artigos com imagem destaque", ok: rows.length > 0 && rows.every((p: any) => p.cover_image_url) },
    ];

    return {
      stats: {
        total: rows.length,
        published: published.length,
        scheduled: scheduled.length,
        drafts: drafts.length,
        views: totalViews,
        categories: cats.count ?? 0,
        tags: tags.count ?? 0,
      },
      recent: rows.slice(0, 6),
      top: (views.data ?? []).map((v: any) => ({
        views: Number(v.views),
        post: rows.find((p: any) => p.id === v.post_id) ?? null,
      })).filter((x: any) => x.post),
      comments: comments.data ?? [],
      activity: rows.slice(0, 8).map((p: any) => ({
        title: p.title,
        at: p.updated_at,
        kind: p.published ? "publicado/atualizado" : "rascunho salvo",
      })),
      checklist,
      _viewsIndexed: viewsMap.size,
    };
  });

/* ============================= BACKUP ============================= */

export const exportAll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [posts, categories, tags, postTags, pages, settings, authors] = await Promise.all([
      sb.from("posts").select("*"),
      sb.from("categories").select("*"),
      sb.from("tags").select("*"),
      sb.from("post_tags").select("*"),
      sb.from("pages").select("*"),
      sb.from("settings").select("*"),
      sb.from("authors").select("*"),
    ]);
    return {
      exported_at: new Date().toISOString(),
      posts: posts.data ?? [],
      categories: categories.data ?? [],
      tags: tags.data ?? [],
      post_tags: postTags.data ?? [],
      pages: pages.data ?? [],
      settings: settings.data ?? [],
      authors: authors.data ?? [],
    };
  });

export const importBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { json: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const parsed = JSON.parse(data.json);
    const sb = context.supabase;
    const counts: Record<string, number> = {};
    if (Array.isArray(parsed.categories) && parsed.categories.length) {
      await sb.from("categories").upsert(parsed.categories, { onConflict: "slug" });
      counts.categories = parsed.categories.length;
    }
    if (Array.isArray(parsed.tags) && parsed.tags.length) {
      await sb.from("tags").upsert(parsed.tags, { onConflict: "slug" });
      counts.tags = parsed.tags.length;
    }
    if (Array.isArray(parsed.authors) && parsed.authors.length) {
      await sb.from("authors").upsert(parsed.authors, { onConflict: "slug" });
      counts.authors = parsed.authors.length;
    }
    if (Array.isArray(parsed.posts) && parsed.posts.length) {
      await sb.from("posts").upsert(parsed.posts, { onConflict: "slug" });
      counts.posts = parsed.posts.length;
    }
    if (Array.isArray(parsed.pages) && parsed.pages.length) {
      await sb.from("pages").upsert(parsed.pages, { onConflict: "slug" });
      counts.pages = parsed.pages.length;
    }
    if (Array.isArray(parsed.settings) && parsed.settings.length) {
      await sb.from("settings").upsert(parsed.settings, { onConflict: "key" });
      counts.settings = parsed.settings.length;
    }
    return counts;
  });
