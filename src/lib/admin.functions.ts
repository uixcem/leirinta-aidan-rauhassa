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

export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("bookings")
      .select(
        "id, booking_reference, check_in, check_out, adults, children, guest_name, guest_email, guest_phone, status, total_price, nights, created_at, pitch:pitches(name, pitch_type)",
      )
      .order("check_in", { ascending: true })
      .limit(500);
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
