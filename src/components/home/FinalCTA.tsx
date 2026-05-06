import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FinalCTA = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold mb-3">{t('home.finalCtaTitle')}</h2>
        <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">{t('home.finalCtaSubtitle')}</p>
        <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-6 text-lg rounded-xl shadow-lg">
          <Link to="/contactos">{t('home.contactUs')}</Link>
        </Button>
      </div>
    </section>
  );
};

export default FinalCTA;