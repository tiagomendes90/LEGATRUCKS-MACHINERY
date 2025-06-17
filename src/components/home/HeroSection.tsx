
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url('/lovable-uploads/5e2912d0-c74c-4979-91b4-a8a43d2ac24b.png')`
      }}>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="container mx-auto px-6 text-center text-white">
          <h1 className="text-5xl mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent font-extrabold md:text-6xl lg:text-7xl">
            Trucks & Machinery
          </h1>
          <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto md:text-2xl">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg">
              {t('common.contact')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
