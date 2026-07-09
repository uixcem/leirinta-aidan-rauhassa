import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";

async function assertAdmin(ctx: {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  userId: string;
}) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type LangText = { fi?: string; en?: string } | null | undefined;

export type ContentCard = {
  id: string;
  section: "pitch" | "area" | "review";
  sort_order: number;
  is_visible: boolean;
  image_url: string | null;
  data: Json;
};

export type SiteContent = {
  site: Record<string, Json>;
  cards: {
    pitch: ContentCard[];
    area: ContentCard[];
    review: ContentCard[];
  };
};

export const getPublicSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteContent> => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const [sc, cc] = await Promise.all([
      sb.from("site_content").select("key, value"),
      sb
        .from("content_cards")
        .select("id, section, sort_order, is_visible, image_url, data")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true }),
    ]);
    const site: Record<string, Json> = {};
    for (const row of sc.data ?? []) site[row.key] = row.value as Json;
    const cards: SiteContent["cards"] = { pitch: [], area: [], review: [] };
    for (const c of (cc.data ?? []) as ContentCard[]) cards[c.section].push(c);
    return { site, cards };
  },
);

export const adminGetSiteContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Record<string, Json>> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("site_content").select("key, value");
    if (error) throw new Error(error.message);
    const map: Record<string, Json> = {};
    for (const r of data ?? []) map[r.key] = r.value as Json;
    return map;
  });

const jsonRecord = z.record(z.string(), z.unknown());

const upsertContentSchema = z.object({
  key: z.string().min(1).max(80),
  value: jsonRecord,
});

export const adminUpsertSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => upsertContentSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_content")
      .upsert({ key: data.key, value: data.value as Json });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const sectionEnum = z.enum(["pitch", "area", "review"]);

export const adminListCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ section: sectionEnum }).parse(i))
  .handler(async ({ data, context }): Promise<ContentCard[]> => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("content_cards")
      .select("id, section, sort_order, is_visible, image_url, data")
      .eq("section", data.section)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as ContentCard[];
  });

const upsertCardSchema = z.object({
  id: z.string().uuid().optional(),
  section: sectionEnum,
  sort_order: z.number().int().min(0).max(999),
  is_visible: z.boolean(),
  image_url: z.string().max(500).nullable().optional(),
  data: jsonRecord,
});

export const adminUpsertCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => upsertCardSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = {
      ...(data.id ? { id: data.id } : {}),
      section: data.section,
      sort_order: data.sort_order,
      is_visible: data.is_visible,
      image_url: data.image_url ?? null,
      data: data.data as Json,
    };
    const { error } = await context.supabase.from("content_cards").upsert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("content_cards").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
