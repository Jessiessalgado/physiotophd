-- =========================
-- TAGS
-- =========================
CREATE TABLE public.tags (
  slug text PRIMARY KEY,
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads tags" ON public.tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins update tags" ON public.tags FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins delete tags" ON public.tags FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE TRIGGER tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.post_tags (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_slug text NOT NULL REFERENCES public.tags(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (post_id, tag_slug)
);
GRANT SELECT ON public.post_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tags TO authenticated;
GRANT ALL ON public.post_tags TO service_role;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads post_tags" ON public.post_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write post_tags" ON public.post_tags FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- =========================
-- AUTHORS
-- =========================
CREATE TABLE public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  role_title text,
  bio text,
  avatar_url text,
  email text,
  website text,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.authors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authors TO authenticated;
GRANT ALL ON public.authors TO service_role;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads authors" ON public.authors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write authors" ON public.authors FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE TRIGGER authors_updated_at BEFORE UPDATE ON public.authors FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- PAGES
-- =========================
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL DEFAULT '',
  meta_description text,
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published pages" ON public.pages FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins read all pages" ON public.pages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins write pages" ON public.pages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- MEDIA
-- =========================
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  url text NOT NULL,
  filename text NOT NULL,
  content_type text,
  size_bytes integer,
  alt_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read media" ON public.media FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins write media" ON public.media FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE TRIGGER media_updated_at BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- COMMENTS
