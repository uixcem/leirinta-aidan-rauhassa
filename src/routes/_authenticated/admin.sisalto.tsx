import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/sisalto")({
  head: () => ({
    meta: [{ title: "Sisältö — Ylläpito" }, { name: "robots", content: "noindex" }],
  }),
  component: CmsLayout,
});

const SUBS = [
  { to: "/admin/sisalto/etusivu", label: "cms.nav.hero" },
  { to: "/admin/sisalto/majoitukset", label: "cms.nav.pitches" },
  { to: "/admin/sisalto/alue", label: "cms.nav.area" },
  { to: "/admin/sisalto/arvostelut", label: "cms.nav.reviews" },
  { to: "/admin/sisalto/yleiset", label: "cms.nav.general" },
] as const;

function CmsLayout() {
  const { t } = useTranslation("admin");
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div>
      <div className="mb-6 rounded-xl border border-forest/10 bg-birch p-6">
        <h1 className="text-forest">{t("cms.title")}</h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-ink/85">{t("cms.intro")}</p>
      </div>
      <nav aria-label={t("cms.title")} className="mb-6 flex flex-wrap gap-2">
        {SUBS.map((s) => {
          const active = path.startsWith(s.to);
          return (
            <Link
              key={s.to}
              to={s.to}
              className={cn(
                "min-h-11 rounded-full px-5 text-[15px] font-medium transition-colors",
                active
                  ? "bg-forest text-birch"
                  : "bg-white text-stone border border-forest/15 hover:bg-birch-deep hover:text-forest",
              )}
            >
              {t(s.label)}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
