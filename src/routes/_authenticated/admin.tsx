import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { AppButton } from "@/components/ui/AppButton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Ylläpito — Järvenranta" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
  errorComponent: ({ error, reset }) => (
    <Container className="py-16">
      <p className="text-full">{error.message}</p>
      <AppButton onClick={reset}>Retry</AppButton>
    </Container>
  ),
  notFoundComponent: () => <Container className="py-16">Ei löytynyt</Container>,
});

const TABS: ReadonlyArray<{ to: string; label: string; exact?: boolean }> = [
  { to: "/admin", label: "nav.dashboard", exact: true },
  { to: "/admin/varaukset", label: "nav.bookings" },
  { to: "/admin/kalenteri", label: "nav.calendar" },
  { to: "/admin/paikat", label: "nav.pitches" },
  { to: "/admin/sulkemiset", label: "nav.closures" },
  { to: "/admin/asetukset", label: "nav.settings" },
];

function AdminLayout() {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-birch-deep/30">
      <div className="border-b border-forest/10 bg-white">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <p className="eyebrow">{t("dashboard.title")}</p>
            <h1 className="text-[22px] leading-none text-forest">Järvenranta</h1>
          </div>
          <AppButton variant="ghost" onClick={signOut}>
            {t("dashboard.signOut")}
          </AppButton>
        </Container>
        <Container className="flex gap-1 overflow-x-auto pb-2 pt-1">
          {TABS.map((tab) => {
            const active = tab.exact ? path === tab.to : path.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "shrink-0 rounded-md px-4 py-2 text-[14px] font-medium transition-colors",
                  active
                    ? "bg-forest text-white"
                    : "text-stone hover:bg-birch hover:text-forest",
                )}
              >
                {t(tab.label)}
              </Link>
            );
          })}
        </Container>
      </div>
      <Container className="py-8">
        <Outlet />
      </Container>
    </div>
  );
}
