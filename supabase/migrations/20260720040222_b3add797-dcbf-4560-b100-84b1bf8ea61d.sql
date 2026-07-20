
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image_url text,
  category text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads published posts" ON public.posts;
DROP POLICY IF EXISTS "Admins read all posts" ON public.posts;
DROP POLICY IF EXISTS "Admins insert posts" ON public.posts;
DROP POLICY IF EXISTS "Admins update posts" ON public.posts;
DROP POLICY IF EXISTS "Admins delete posts" ON public.posts;
CREATE POLICY "Anyone reads published posts" ON public.posts FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins read all posts" ON public.posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update posts" ON public.posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete posts" ON public.posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS posts_category_idx ON public.posts (category);
CREATE INDEX IF NOT EXISTS posts_published_idx ON public.posts (published, published_at DESC);

CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS posts_set_updated_at ON public.posts;
CREATE TRIGGER posts_set_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP POLICY IF EXISTS "Admins upload post-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update post-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete post-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins read post-images" ON storage.objects;
CREATE POLICY "Admins upload post-images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update post-images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete post-images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read post-images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));
