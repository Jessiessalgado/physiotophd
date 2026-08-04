ALTER VIEW public.public_authors SET (security_invoker = true);
ALTER VIEW public.public_comments SET (security_invoker = true);

GRANT SELECT (id, slug, name, role_title, bio, avatar_url, website, socials, created_at, updated_at)
ON public.authors TO anon;
GRANT SELECT (id, post_id, author_name, content, status, admin_reply, replied_at, created_at, updated_at)
ON public.comments TO anon;

CREATE POLICY "Public reads author profiles"
ON public.authors
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public reads approved comment content"
ON public.comments
FOR SELECT
TO anon
USING (status = 'approved');