# Sisällönhallinta (CMS) admin-paneeliin

Tavoite: sivuston omistaja (60–70 v.) voi muokata sivustolla näkyvät tekstit, kuvat ja hero-videon ilman koodia. Suuret napit, selkeät suomenkieliset otsikot, esikatselu, "Tallenna" -painike joka kertoo mitä tallennettiin.

## Uudet admin-sivut

1. **Etusivu / Hero** (`/admin/sisalto/etusivu`)
   - Otsikko, alaotsikko, "eyebrow"-teksti
   - Hero-kuva (lataa uusi kuva → menee CDN:ään)
   - Hero-video (lataa uusi mp4, valinnainen; tyhjä = ei videota)
   - CTA-painikkeiden tekstit
   - Myyntipisteet (3 kpl): otsikko + kuvaus, järjestettävissä

2. **Majoitukset** (`/admin/sisalto/majoitukset`)
   - Lista kaikista näkyvistä majoituskorteista (teltta / matkailuauto / mökki)
   - Kortti = kuva, otsikko, kuvaus, hinta-teksti, järjestysnumero, näkyvyys päälle/pois
   - Lisää uusi kortti / poista / muokkaa
   - Kuva ladataan samasta paikasta, näytetään pikkukuva

3. **Alue & aktiviteetit** (`/admin/sisalto/alue`)
   - Lista alue-korteista (Rokua, melonta, kalastus, marjastus…)
   - Otsikko + kuvaus + järjestys
   - Lisää / poista / muokkaa

4. **Arvostelut** (`/admin/sisalto/arvostelut`)
   - Kolme arvostelua etusivulla: teksti, nimi, päiväys, näkyvyys
   - Lisää / poista

5. **Yleiset tekstit** (`/admin/sisalto/yleiset`)
   - Brändinimi headerissa
   - Footer: osoite, puhelin, sähköposti, aukioloajat
   - (Nämä täydentävät jo olemassa olevaa `company_settings`-taulua)

## Miten se toimii käyttäjän silmin

- Admin-valikkoon uusi kohta: **"Sisältö sivustolla"** isolla ikonilla.
- Joka sivulla yläreunassa selitys: *"Täältä muokkaat mitä vieraat näkevät etusivulla."*
- Jokainen kenttä on iso, esimerkkitekstin kera. Kuvat ladataan yhdellä painikkeella.
- **Tallenna**-painike alalaidassa, vihreä vahvistus: *"Tallennettu. Muutokset näkyvät sivustolla heti."*
- Yksi peruutuspainike per lomake.

## Tekniset yksityiskohdat

- **Uusi taulu `site_content`**: `key TEXT PRIMARY KEY`, `value JSONB`, `updated_at`. Yksi rivi per lohko (hero, footer, jne.). JSONB pitää sisällään monikieliset tekstit `{fi: "...", en: "..."}`.
- **Uusi taulu `content_cards`**: majoitus/alue/arvostelu -korteille. Sarakkeet: `id`, `section` (enum: `pitch|area|review`), `sort_order`, `is_visible`, `image_url`, `data JSONB` (otsikko/kuvaus/hinta monikielisenä).
- **Kuvien lataus**: uusi Supabase Storage -bucket `site-media` (public read). Admin lataa selaimesta, URL tallennetaan tietokantaan. Hero-video sama bucket, max 30 MB.
- **Julkiset komponentit** (`Hero`, `PitchTeaser`, `AreaHighlights`, `ReviewsStrip`, `Footer`) lukevat sisällön TanStack Queryllä server-fn:stä. Fallback nykyisiin i18n-teksteihin jos tietokanta on tyhjä (ensimmäinen käyttöönotto).
- **Kaksikielisyys**: admin-lomakkeessa kaksi välilehteä "Suomi" / "English" per kenttä. Toisen voi jättää tyhjäksi → fallback suomeen.
- **RLS**: `site_content` ja `content_cards` — kaikille luku, vain adminille kirjoitus. Storage-bucket sama.

## Laajuus & rajaus

Ei tässä vaiheessa:
- Sivujen lisääminen / poistaminen kokonaan (rakenne on kiinteä: Etusivu, Majoitus, Alue, Hinnasto, Saapuminen). Tämä on koodimuutos ja sekoittaisi navigaation ei-teknisen omistajan käsissä. Voidaan lisätä myöhemmin "vapaa sivu" -toiminto jos tarvitaan.
- Rich text editor. Kentät ovat tavallista tekstiä + rivinvaihdot. Muotoilu on suunnittelun vastuulla, jotta sivu pysyy siistinä.
- Versiointi / undo-historia.

Toteutan kaiken tässä työvuorossa: migration → storage-bucket → server-fn:t → 5 admin-sivua → julkisten komponenttien kytkentä tietokantaan → i18n-tekstit adminille.
