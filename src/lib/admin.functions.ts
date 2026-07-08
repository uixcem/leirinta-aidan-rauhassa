import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  userId: string;
}) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ─────────────────────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────────────────────

export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("bookings")
      .select(
        "id, booking_reference, check_in, check_out, adults, children, guest_name, guest_email, guest_phone, vehicle_plate, special_requests, admin_notes, status, total_price, nights, created_at, pitch:pitches(id, name, pitch_type, price_per_night)",
      )
      .order("check_in", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "checked_in", "completed", "cancelled"]),
});

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const notesSchema = z.object({
  id: z.string().uuid(),
  admin_notes: z.string().trim().max(2000),
});

export const updateBookingNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => notesSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("bookings")
      // @ts-expect-error admin_notes not yet in generated types
      .update({ admin_notes: data.admin_notes })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────
// Dashboard stats
// ─────────────────────────────────────────────────────────────

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const today = toISO(new Date());
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartIso = toISO(monthStart);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const in30Iso = toISO(in30);

    const [arrivalsQ, departuresQ, currentlyQ, upcomingQ, monthRevenueQ, activePitchesQ] =
      await Promise.all([
        context.supabase
          .from("bookings")
          .select("id, guest_name, booking_reference, pitch:pitches(name)", { count: "exact" })
          .eq("check_in", today)
          .neq("status", "cancelled"),
        context.supabase
          .from("bookings")
          .select("id, guest_name, booking_reference, pitch:pitches(name)", { count: "exact" })
          .eq("check_out", today)
          .neq("status", "cancelled"),
        context.supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .lte("check_in", today)
          .gt("check_out", today)
          .neq("status", "cancelled"),
        context.supabase
          .from("bookings")
          .select(
            "id, booking_reference, guest_name, check_in, check_out, total_price, pitch:pitches(name, pitch_type)",
          )
          .gte("check_in", today)
          .lte("check_in", in30Iso)
          .neq("status", "cancelled")
          .order("check_in", { ascending: true })
          .limit(10),
        context.supabase
          .from("bookings")
          .select("total_price, nights, check_in")
          .gte("check_in", monthStartIso)
          .neq("status", "cancelled"),
        context.supabase.from("pitches").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

    const revenue = (monthRevenueQ.data ?? []).reduce(
      (sum, b) => sum + Number(b.total_price ?? 0),
      0,
    );
    const bookedNights = (monthRevenueQ.data ?? []).reduce(
      (sum, b) => sum + Number(b.nights ?? 0),
      0,
    );
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const capacityNights = (activePitchesQ.count ?? 0) * daysInMonth;
    const occupancy = capacityNights > 0 ? Math.round((bookedNights / capacityNights) * 100) : 0;

    return {
      today,
      arrivalsToday: arrivalsQ.data ?? [],
      departuresToday: departuresQ.data ?? [],
      currentlyStaying: currentlyQ.count ?? 0,
      upcoming: upcomingQ.data ?? [],
      revenueMonth: revenue,
      occupancyMonth: occupancy,
      activePitches: activePitchesQ.count ?? 0,
    };
  });

// ─────────────────────────────────────────────────────────────
// Pitches CRUD
// ─────────────────────────────────────────────────────────────

export const listAllPitches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("pitches")
      .select("*")
      .order("pitch_type")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const upsertPitchSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  pitch_type: z.enum(["tent", "motorhome", "caravan", "cabin"]),
  capacity: z.number().int().min(1).max(20),
  price_per_night: z.number().min(0).max(9999),
  has_electricity: z.boolean(),
  description: z.string().trim().max(500).optional().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

export const upsertPitch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertPitchSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("pitches").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const deletePitchSchema = z.object({ id: z.string().uuid() });

export const deletePitch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deletePitchSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Safety: don't delete if bookings exist — mark inactive instead
    const { count } = await context.supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("pitch_id", data.id);
    if ((count ?? 0) > 0) {
      const { error } = await context.supabase
        .from("pitches")
        .update({ is_active: false })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, softDeleted: true };
    }
    const { error } = await context.supabase.from("pitches").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, softDeleted: false };
  });

// ─────────────────────────────────────────────────────────────
// Closures
// ─────────────────────────────────────────────────────────────

