import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url('/lovable-uploads/5e2912d0-c74c-4979-91b4-a8a43d2ac24b.png')`
      }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex items-center justify-center h-full px-6">
        <div className="flex flex-col items-center text-center max-w-4xl">
          {/* Logo — secondary, smaller */}
          <div className="logo-wrapper animate-logo-entry mb-8">
            <img
              src="/logo-hero.png"
              alt="LEGA Trucks & Machinery"
              className="logo-image w-[40vw] md:w-[28vw] max-w-sm object-contain drop-shadow-2xl"
              loading="eager"
              fetchPriority="high"
              width={400}
              height={225}
            />
            <div className="logo-shine-mask" aria-hidden="true" />
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg leading-tight mb-4">
            {t('home.heroHeadline')}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 drop-shadow-md mb-8 max-w-2xl">
            {t('home.heroSub')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg">
              <Link to="/camioes">{t('home.viewStock')}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-6 rounded-xl shadow-lg backdrop-blur-sm">
              <Link to="/contactos">{t('home.requestQuote')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