-- =========================
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads approved comments" ON public.comments FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Admins read all comments" ON public.comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Anyone submits pending comments" ON public.comments FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' AND admin_reply IS NULL);
CREATE POLICY "Admins update comments" ON public.comments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins delete comments" ON public.comments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- NEWSLETTER
-- =========================
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  source text,
  status text NOT NULL DEFAULT 'subscribed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone subscribes" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (status = 'subscribed');
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins update subscribers" ON public.newsletter_subscribers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins delete subscribers" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE TRIGGER newsletter_updated_at BEFORE UPDATE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- SETTINGS
-- =========================
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads public settings" ON public.settings FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "Admins read all settings" ON public.settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins write settings" ON public.settings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================
-- POST VIEWS
-- =========================
CREATE TABLE public.post_views (
  post_id uuid PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
  views bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.post_views TO anon;
GRANT SELECT ON public.post_views TO authenticated;
GRANT ALL ON public.post_views TO service_role;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads post views" ON public.post_views FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.increment_post_view(_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.post_views (post_id, views, updated_at)
  VALUES (_post_id, 1, now())
  ON CONFLICT (post_id) DO UPDATE SET views = public.post_views.views + 1, updated_at = now();
$$;
REVOKE EXECUTE ON FUNCTION public.increment_post_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_post_view(uuid) TO service_role;

-- =========================
-- POSTS: new columns
-- =========================
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reading_time integer,
  ADD COLUMN IF NOT EXISTS seo_score integer,
  ADD COLUMN IF NOT EXISTS doi text,
  ADD COLUMN IF NOT EXISTS references_text text;

-- =========================
-- SEED
-- =========================
INSERT INTO public.categories (slug, label, sort_order) VALUES
  ('neurorreabilitacao','Neurorreabilitação',10),
  ('realidade-virtual','Realidade Virtual',20),
  ('robotica','Robótica',30),
  ('ia-na-saude','IA na Saúde',40),
  ('wearables','Wearables',50),
  ('biomecanica','Biomecânica',60),
  ('tecnologias-assistivas','Tecnologias Assistivas',70),
  ('pesquisa-cientifica','Pesquisa Científica',80),
  ('meta-analises','Meta-análises',90),
  ('revisoes-sistematicas','Revisões Sistemáticas',100),
  ('controle-motor','Controle Motor',110),
  ('aprendizagem-motora','Aprendizagem Motora',120),
  ('reabilitacao-pediatrica','Reabilitação Pediátrica',130),
  ('cardiorrespiratoria','Cardiorrespiratória',140),
  ('ortopedia','Ortopedia',150),
  ('dor','Dor',160)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (slug, label) VALUES
  ('avc','AVC'),('lesao-medular','Lesão Medular'),('paralisia-cerebral','Paralisia Cerebral'),
  ('parkinson','Parkinson'),('esclerose-multipla','Esclerose Múltipla'),('marcha','Marcha'),
  ('equilibrio','Equilíbrio'),('exoesqueleto','Exoesqueleto'),('biofeedback','Biofeedback'),
  ('eletroterapia','Eletroterapia'),('telerreabilitacao','Telerreabilitação'),('gamificacao','Gamificação'),
  ('machine-learning','Machine Learning'),('sensores-inerciais','Sensores Inerciais'),
  ('analise-de-movimento','Análise de Movimento'),('evidencia-cientifica','Evidência Científica'),
  ('ensaio-clinico','Ensaio Clínico'),('reabilitacao-funcional','Reabilitação Funcional'),
  ('neuroplasticidade','Neuroplasticidade'),('dor-cronica','Dor Crônica')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.authors (slug, name, role_title, bio, email) VALUES
  ('jessica-salgado','Jessica Salgado','Physiotherapist, MSc — PhD Candidate',
   'Fisioterapeuta com foco em neurorreabilitação e tecnologias aplicadas à reabilitação funcional. Pesquisa realidade virtual, robótica e IA na recuperação motora.',
   NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pages (slug, title, excerpt, content, published, sort_order) VALUES
  ('sobre','Sobre','Autoridade acadêmica e clínica por trás do Physio to PhD.','<h2>Sobre a autora</h2><p>Escreva aqui sua formação, linhas de pesquisa e atuação clínica.</p>',false,10),
  ('contato','Contato','Fale com a equipe do Physio to PhD.','<h2>Contato</h2><p>Email, redes sociais e formulário de contato.</p>',false,20),
  ('politica-de-privacidade','Política de Privacidade','Como tratamos seus dados (LGPD/GDPR).','<h2>Política de Privacidade</h2><p>Descreva a coleta, uso e retenção de dados.</p>',false,30),
  ('politica-editorial','Política Editorial','Critérios de seleção e revisão de conteúdo.','<h2>Política Editorial</h2><p>Descreva o processo editorial e as fontes utilizadas.</p>',false,40),
  ('cookies','Cookies','Uso de cookies e tecnologias similares.','<h2>Política de Cookies</h2><p>Descreva os cookies utilizados.</p>',false,50),
  ('isencao-medica','Isenção de Responsabilidade Médica','Este conteúdo não substitui avaliação profissional.','<h2>Isenção de Responsabilidade Médica</h2><p>O conteúdo deste site tem finalidade informativa e educacional e não substitui avaliação, diagnóstico ou tratamento realizado por profissional de saúde habilitado.</p>',false,60),
  ('como-citar','Como citar','Referencie corretamente os conteúdos deste blog.','<h2>Como citar</h2><p>SALGADO, J. Título do artigo. Physio to PhD, ano. Disponível em: URL. Acesso em: data.</p>',false,70)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.settings (key, value, is_public) VALUES
  ('general', jsonb_build_object(
    'site_name','Physio to PhD',
    'tagline','Evidence-Based Physiotherapy and Rehabilitation Technology',
    'description','Fisioterapia baseada em evidências e tecnologias na reabilitação: robótica, realidade virtual, biofeedback, eletroterapia avançada e IA aplicada à reabilitação funcional.',
    'language','pt-BR',
    'timezone','America/Sao_Paulo',
    'url','https://physiotophd.lovable.app',
    'logo_url','','favicon_url','',
    'author','Jessica Salgado','email','',
    'socials', jsonb_build_object('instagram','','linkedin','','x','','youtube','','researchgate','','lattes','')
  ), true),
  ('seo', jsonb_build_object(
    'seo_title','Physio to PhD | Evidence-Based Physiotherapy and Rehabilitation Technology',
    'meta_description','Fisioterapia baseada em evidências e tecnologias na reabilitação: robótica, realidade virtual, biofeedback, eletroterapia avançada e IA aplicada à reabilitação funcional.',
    'keywords','fisioterapia baseada em evidências, neurorreabilitação, realidade virtual, robótica, biofeedback, wearables, IA na saúde, telerreabilitação, eletroterapia, exoesqueleto, reabilitação funcional, análise de movimento',
    'og_title','','og_description','','og_image','',
    'twitter_card','summary_large_image','twitter_site','',
    'canonical','','schema_type','Blog',
    'robots','index, follow','robots_header','index, follow',
    'robots_txt','User-agent: *'||chr(10)||'Allow: /'||chr(10),
    'ads_txt','',
    'sitemap_enabled',true,'rss_enabled',true
  ), true),
  ('integrations', jsonb_build_object(
    'google_analytics','','google_search_console','','google_tag_manager','','google_adsense',''
  ), true),
  ('theme', jsonb_build_object(
    'primary','#1E3A8A','accent','#06B6D4','background','#FFFFFF','foreground','#0F172A',
    'muted','#F1F5F9','border','#E2E8F0',
    'font_heading','Sora','font_body','Inter','font_display','Dancing Script',
    'radius','16px','button_radius','999px','card_radius','20px',
    'shadow','0 10px 30px rgba(15,23,42,.08)','spacing','1rem','dark_mode',false
  ), true),
  ('layout', jsonb_build_object(
    'hero_title','Bridging Physiotherapy and Technology',
    'hero_subtitle','','hero_image','','banner','',
    'show_newsletter',true,'newsletter_title','Newsletter para profissionais e estudantes',
    'show_sidebar',true,'sidebar_widgets', jsonb_build_array('about','popular','categories','newsletter'),
    'cards_per_row',3,'home_sections', jsonb_build_array('hero','research','articles','author'),
    'menu', jsonb_build_array(),'footer_text','© Physio to PhD'
  ), true),
  ('newsletter', jsonb_build_object(
    'provider','none','list_id','','form_action','','double_optin',true
  ), false)
ON CONFLICT (key) DO NOTHING;