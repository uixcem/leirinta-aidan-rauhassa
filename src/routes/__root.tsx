import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import "../i18n";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-birch px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3">Sivua ei löydy</h1>
        <p className="mt-3 text-[15px] text-stone">
          Etsimääsi sivua ei ole tai se on siirretty.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-forest px-5 text-[15px] font-medium text-birch hover:bg-forest-deep"
          >
            Etusivulle
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-birch px-4">
      <div className="max-w-md text-center">
        <h1>Sivu ei latautunut</h1>
        <p className="mt-3 text-[15px] text-stone">
          Jotain meni pieleen. Voit yrittää uudelleen tai palata etusivulle.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-forest px-5 text-[15px] font-medium text-birch hover:bg-forest-deep"
          >
            Yritä uudelleen
          </button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-forest/30 bg-birch px-5 text-[15px] font-medium text-forest hover:bg-birch-deep"
          >
            Etusivulle
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title:
          "Järvenranta Camping — Rantaleirintäalue Oulun kupeessa",
      },
      {
        name: "description",
        content:
          "Rauhallinen rantaleirintäalue matkailuautoille, teltoille ja mökkilomille — 15 minuuttia Oulusta, Rokua Geoparkin porteilla.",
      },
      { name: "author", content: "Järvenranta Camping" },
      { property: "og:title", content: "Järvenranta Camping" },
      {
        property: "og:description",
        content: "Rantaleirintäalue matkalla Lappiin — varaa suoraan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-forest focus:px-4 focus:py-2 focus:text-birch"
      >
        Siirry pääsisältöön
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </QueryClientProvider>
  );
}
