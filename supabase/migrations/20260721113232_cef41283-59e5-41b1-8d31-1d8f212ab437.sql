
CREATE TABLE public.categories (
  slug text PRIMARY KEY,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins insert categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins update categories" ON public.categories
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins delete categories" ON public.categories
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.categories (slug, label, sort_order) VALUES
  ('neurorehabilitation', 'Neurorehabilitation', 10),
  ('virtual-reality', 'Virtual Reality', 20),
  ('biomechanics', 'Biomechanics', 30),
  ('wearable-technology', 'Wearable Technology', 40),
  ('robotics', 'Robotics & Automation', 50),
  ('motor-learning', 'Motor Learning', 60),
  ('pediatric-rehabilitation', 'Pediatric Rehabilitation', 70),
  ('digital-health', 'Digital Health', 80)
ON CONFLICT (slug) DO NOTHING;
