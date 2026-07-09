import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  adminGetSiteContent,
  adminUpsertSiteContent,
} from "@/lib/content.functions";
import { BilingualField, CmsPageHeader, SaveBar } from "@/components/admin/CmsBits";
import { MediaUpload } from "@/components/admin/MediaUpload";

export const Route = createFileRoute("/_authenticated/admin/sisalto/etusivu")({
  component: HeroEditor,
});

type LangText = { fi?: string; en?: string };
type HeroValue = {
  eyebrow?: LangText;
  title?: LangText;
  sub?: LangText;
  ctaPrimary?: LangText;
  ctaSecondary?: LangText;
  imageUrl?: string;
  videoUrl?: string;
};
type UspItem = { title?: LangText; body?: LangText };
type UspValue = { eyebrow?: LangText; items?: UspItem[] };

function HeroEditor() {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-site-content"],
    queryFn: () => adminGetSiteContent(),
  });

  const [hero, setHero] = useState<HeroValue>({});
  const [usp, setUsp] = useState<UspValue>({ items: [{}, {}, {}] });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setHero((data.hero as HeroValue) ?? {});
    const u = (data.usp as UspValue) ?? {};
    const items = u.items ?? [];
    while (items.length < 3) items.push({});
    setUsp({ eyebrow: u.eyebrow, items });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await adminUpsertSiteContent({ data: { key: "hero", value: hero as Record<string, unknown> } });
      await adminUpsertSiteContent({ data: { key: "usp", value: usp as Record<string, unknown> } });
    },
    onSuccess: () => {
      setMsg(t("cms.saved"));
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin-site-content"] });
      qc.invalidateQueries({ queryKey: ["site-content"] });
      setTimeout(() => setMsg(null), 4000);
    },
    onError: (e: Error) => setErr(e.message || t("cms.error")),
  });

  const setUspItem = (i: number, patch: Partial<UspItem>) => {
    const items = [...(usp.items ?? [])];
    items[i] = { ...items[i], ...patch };
    setUsp({ ...usp, items });
  };

  return (
    <div className="space-y-6">
      <CmsPageHeader title={t("cms.hero.title")} help={t("cms.hero.help")} />

      <MediaUpload
        kind="image"
        accept="image/*"
        label={t("cms.hero.image")}
        value={hero.imageUrl || null}
        onChange={(url) => setHero({ ...hero, imageUrl: url ?? "" })}
      />
      <MediaUpload
        kind="video"
        accept="video/mp4,video/webm"
        label={t("cms.hero.video")}
        hint={t("cms.videoNote")}
        value={hero.videoUrl || null}
        onChange={(url) => setHero({ ...hero, videoUrl: url ?? "" })}
      />

      <BilingualField
        label={t("cms.hero.eyebrow")}
        value={hero.eyebrow}
        onChange={(v) => setHero({ ...hero, eyebrow: v })}
      />
      <BilingualField
        label={t("cms.hero.mainTitle")}
        value={hero.title}
        onChange={(v) => setHero({ ...hero, title: v })}
      />
      <BilingualField
        label={t("cms.hero.sub")}
        multiline
        value={hero.sub}
        onChange={(v) => setHero({ ...hero, sub: v })}
      />
      <BilingualField
        label={t("cms.hero.ctaPrimary")}
        value={hero.ctaPrimary}
        onChange={(v) => setHero({ ...hero, ctaPrimary: v })}
      />
      <BilingualField
        label={t("cms.hero.ctaSecondary")}
        value={hero.ctaSecondary}
        onChange={(v) => setHero({ ...hero, ctaSecondary: v })}
      />

      <div className="mt-10 rounded-xl bg-birch p-4">
        <h3 className="text-forest">Miksi Järvenranta — kolme myyntipistettä</h3>
        <div className="mt-4 space-y-4">
          <BilingualField
            label="Osion pieni otsikko"
            value={usp.eyebrow}
            onChange={(v) => setUsp({ ...usp, eyebrow: v })}
          />
          {(usp.items ?? []).slice(0, 3).map((it, i) => (
            <div key={i} className="rounded-lg border border-forest/10 bg-white p-4">
              <p className="mb-3 text-[14px] font-semibold text-stone">
                Myyntipiste {i + 1}
              </p>
              <div className="space-y-3">
                <BilingualField
                  label={t("cms.cards.title")}
                  value={it.title}
                  onChange={(v) => setUspItem(i, { title: v })}
                />
                <BilingualField
                  label={t("cms.cards.body")}
                  multiline
                  value={it.body}
                  onChange={(v) => setUspItem(i, { body: v })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SaveBar
        onSave={() => save.mutate()}
        saving={save.isPending}
        savedMessage={msg}
        errorMessage={err}
      />
    </div>
  );
}
