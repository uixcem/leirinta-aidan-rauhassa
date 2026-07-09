
CREATE TYPE public.content_section AS ENUM ('pitch','area','review');

CREATE TABLE public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content read all" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_content admin write" ON public.site_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.content_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section public.content_section NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.content_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_cards TO authenticated;
GRANT ALL ON public.content_cards TO service_role;

ALTER TABLE public.content_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_cards read all" ON public.content_cards
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "content_cards admin write" ON public.content_cards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX content_cards_section_sort_idx ON public.content_cards (section, sort_order);

CREATE TRIGGER content_cards_updated_at
  BEFORE UPDATE ON public.content_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default content matching current i18n
INSERT INTO public.site_content (key, value) VALUES
('hero', jsonb_build_object(
  'eyebrow', jsonb_build_object('fi','Leirintäalue · Oulun kupeessa','en','Campsite · 15 min from Oulu'),
  'title',   jsonb_build_object('fi','Järvi. Metsä. Yösi Oulun kupeessa.','en','Lake. Forest. Your night near Oulu.'),
  'sub',     jsonb_build_object('fi','Rauhallinen rantaleirintäalue matkailuautoille, teltoille ja mökkilomille — 15 minuuttia Oulusta, Rokua Geoparkin porteilla.','en','A quiet lakeside campsite for motorhomes, tents and cabin stays — 15 minutes from Oulu, at the gates of Rokua Geopark.'),
  'ctaPrimary',   jsonb_build_object('fi','Tarkista saatavuus','en','Check availability'),
  'ctaSecondary', jsonb_build_object('fi','Katso majoitukset','en','See accommodation'),
  'imageUrl', '',
  'videoUrl', ''
)),
('usp', jsonb_build_object(
  'eyebrow', jsonb_build_object('fi','Miksi Järvenranta','en','Why Järvenranta'),
  'items', jsonb_build_array(
    jsonb_build_object('title',jsonb_build_object('fi','Suora järvinäkymä','en','Direct lake view'),'body',jsonb_build_object('fi','Jokaiselta rantapaikalta näkee järvelle. Oma laituri, uimaranta ja soutuveneitä vieraiden käytössä.','en','Every shoreline pitch faces the water. Private jetty, swimming beach and rowing boats for guests.')),
    jsonb_build_object('title',jsonb_build_object('fi','Sauna ja huoltorakennus','en','Sauna and service building'),'body',jsonb_build_object('fi','Puulämmitteinen rantasauna joka ilta. Uusi huoltorakennus: suihkut, keittiö, pyykinpesu.','en','Wood-heated lakeside sauna nightly. New service building: showers, kitchen, laundry.')),
    jsonb_build_object('title',jsonb_build_object('fi','15 minuuttia Oulusta','en','15 minutes from Oulu'),'body',jsonb_build_object('fi','Nelostien varrella, matkalla Lappiin. Helppo pysähdys yhdeksi yöksi tai koko lomaksi.','en','On the E75 route to Lapland. Easy stop for one night or a full holiday.'))
  )
)),
('brand', jsonb_build_object(
  'name', jsonb_build_object('fi','Järvenranta','en','Järvenranta')
));

-- Seed cards from current i18n
INSERT INTO public.content_cards (section, sort_order, data) VALUES
('pitch', 1, jsonb_build_object(
  'title',jsonb_build_object('fi','Telttapaikka','en','Tent pitch'),
  'body', jsonb_build_object('fi','Pehmeällä sammalpohjalla, männikön suojassa. 40 paikkaa.','en','On soft moss under a pine canopy. 40 pitches.'),
  'price',jsonb_build_object('fi','alk. 22 € / yö','en','from €22 / night'))),
('pitch', 2, jsonb_build_object(
  'title',jsonb_build_object('fi','Matkailuautopaikka','en','Motorhome pitch'),
  'body', jsonb_build_object('fi','Sähköllä (16 A) tai ilman. Grillikatokset ja jätteiden lajittelu vieressä. 24 paikkaa.','en','With (16 A) or without electricity. Grill shelters and recycling nearby. 24 pitches.'),
  'price',jsonb_build_object('fi','alk. 34 € / yö','en','from €34 / night'))),
('pitch', 3, jsonb_build_object(
  'title',jsonb_build_object('fi','Mökit','en','Cabins'),
  'body', jsonb_build_object('fi','Punaiset perinnemökit 2–4 hengelle. Liinavaatteet ja aamiainen lisämaksusta. 6 mökkiä.','en','Traditional red cabins for 2–4 guests. Linens and breakfast optional. 6 cabins.'),
  'price',jsonb_build_object('fi','alk. 85 € / yö','en','from €85 / night'))),
('area', 1, jsonb_build_object(
  'title',jsonb_build_object('fi','Rokua Geopark','en','Rokua Geopark'),
  'body', jsonb_build_object('fi','Unescon geopark 20 min ajomatkan päässä. Merkittyjä vaellusreittejä, dyynijärviä ja koskematonta harjumaisemaa.','en','UNESCO geopark, 20 min drive. Marked hiking trails, dune lakes and untouched esker landscape.'))),
('area', 2, jsonb_build_object(
  'title',jsonb_build_object('fi','Oulujoen melonta','en','Paddling the Oulu river'),
  'body', jsonb_build_object('fi','Vuokraa kanootti tai kajakki rannastamme. Rauhallinen vesialue myös aloittelijoille.','en','Rent a canoe or kayak from our jetty. Calm waters, beginner-friendly.'))),
('area', 3, jsonb_build_object(
  'title',jsonb_build_object('fi','Kalastus','en','Fishing'),
  'body', jsonb_build_object('fi','Ahventa, haukea ja siikaa. Läänin viehekortti myynnissä vastaanotossa.','en','Perch, pike and whitefish. Regional lure permit sold at reception.'))),
('area', 4, jsonb_build_object(
  'title',jsonb_build_object('fi','Marjastus ja sienestys','en','Berries and mushrooms'),
  'body', jsonb_build_object('fi','Mustikka heinäkuun lopulla, puolukka elokuussa, tatit syyskuussa. Karttoja lainaksi.','en','Blueberries late July, lingonberries in August, ceps in September. Foraging maps on loan.'))),
('review', 1, jsonb_build_object(
  'text',jsonb_build_object('fi','Rauhallisin leirintäalue mihin olemme koskaan pysähtyneet. Sauna oli täydellinen matkan jälkeen.','en','The quietest campsite we''ve ever stopped at. The sauna after the drive was perfect.'),
  'name',jsonb_build_object('fi','Anna & Petri, Tampere','en','Anna & Petri, Tampere'),
  'date',jsonb_build_object('fi','elokuu 2025','en','August 2025'))),
('review', 2, jsonb_build_object(
  'text',jsonb_build_object('fi','Ideal stop between Helsinki and Lapland. Very clean facilities and lovely lake view.','en','Ideal stop between Helsinki and Lapland. Very clean facilities and lovely lake view.'),
  'name',jsonb_build_object('fi','Familie Klein, München','en','Familie Klein, München'),
  'date',jsonb_build_object('fi','heinäkuu 2025','en','July 2025'))),
('review', 3, jsonb_build_object(
  'text',jsonb_build_object('fi','Lapset viihtyivät rannalla ja soutuveneillä koko päivän. Palaamme ensi kesänä.','en','The kids spent the whole day on the beach and the rowing boats. We''ll be back next summer.'),
  'name',jsonb_build_object('fi','Perhe Halonen, Kuopio','en','Halonen family, Kuopio'),
  'date',jsonb_build_object('fi','heinäkuu 2025','en','July 2025')));
