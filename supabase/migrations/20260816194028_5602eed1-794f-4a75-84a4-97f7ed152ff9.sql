-- 1. Remove anon access to base tables containing emails
DROP POLICY IF EXISTS "Public reads author profiles" ON public.authors;
DROP POLICY IF EXISTS "Public reads approved comment content" ON public.comments;
REVOKE ALL ON public.authors FROM anon;
REVOKE ALL ON public.comments FROM anon;

-- 2. Public views without email columns (definer-style so anon can read them)
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

GRANT SELECT ON public.public_authors TO anon, authenticated;
GRANT SELECT ON public.public_comments TO anon, authenticated;

-- 3. Newsletter insert hardening
ALTER TABLE public.newsletter_subscribers
  DROP CONSTRAINT IF EXISTS newsletter_email_format_chk;
ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_email_format_chk
  CHECK (
    length(email) BETWEEN 5 AND 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND (name IS NULL OR length(name) <= 120)
    AND (source IS NULL OR length(source) <= 60)
  );

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key
  ON public.newsletter_subscribers (lower(email));

DROP POLICY IF EXISTS "Anyone subscribes" ON public.newsletter_subscribers;
CREATE POLICY "Anyone subscribes" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'subscribed'
    AND email = lower(btrim(email))
    AND length(email) BETWEEN 5 AND 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND (name IS NULL OR length(btrim(name)) BETWEEN 1 AND 120)
    AND (source IS NULL OR length(source) <= 60)
  );