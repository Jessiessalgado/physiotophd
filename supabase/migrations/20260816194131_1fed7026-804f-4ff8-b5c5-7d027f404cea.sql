-- Views must respect caller permissions (no SECURITY DEFINER views)
DROP VIEW IF EXISTS public.public_authors;
CREATE VIEW public.public_authors
WITH (security_invoker = true) AS
SELECT id, slug, name, role_title, bio, avatar_url, website, socials, created_at, updated_at
FROM public.authors;

DROP VIEW IF EXISTS public.public_comments;
CREATE VIEW public.public_comments
WITH (security_invoker = true) AS
SELECT id, post_id, author_name, content, admin_reply, replied_at, created_at
FROM public.comments
WHERE status = 'approved';

GRANT SELECT ON public.public_authors TO anon, authenticated;
GRANT SELECT ON public.public_comments TO anon, authenticated;

-- Column-level grants: anon can never read email columns
REVOKE ALL ON public.authors FROM anon;
GRANT SELECT (id, slug, name, role_title, bio, avatar_url, website, socials, created_at, updated_at)
  ON public.authors TO anon;

REVOKE ALL ON public.comments FROM anon;
GRANT SELECT (id, post_id, author_name, content, admin_reply, replied_at, created_at, status)
  ON public.comments TO anon;
GRANT INSERT (post_id, author_name, author_email, content, status) ON public.comments TO anon;

-- Row policies (columns already restricted by grants above)
DROP POLICY IF EXISTS "Public reads author profiles" ON public.authors;
CREATE POLICY "Public reads non-sensitive author fields" ON public.authors
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public reads approved comment content" ON public.comments;
CREATE POLICY "Public reads approved comment text only" ON public.comments
  FOR SELECT TO anon USING (status = 'approved');