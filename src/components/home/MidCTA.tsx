import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const MidCTA = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-orange-50">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold mb-3">{t('home.midCtaTitle')}</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">{t('home.midCtaSubtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 rounded-xl">
            <Link to="/contactos">{t('home.requestQuote')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-8 rounded-xl">
            <Link to="/contactos">{t('home.contactUs')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MidCTA;