export const listClosures = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("pitch_closures")
      .select("id, pitch_id, starts_on, ends_on, reason, pitch:pitches(name)")
      .order("starts_on", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const closureSchema = z.object({
  pitch_id: z.string().uuid(),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(200).optional().nullable(),
});

export const createClosure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => closureSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.ends_on <= data.starts_on) throw new Error("Invalid range");
    const { error } = await context.supabase.from("pitch_closures").insert({
      pitch_id: data.pitch_id,
      starts_on: data.starts_on,
      ends_on: data.ends_on,
      reason: data.reason || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const deleteClosureSchema = z.object({ id: z.string().uuid() });

export const deleteClosure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteClosureSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("pitch_closures").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────
// Calendar grid — one month × all pitches
// ─────────────────────────────────────────────────────────────

const calendarSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const getCalendarMonth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => calendarSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const [y, m] = data.month.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    const startIso = toISO(start);
    const endIso = toISO(end);

    const [pitchesQ, bookingsQ, closuresQ] = await Promise.all([
      context.supabase
        .from("pitches")
        .select("id, name, pitch_type, sort_order")
        .eq("is_active", true)
        .order("pitch_type")
        .order("sort_order"),
      context.supabase
        .from("bookings")
        .select("id, pitch_id, check_in, check_out, guest_name, booking_reference, status")
        .lt("check_in", endIso)
        .gt("check_out", startIso)
        .neq("status", "cancelled"),
      context.supabase
        .from("pitch_closures")
        .select("id, pitch_id, starts_on, ends_on, reason")
        .lt("starts_on", endIso)
        .gt("ends_on", startIso),
    ]);
    if (pitchesQ.error) throw new Error(pitchesQ.error.message);
    if (bookingsQ.error) throw new Error(bookingsQ.error.message);
    if (closuresQ.error) throw new Error(closuresQ.error.message);

    return {
      startIso,
      endIso,
      daysInMonth: new Date(y, m, 0).getDate(),
      pitches: pitchesQ.data ?? [],
      bookings: bookingsQ.data ?? [],
      closures: closuresQ.data ?? [],
    };
  });

// ─────────────────────────────────────────────────────────────
// Company settings
// ─────────────────────────────────────────────────────────────

export const getCompanySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("company_settings" as never)
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as {
      id: string;
      company_name: string;
      address_line: string;
      postal_code: string;
      city: string;
      country: string;
      business_id: string;
      vat_rate: number;
      iban: string;
      bic: string;
      phone: string;
      email: string;
      website: string;
      invoice_prefix: string;
      payment_terms_days: number;
    } | null;
  });

const companySchema = z.object({
  company_name: z.string().trim().min(1).max(200),
  address_line: z.string().trim().max(200),
  postal_code: z.string().trim().max(20),
  city: z.string().trim().max(80),
  country: z.string().trim().max(80),
  business_id: z.string().trim().max(40),
  vat_rate: z.number().min(0).max(100),
  iban: z.string().trim().max(50),
  bic: z.string().trim().max(20),
  phone: z.string().trim().max(40),
  email: z.string().trim().max(200),
  website: z.string().trim().max(200),
  invoice_prefix: z.string().trim().min(1).max(10),
  payment_terms_days: z.number().int().min(0).max(120),
});

export const saveCompanySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("company_settings" as never)
      .update(data as never)
      .eq("id", "default");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────
// Invoice PDF
// ─────────────────────────────────────────────────────────────

const invoiceSchema = z.object({ id: z.string().uuid() });

