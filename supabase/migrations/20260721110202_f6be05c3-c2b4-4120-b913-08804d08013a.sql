
-- Rewrite public.posts policies to use direct EXISTS on user_roles instead of has_role()
DROP POLICY IF EXISTS "Admins read all posts" ON public.posts;
DROP POLICY IF EXISTS "Admins insert posts" ON public.posts;
DROP POLICY IF EXISTS "Admins update posts" ON public.posts;
DROP POLICY IF EXISTS "Admins delete posts" ON public.posts;

CREATE POLICY "Admins read all posts" ON public.posts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins insert posts" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins update posts" ON public.posts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins delete posts" ON public.posts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Rewrite storage.objects policies for post-images bucket
DROP POLICY IF EXISTS "Admins upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update post images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete post images" ON storage.objects;
DROP POLICY IF EXISTS "Admins read post images" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload post-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update post-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete post-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins read post-images" ON storage.objects;

CREATE POLICY "Admins upload post-images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins update post-images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'post-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins delete post-images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins read post-images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Revoke EXECUTE on has_role from signed-in users; keep it usable only for service_role/internal
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
