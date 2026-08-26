-- 1) Remove public direct reads of base tables (they contain emails)
DROP POLICY IF EXISTS "Public reads author profile rows" ON public.authors;
DROP POLICY IF EXISTS "Public reads approved comment rows" ON public.comments;
REVOKE ALL ON public.authors FROM anon;
REVOKE ALL ON public.comments FROM anon;
GRANT INSERT ON public.comments TO anon; -- public comment submission still allowed

-- 2) Public reads go through email-free views
ALTER VIEW public.public_authors SET (security_invoker = false);
ALTER VIEW public.public_comments SET (security_invoker = false);
GRANT SELECT ON public.public_authors TO anon, authenticated;
GRANT SELECT ON public.public_comments TO anon, authenticated;

-- 3) Validate contact messages
ALTER TABLE public.contact_messages
  DROP CONSTRAINT IF EXISTS contact_messages_name_valid,
  DROP CONSTRAINT IF EXISTS contact_messages_email_valid,
  DROP CONSTRAINT IF EXISTS contact_messages_message_valid;

ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_name_valid CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  ADD CONSTRAINT contact_messages_email_valid CHECK (char_length(email) <= 200 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT contact_messages_message_valid CHECK (char_length(btrim(message)) BETWEEN 5 AND 5000);

DROP POLICY IF EXISTS "Anyone can send a contact message" ON public.contact_messages;
CREATE POLICY "Anyone can send a contact message"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND char_length(btrim(name)) BETWEEN 2 AND 120
  AND char_length(email) <= 200
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(btrim(message)) BETWEEN 5 AND 5000
);