
-- Enums
CREATE TYPE public.pitch_type AS ENUM ('tent', 'motorhome', 'caravan', 'cabin');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled');
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- updated_at trigger fn (shared)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ user_roles ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ pitches ============
CREATE TABLE public.pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pitch_type public.pitch_type NOT NULL,
  capacity INT NOT NULL DEFAULT 2 CHECK (capacity > 0),
  price_per_night NUMERIC(8,2) NOT NULL CHECK (price_per_night >= 0),
  has_electricity BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pitches TO anon, authenticated;
GRANT ALL ON public.pitches TO service_role;
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads active pitches" ON public.pitches
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admins read all pitches" ON public.pitches
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage pitches" ON public.pitches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_pitches_updated_at BEFORE UPDATE ON public.pitches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ pitch_closures ============
CREATE TABLE public.pitch_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id UUID NOT NULL REFERENCES public.pitches(id) ON DELETE CASCADE,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_on > starts_on)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_closures TO authenticated;
GRANT ALL ON public.pitch_closures TO service_role;
ALTER TABLE public.pitch_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage closures" ON public.pitch_closures
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ bookings ============
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE,
  pitch_id UUID NOT NULL REFERENCES public.pitches(id) ON DELETE RESTRICT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INT NOT NULL DEFAULT 1 CHECK (adults >= 1),
  children INT NOT NULL DEFAULT 0 CHECK (children >= 0),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  vehicle_plate TEXT,
  special_requests TEXT,
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  nights INT NOT NULL CHECK (nights >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);
CREATE INDEX bookings_pitch_dates_idx ON public.bookings(pitch_id, check_in, check_out) WHERE status <> 'cancelled';
CREATE INDEX bookings_ref_email_idx ON public.bookings(booking_reference, guest_email);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Anon writes go through a server function using service role; no anon policy.
CREATE POLICY "admins manage bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ availability RPC ============
CREATE OR REPLACE FUNCTION public.check_pitch_availability(
  _check_in DATE, _check_out DATE, _pitch_type public.pitch_type DEFAULT NULL
)
RETURNS TABLE (
  pitch_id UUID, name TEXT, pitch_type public.pitch_type,
  capacity INT, price_per_night NUMERIC, has_electricity BOOLEAN, description TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.pitch_type, p.capacity, p.price_per_night, p.has_electricity, p.description
  FROM public.pitches p
  WHERE p.is_active = true
    AND (_pitch_type IS NULL OR p.pitch_type = _pitch_type)
    AND _check_in >= CURRENT_DATE
    AND _check_out > _check_in
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.pitch_id = p.id
        AND b.status <> 'cancelled'
        AND b.check_in < _check_out
        AND b.check_out > _check_in
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.pitch_closures c
      WHERE c.pitch_id = p.id
        AND c.starts_on < _check_out
        AND c.ends_on > _check_in
    )
  ORDER BY p.pitch_type, p.sort_order, p.name;
$$;

GRANT EXECUTE ON FUNCTION public.check_pitch_availability(DATE, DATE, public.pitch_type) TO anon, authenticated;

-- ============ booking reference generator ============
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE ref TEXT; tries INT := 0;
BEGIN
  LOOP
    ref := 'JR-' || to_char(now(), 'YYMMDD') || '-' || lpad((floor(random()*1000000))::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE booking_reference = ref);
    tries := tries + 1;
    IF tries > 10 THEN RAISE EXCEPTION 'Cannot generate booking reference'; END IF;
  END LOOP;
  RETURN ref;
END; $$;

-- ============ seed pitches ============
INSERT INTO public.pitches (name, pitch_type, capacity, price_per_night, has_electricity, description, sort_order) VALUES
  ('Telttapaikka 1 — Männikkö', 'tent', 4, 22, false, 'Pehmeällä sammalpohjalla, männikön suojassa.', 1),
  ('Telttapaikka 2 — Rantametsä', 'tent', 4, 24, false, 'Lähempänä rantaa, aamuvarjossa.', 2),
  ('Telttapaikka 3 — Koivikko', 'tent', 4, 22, false, 'Avoin koivikkoinen paikka.', 3),
  ('Matkailuautopaikka A1 — sähkö', 'motorhome', 4, 38, true, '16 A sähköliitäntä, tasoitettu.', 1),
  ('Matkailuautopaikka A2 — sähkö', 'motorhome', 4, 38, true, '16 A sähköliitäntä, järvinäköala.', 2),
  ('Matkailuautopaikka B1', 'motorhome', 4, 34, false, 'Ilman sähköä, luonnonläheinen.', 3),
  ('Matkailuvaunupaikka C1 — sähkö', 'caravan', 4, 36, true, '16 A sähköliitäntä.', 1),
  ('Matkailuvaunupaikka C2 — sähkö', 'caravan', 4, 36, true, '16 A sähköliitäntä, lähellä huoltoa.', 2),
  ('Mökki Punatulkku', 'cabin', 4, 95, true, '2 makuuhuonetta, tupakeittiö, terassi järvelle.', 1),
  ('Mökki Peippo', 'cabin', 4, 95, true, '2 makuuhuonetta, tupakeittiö.', 2),
  ('Mökki Västäräkki', 'cabin', 2, 85, true, 'Yksi makuuhuone, romanttinen rantamökki.', 3);
