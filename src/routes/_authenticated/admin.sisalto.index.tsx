import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/sisalto/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/sisalto/etusivu" });
  },
});
