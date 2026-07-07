import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { AppButton } from "@/components/ui/AppButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { canLoadHeavyMedia } from "@/lib/connection";
import heroImg from "@/assets/hero-lake.jpg";
import heroVideo from "@/assets/hero-camp.mp4.asset.json";

export function Hero() {
  const { t } = useTranslation("home");
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (canLoadHeavyMedia()) setShowVideo(true);
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-forest text-birch">
      <img
        src={heroImg}
        alt={t("hero.imgAlt")}
        width={1920}
        height={1280}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      {showVideo && (
        <video
          ref={videoRef}
          src={heroVideo.url}
          poster={heroImg}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-forest/40 via-forest/20 to-forest/80"
      />
      <Container className="relative flex min-h-[78vh] flex-col justify-end pb-16 pt-32 sm:min-h-[86vh] sm:pb-24">
        <Eyebrow tone="birch">{t("hero.eyebrow")}</Eyebrow>
        <h1 className="display-xl mt-4 max-w-3xl !text-birch">
          {t("hero.title")}
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-birch/90">
          {t("hero.sub")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <AppButton asChild variant="accent" size="lg">
            <a href="#quick-check">{t("hero.cta.primary")}</a>
          </AppButton>
          <AppButton
            asChild
            size="lg"
            className="border border-birch/40 bg-transparent text-birch hover:bg-birch/10"
          >
            <Link to="/majoitus">{t("hero.cta.secondary")}</Link>
          </AppButton>
        </div>
      </Container>
    </section>
  );
}
