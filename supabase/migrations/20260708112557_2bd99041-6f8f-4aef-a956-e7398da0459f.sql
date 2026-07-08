
-- 1) admin_notes on bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2) company_settings (single-row table, key='default')
CREATE TABLE IF NOT EXISTS public.company_settings (
  id TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT 'Järvenranta Camping',
  address_line TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Suomi',
  business_id TEXT NOT NULL DEFAULT '',
  vat_rate NUMERIC NOT NULL DEFAULT 25.5,
  iban TEXT NOT NULL DEFAULT '',
  bic TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  invoice_prefix TEXT NOT NULL DEFAULT 'JR',
  payment_terms_days INTEGER NOT NULL DEFAULT 14,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage company_settings" ON public.company_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.company_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- 3) admin read policy for bookings (existing ALL manage policy already implies SELECT for admins, but be explicit)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bookings' AND policyname='admins read all bookings') THEN
    CREATE POLICY "admins read all bookings" ON public.bookings
      FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pitch_closures' AND policyname='admins read all closures') THEN
    CREATE POLICY "admins read all closures" ON public.pitch_closures
      FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
