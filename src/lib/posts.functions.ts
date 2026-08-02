import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchShim(key) },
  });
}

async function isAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function requireAdmin(ctx: { supabase: any; userId: string }) {
  if (!(await isAdmin(ctx))) throw new Error("Forbidden");
}

// ---------- Public reads ----------
export const listPublishedPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const sb = publicClient();
    const now = new Date().toISOString();
    let q = sb
      .from("posts")
      .select("id,title,slug,excerpt,cover_image_url,category,published_at")
      .eq("published", true)
      .not("published_at", "is", null)
      .lte("published_at", now)
      .order("published_at", { ascending: false });
    if (data.category) q = q.eq("category", data.category);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const now = new Date().toISOString();
    const { data: row, error } = await sb
      .from("posts")
      .select("id,title,slug,excerpt,content,cover_image_url,category,published_at")
      .eq("slug", data.slug)
      .eq("published", true)
      .not("published_at", "is", null)
      .lte("published_at", now)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Admin ----------
export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) === 0) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: context.userId, role: "admin" });
      if (error) throw new Error(error.message);
      return { promoted: true };
    }
    return { promoted: false };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return { isAdmin: await isAdmin(context) };
  });

export const listAllPostsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("posts")
      .select("id,title,slug,category,published,published_at,updated_at,featured,reading_time,seo_score,meta_description,cover_image_url")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPostAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: row, error } = await context.supabase
      .from("posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const { data: tags } = await context.supabase
      .from("post_tags")
      .select("tag_slug")
      .eq("post_id", data.id);
    return { ...(row ?? {}), tags: (tags ?? []).map((t: any) => t.tag_slug) } as any;
  });

export const upsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      title: string;
      slug: string;
      excerpt?: string;
      content: string;
      cover_image_url?: string;
      category: string;
      published: boolean;
      published_at?: string | null;
      meta_description?: string;
      author_id?: string | null;
      featured?: boolean;
      reading_time?: number | null;
      seo_score?: number | null;
      doi?: string;
      references_text?: string;
      tags?: string[];
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    let publishedAt: string | null = null;
    if (data.published) {
      publishedAt = data.published_at ? new Date(data.published_at).toISOString() : new Date().toISOString();
    } else {
      publishedAt = data.published_at ? new Date(data.published_at).toISOString() : null;
    }
    const payload: any = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? null,
      content: data.content,
      cover_image_url: data.cover_image_url ?? null,
      category: data.category,
      published: data.published,
      published_at: publishedAt,
      meta_description: data.meta_description ?? null,
      author_id: data.author_id || null,
      featured: data.featured ?? false,
      reading_time: data.reading_time ?? null,
      seo_score: data.seo_score ?? null,
      doi: data.doi ?? null,
      references_text: data.references_text ?? null,
    };
    let row: any;
    if (data.id) {
      const res = await context.supabase.from("posts").update(payload).eq("id", data.id).select().single();
      if (res.error) throw new Error(res.error.message);
      row = res.data;
    } else {
      const res = await context.supabase.from("posts").insert(payload).select().single();
      if (res.error) throw new Error(res.error.message);
      row = res.data;
    }
    if (data.tags) {
      await context.supabase.from("post_tags").delete().eq("post_id", row.id);
      if (data.tags.length) {
        const { error } = await context.supabase
          .from("post_tags")
          .insert(data.tags.map((t) => ({ post_id: row.id, tag_slug: t })));
        if (error) throw new Error(error.message);
      }
    }
    return row;
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadCoverImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { filename: string; contentType: string; base64: string }) => d)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${Date.now()}-${data.filename.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const buf = Buffer.from(data.base64, "base64");
    const { error } = await supabaseAdmin.storage
      .from("post-images")
      .upload(path, buf, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { url: `/api/public/post-image/${path}`, path };
  });
