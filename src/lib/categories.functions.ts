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

async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles").select("role")
    .eq("user_id", ctx.userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function normalizeSlug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("categories").select("slug,label,sort_order")
    .order("sort_order", { ascending: true }).order("label", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug?: string; label: string; sort_order?: number }) => d)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const slug = normalizeSlug(data.slug || data.label);
    if (!slug) throw new Error("Invalid slug");
    const { error } = await context.supabase.from("categories").insert({
      slug, label: data.label.trim(), sort_order: data.sort_order ?? 100,
    });
    if (error) throw new Error(error.message);
    return { slug };
  });

export const updateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string; new_slug?: string; label?: string; sort_order?: number }) => d)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const patch: Record<string, any> = {};
    if (data.label !== undefined) patch.label = data.label.trim();
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order;
    let finalSlug = data.slug;
    if (data.new_slug && data.new_slug !== data.slug) {
      const ns = normalizeSlug(data.new_slug);
      if (!ns) throw new Error("Invalid slug");
      patch.slug = ns;
      finalSlug = ns;
      // Also update posts referencing the old slug
      const { error: upErr } = await context.supabase
        .from("posts").update({ category: ns }).eq("category", data.slug);
      if (upErr) throw new Error(upErr.message);
    }
    if (Object.keys(patch).length > 0) {
      const { error } = await context.supabase
        .from("categories").update(patch).eq("slug", data.slug);
      if (error) throw new Error(error.message);
    }
    return { slug: finalSlug };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string; reassign_to?: string }) => d)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.reassign_to) {
      const { error: upErr } = await context.supabase
        .from("posts").update({ category: data.reassign_to }).eq("category", data.slug);
      if (upErr) throw new Error(upErr.message);
    }
    const { error } = await context.supabase.from("categories").delete().eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
