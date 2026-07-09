import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/5e2912d0-c74c-4979-91b4-a8a43d2ac24b.png')`,
        }}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex items-center justify-center h-full px-6">
        <div className="flex flex-col items-center text-center">
          {/* SEO H1 — visually hidden, semantic for crawlers */}
          <h1 className="sr-only">LEGA — Camiões, Máquinas Industriais, Tractores, Reboques e Peças em Portugal</h1>
          {/* Logo — primary visual element */}
          <div className="logo-wrapper animate-logo-entry">
            <img
              src="/logo-hero.png"
              alt="LEGA Trucks & Machinery"
              className="logo-image w-[80vw] md:w-[60vw] lg:w-[50vw] max-w-3xl object-contain drop-shadow-2xl"
              loading="eager"
              fetchPriority="high"
              width={800}
              height={450}
            />
            <div className="logo-shine-mask" aria-hidden="true" />
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white text-base md:text-lg px-8 py-6 rounded-xl shadow-lg min-w-[200px]"
            >
              <Link to="/camioes">{t('home.viewStock')}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-white/10 border-2 border-white text-white hover:bg-white hover:text-gray-900 text-base md:text-lg px-8 py-6 rounded-xl shadow-lg backdrop-blur-sm min-w-[200px]"
            >
              <Link to="/contactos">{t('home.requestQuote')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
