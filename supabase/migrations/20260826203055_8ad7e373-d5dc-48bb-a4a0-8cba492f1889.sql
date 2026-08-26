-- AUTHORS: remove anon row access to base table
DROP POLICY IF EXISTS "Public reads non-sensitive author fields" ON public.authors;
REVOKE ALL ON public.authors FROM anon;

-- COMMENTS: remove anon read of base table (keep anon insert of pending comments)
DROP POLICY IF EXISTS "Public reads approved comment text only" ON public.comments;
REVOKE ALL ON public.comments FROM anon;
GRANT INSERT ON public.comments TO anon;

-- Public, email-free views (security definer so anon needs no base table access)
DROP VIEW IF EXISTS public.public_authors;
CREATE VIEW public.public_authors
WITH (security_invoker = false) AS
SELECT id, slug, name, role_title, bio, avatar_url, website, socials, created_at, updated_at
FROM public.authors;

DROP VIEW IF EXISTS public.public_comments;
CREATE VIEW public.public_comments
WITH (security_invoker = false) AS
SELECT id, post_id, author_name, content, admin_reply, replied_at, created_at
FROM public.comments
WHERE status = 'approved';

REVOKE ALL ON public.public_authors FROM anon, authenticated;
REVOKE ALL ON public.public_comments FROM anon, authenticated;
GRANT SELECT ON public.public_authors TO anon, authenticated;
GRANT SELECT ON public.public_comments TO anon, authenticated;

-- POST VIEWS: read-only for the public, writes only via security definer function
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.post_views FROM anon, authenticated;
GRANT SELECT ON public.post_views TO anon, authenticated;
GRANT ALL ON public.post_views TO service_role;