import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const STAY_TYPES = ["tent", "motorhome", "caravan", "cabin"] as const;

function serverClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const searchSchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stayType: z.enum(STAY_TYPES).optional(),
});

export const searchAvailability = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => searchSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { data: rows, error } = await supabase.rpc("check_pitch_availability", {
      _check_in: data.checkIn,
      _check_out: data.checkOut,
      _pitch_type: data.stayType,
    });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const createSchema = z.object({
  pitchId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(12),
  children: z.number().int().min(0).max(10),
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email().max(255),
  guestPhone: z.string().trim().min(5).max(40),
  vehiclePlate: z.string().trim().max(20).optional().nullable(),
  specialRequests: z.string().trim().max(1000).optional().nullable(),
});

function nightsBetween(a: string, b: string) {
  const ms = new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.round(ms / 86400000);
}

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data }) => {
    const nights = nightsBetween(data.checkIn, data.checkOut);
    if (nights < 1) throw new Error("Invalid dates");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Re-check availability atomically
    const { data: avail, error: aErr } = await supabaseAdmin.rpc(
      "check_pitch_availability",
      { _check_in: data.checkIn, _check_out: data.checkOut, _pitch_type: undefined },
    );
    if (aErr) throw new Error(aErr.message);
    const pitch = (avail ?? []).find((p) => p.pitch_id === data.pitchId);
    if (!pitch) throw new Error("PITCH_UNAVAILABLE");

    const totalPrice = Number(pitch.price_per_night) * nights;

    const { data: refRow, error: refErr } = await supabaseAdmin.rpc(
      "generate_booking_reference",
    );
    if (refErr) throw new Error(refErr.message);
    const bookingReference = refRow as unknown as string;

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_reference: bookingReference,
        pitch_id: data.pitchId,
        check_in: data.checkIn,
        check_out: data.checkOut,
        adults: data.adults,
        children: data.children,
        guest_name: data.guestName,
        guest_email: data.guestEmail.toLowerCase(),
        guest_phone: data.guestPhone,
        vehicle_plate: data.vehiclePlate || null,
        special_requests: data.specialRequests || null,
        status: "confirmed",
        total_price: totalPrice,
        nights,
      })
      .select("booking_reference, guest_email")
      .single();

    if (insErr) throw new Error(insErr.message);
    return {
      bookingReference: inserted.booking_reference,
      totalPrice,
      nights,
      pitchName: pitch.name,
    };
  });

const lookupSchema = z.object({
  reference: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(255),
});

export const getBookingByReference = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => lookupSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("bookings")
      .select(
        "booking_reference, check_in, check_out, adults, children, guest_name, guest_email, guest_phone, status, total_price, nights, pitch:pitches(name, pitch_type)",
      )
      .eq("booking_reference", data.reference)
      .eq("guest_email", data.email.toLowerCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
