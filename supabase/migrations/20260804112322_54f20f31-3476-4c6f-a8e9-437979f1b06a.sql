REVOKE SELECT ON public.authors FROM anon;
REVOKE SELECT ON public.comments FROM anon;

DROP POLICY IF EXISTS "Anyone reads authors" ON public.authors;
DROP POLICY IF EXISTS "Anyone reads approved comments" ON public.comments;

CREATE OR REPLACE VIEW public.public_authors
WITH (security_barrier = true)
AS
SELECT
  id,
  slug,
  name,
  role_title,
  bio,
  avatar_url,
  website,
  socials,
  created_at,
  updated_at
FROM public.authors;

CREATE OR REPLACE VIEW public.public_comments
WITH (security_barrier = true)
AS
SELECT
  id,
  post_id,
  author_name,
  content,
  admin_reply,
  replied_at,
  created_at,
  updated_at
FROM public.comments
WHERE status = 'approved';

REVOKE ALL ON public.public_authors FROM PUBLIC;
REVOKE ALL ON public.public_comments FROM PUBLIC;
GRANT SELECT ON public.public_authors TO anon, authenticated;
GRANT SELECT ON public.public_comments TO anon, authenticated;
GRANT ALL ON public.public_authors TO service_role;
GRANT ALL ON public.public_comments TO service_role;