export const getInvoicePdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => invoiceSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const [{ data: booking, error: be }, { data: company, error: ce }] = await Promise.all([
      context.supabase
        .from("bookings")
        .select(
          "booking_reference, check_in, check_out, adults, children, guest_name, guest_email, guest_phone, vehicle_plate, total_price, nights, created_at, pitch:pitches(name, pitch_type)",
        )
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase.from("company_settings" as never).select("*").eq("id", "default").maybeSingle(),
    ]);
    if (be) throw new Error(be.message);
    if (ce) throw new Error(ce.message);
    if (!booking) throw new Error("Booking not found");

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    const co = (company ?? {
      company_name: "Järvenranta Camping",
      address_line: "",
      postal_code: "",
      city: "",
      country: "Suomi",
      business_id: "",
      vat_rate: 14,
      iban: "",
      bic: "",
      phone: "",
      email: "",
      website: "",
      invoice_prefix: "JR",
      payment_terms_days: 14,
    }) as {
      company_name: string;
      address_line: string;
      postal_code: string;
      city: string;
      country: string;
      business_id: string;
      vat_rate: number;
      iban: string;
      bic: string;
      phone: string;
      email: string;
      website: string;
      invoice_prefix: string;
      payment_terms_days: number;
    };

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.09, 0.14, 0.13);
    const muted = rgb(0.45, 0.47, 0.45);
    const accent = rgb(0.13, 0.32, 0.24);

    const M = 50;
    let y = 800;

    // Header
    page.drawText(co.company_name || "Camping", { x: M, y, size: 20, font: bold, color: accent });
    y -= 22;
    const addr = [co.address_line, `${co.postal_code} ${co.city}`.trim(), co.country]
      .filter(Boolean)
      .join(" · ");
    if (addr) {
      page.drawText(addr, { x: M, y, size: 9, font, color: muted });
      y -= 12;
    }
    const contact = [co.phone, co.email, co.website].filter(Boolean).join(" · ");
    if (contact) {
      page.drawText(contact, { x: M, y, size: 9, font, color: muted });
      y -= 12;
    }
    if (co.business_id) {
      page.drawText(`Y-tunnus: ${co.business_id}`, { x: M, y, size: 9, font, color: muted });
      y -= 12;
    }

    // Invoice title block right
    const invoiceNo = `${co.invoice_prefix || "JR"}-${booking.booking_reference.replace(/^JR-/, "")}`;
    const invoiceDate = new Date().toISOString().slice(0, 10);
    const due = new Date();
    due.setDate(due.getDate() + (co.payment_terms_days || 14));
    const dueDate = due.toISOString().slice(0, 10);

    page.drawText("LASKU / INVOICE", { x: 380, y: 800, size: 16, font: bold, color: ink });
    page.drawText(`Nro:  ${invoiceNo}`, { x: 380, y: 780, size: 10, font, color: ink });
    page.drawText(`Pvm:  ${invoiceDate}`, { x: 380, y: 766, size: 10, font, color: ink });
    page.drawText(`Eräpv: ${dueDate}`, { x: 380, y: 752, size: 10, font, color: ink });
    page.drawText(`Varaus: ${booking.booking_reference}`, {
      x: 380,
      y: 738,
      size: 10,
      font,
      color: muted,
    });

    // Guest block
    y = 720;
    page.drawText("Laskutus / Bill to", { x: M, y, size: 9, font: bold, color: muted });
    y -= 14;
    page.drawText(booking.guest_name, { x: M, y, size: 12, font: bold, color: ink });
    y -= 14;
    page.drawText(booking.guest_email, { x: M, y, size: 10, font, color: ink });
    y -= 12;
    page.drawText(booking.guest_phone, { x: M, y, size: 10, font, color: ink });

    // Line items header
    y = 640;
    page.drawRectangle({ x: M, y: y - 4, width: 495, height: 22, color: rgb(0.94, 0.95, 0.93) });
    page.drawText("Kuvaus", { x: M + 8, y: y + 4, size: 10, font: bold, color: ink });
    page.drawText("Yöt", { x: 340, y: y + 4, size: 10, font: bold, color: ink });
    page.drawText("à hinta", { x: 400, y: y + 4, size: 10, font: bold, color: ink });
    page.drawText("Yhteensä", { x: 490, y: y + 4, size: 10, font: bold, color: ink });
    y -= 26;

    const pitchName = booking.pitch?.name ?? "Paikka";
    const pitchType = booking.pitch?.pitch_type ?? "";
    const desc = `${pitchName} (${pitchType}) · ${booking.check_in} → ${booking.check_out}`;
    const unit = Number(booking.total_price) / Number(booking.nights);
    page.drawText(desc, { x: M + 8, y, size: 10, font, color: ink });
    page.drawText(String(booking.nights), { x: 340, y, size: 10, font, color: ink });
    page.drawText(`${unit.toFixed(2)} €`, { x: 400, y, size: 10, font, color: ink });
    page.drawText(`${Number(booking.total_price).toFixed(2)} €`, {
      x: 490,
      y,
      size: 10,
      font,
      color: ink,
    });

    // Totals with VAT
    const total = Number(booking.total_price);
    const vatRate = Number(co.vat_rate) || 0;
    const net = total / (1 + vatRate / 100);
    const vat = total - net;

    y -= 30;
    page.drawLine({
      start: { x: 340, y: y + 8 },
      end: { x: 545, y: y + 8 },
      thickness: 0.5,
      color: muted,
    });
    page.drawText("Veroton", { x: 340, y, size: 10, font, color: muted });
    page.drawText(`${net.toFixed(2)} €`, { x: 490, y, size: 10, font, color: ink });
    y -= 14;
    page.drawText(`ALV ${vatRate.toFixed(1).replace(/\.0$/, "")}%`, {
      x: 340,
      y,
      size: 10,
      font,
      color: muted,
    });
    page.drawText(`${vat.toFixed(2)} €`, { x: 490, y, size: 10, font, color: ink });
    y -= 16;
    page.drawText("Yhteensä", { x: 340, y, size: 12, font: bold, color: ink });
    page.drawText(`${total.toFixed(2)} €`, { x: 490, y, size: 12, font: bold, color: accent });

    // Payment block
    y -= 60;
    page.drawText("Maksutiedot", { x: M, y, size: 10, font: bold, color: ink });
    y -= 14;
    if (co.iban) {
      page.drawText(`IBAN: ${co.iban}`, { x: M, y, size: 10, font, color: ink });
      y -= 12;
    }
    if (co.bic) {
      page.drawText(`BIC: ${co.bic}`, { x: M, y, size: 10, font, color: ink });
      y -= 12;
    }
    page.drawText(`Viite: ${booking.booking_reference}`, { x: M, y, size: 10, font, color: ink });
    y -= 12;
    page.drawText(`Eräpäivä: ${dueDate}`, { x: M, y, size: 10, font, color: ink });

    page.drawText("Kiitos varauksestasi! · Thank you for your booking!", {
      x: M,
      y: 50,
      size: 9,
      font,
      color: muted,
    });

    const bytes = await pdf.save();
    // base64 encode
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    return { base64, filename: `${invoiceNo}.pdf` };
  });
