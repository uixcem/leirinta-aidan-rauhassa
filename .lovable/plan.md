# Faz 3 — Varaus järjestelmä + Admin

## Kapsam
"Hae" butonu → gerçek saatavuus kontrolü → paikka seçimi → misafir bilgileri → varaus onayı (paikan päällä maksu). Campsite sahibi için admin panel.

## Kullanıcı akışı (misafir)

```text
Etusivu  ──Hae──▶  /varaa (tulokset)
                    │
                    ├─ Uygun paikat listesi (tip + hinta + kapasite)
                    ├─ Boş ise: alternatif tarih önerisi
                    └─ Valitse ──▶ /varaa/vahvistus
                                    ├─ Nimi, email, puhelin, rekisterinumero (auto)
                                    ├─ Erikoistoiveet (vapaa teksti)
                                    └─ Vahvista ──▶ /varaa/kiitos (varausnumero + email)
```

## Admin akışı

```text
/admin/kirjaudu  ──▶  /admin (dashboard)
                        ├─ Tänään saapuvat / lähtevät
                        ├─ Varaukset (lista + haku + tila)
                        ├─ Paikat (CRUD: nimi, tyyppi, kapasiteetti, hinta, sesonki)
                        └─ Sulkemiset (huoltopäivät / lomat)
```

## Veritabanı (Lovable Cloud)

- `pitches` — id, tyyppi (tent/motorhome/caravan/cabin), nimi, kapasiteetti, hinta_per_yo, sähkö, aktiivinen
- `bookings` — id, varausnumero, pitch_id, check_in, check_out, aikuiset, lapset, nimi, email, puhelin, rekisterinumero, erikoistoiveet, tila (pending/confirmed/checked_in/completed/cancelled), kokonaishinta
- `pitch_closures` — pitch_id, alkaa, päättyy, syy (huolto, oma käyttö)
- `user_roles` — auth.users linkli, `app_role` enum (admin, staff) — güvenli role kontrolü için

Saatavuus mantığı: bir paikka boş jos `NOT EXISTS` çakışan aktif varaus veya sulkeminen (check-out günü serbest — o gün başka biri check-in yapabilir).

## Yetkilendirme

- Misafir varausu → **kirjautumatta** yapılabilir (leirintäalue standardi; email + puhelin yeterli). Anonim RLS insert, yalnızca `bookings` tablosuna sıkı doğrulama ile.
- Admin → email/parola + Google sign-in. `user_roles` içinde `admin` rolü olan görür.

## Sayfalar

- `/varaa` — sonuçlar (public loader, server fn ile saatavuus sorgusu)
- `/varaa/vahvistus` — misafir formu (zod validasyon)
- `/varaa/kiitos` — varausnumero + yazdırılabilir özet
- `/admin/kirjaudu` — auth
- `/_authenticated/admin` — dashboard + varaukset + paikat + sulkemiset

## Teknik detaylar (devs için)

- Server functions: `searchAvailability`, `createBooking`, `getBooking`, admin-side `listBookings`, `updateBookingStatus`, `upsertPitch`, `createClosure`
- Public read-only saatavuus için narrow `anon SELECT` policy `pitches`'te
- `bookings` `anon INSERT` (rate limit + zod), `SELECT` yalnızca `has_role('admin')` veya varausnumero + email eşleşen public server fn üzerinden
- Varausnumerosu: `JR-YYMMDD-XXXX` (6 rakamlı random)
- Email onayı: şimdilik başlangıç transactional email scaffold (Resend), gerçek gönderim domain onayı sonrası
- i18n: fi + en her yeni sayfa için

## Faz 3 dışı (sonraki)
- Kortilla ennakkomaksu (Stripe) — istenirse Faz 4
- Guest hesabı / self-service iptal — Faz 4
- Otomatik email onayı (domain onayı sonrası aktif)

## Onay
Bu planı onayla ki başlayabilirim; migration önce, sonra kullanıcı akışı sayfaları, en son admin paneli — her aşamada dur + özet.
