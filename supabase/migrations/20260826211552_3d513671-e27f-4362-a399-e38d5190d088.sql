ALTER VIEW public.public_authors SET (security_invoker = true);
ALTER VIEW public.public_comments SET (security_invoker = true);

-- Column-level grants: anon can never read email columns
REVOKE ALL ON public.authors FROM anon;
REVOKE ALL ON public.comments FROM anon;
GRANT SELECT (id, slug, name, role_title, bio, avatar_url, website, socials, created_at, updated_at)
  ON public.authors TO anon;
GRANT SELECT (id, post_id, author_name, content, admin_reply, replied_at, status, created_at)
  ON public.comments TO anon;
GRANT INSERT (post_id, author_name, author_email, content, status) ON public.comments TO anon;

CREATE POLICY "Public reads author profile rows" ON public.authors
  FOR SELECT TO anon USING (true);
CREATE POLICY "Public reads approved comment rows" ON public.comments
  FOR SELECT TO anon USING (status = 'approved');