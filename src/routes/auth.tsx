import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Container } from "@/components/ui/Container";
import { Field } from "@/components/ui/Field";
import { AppButton } from "@/components/ui/AppButton";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Kirjaudu — Järvenranta" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
  errorComponent: ({ error, reset }) => (
    <Container className="py-16"><p>{error.message}</p><AppButton onClick={reset}>Retry</AppButton></Container>
  ),
  notFoundComponent: () => <Container className="py-16">Ei löytynyt</Container>,
});

function AuthPage() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(t("signIn.error"));
    else void navigate({ to: "/admin" });
  };

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md rounded-xl border border-forest/15 bg-white p-8 shadow-[var(--shadow-soft)]">
        <h1 className="text-forest">{t("signIn.title")}</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field
            label={t("signIn.email")}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label={t("signIn.password")}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? (
            <p className="rounded-md bg-full/10 p-3 text-[14px] font-medium text-full">{error}</p>
          ) : null}
          <AppButton type="submit" size="lg" disabled={loading} className="w-full">
            {t("signIn.submit")}
          </AppButton>
        </form>
      </div>
    </Container>
  );
}
