import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Truck, Tractor, Wrench, Construction, Container } from "lucide-react";
import { Button } from "@/components/ui/button";

const iconClass = "h-9 w-9 text-orange-500";

const FeaturesSection = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">{t('home.categoriesSectionTitle')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {[
            { to: "/camioes", icon: <Truck className={iconClass} />, titleKey: "home.trucksTitle", descKey: "home.trucksDescription" },
            { to: "/maquinas", icon: <Construction className={iconClass} strokeWidth={2} />, titleKey: "home.machineryTitle", descKey: "home.machineryDescription" },
            { to: "/pecas", icon: <Wrench className={iconClass} />, titleKey: "home.partsTitle", descKey: "home.partsDescription" },
            { to: "/reboques", icon: <Container className={iconClass} strokeWidth={2} />, titleKey: "home.trailersTitle", descKey: "home.trailersDescription" },
            { to: "/tractores", icon: <Tractor className={iconClass} />, titleKey: "home.tractorsTitle", descKey: "home.tractorsDescription" },
            // Hidden temporarily — re-enable later (was: HandCoins icon → /contactos, "home.wantToSellTitle")
          ].map((item) => (
            <Link key={item.to} to={item.to} className="text-center group cursor-pointer">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-orange-100 transition-all duration-300 ease-out group-hover:bg-orange-200 group-hover:scale-105 group-hover:shadow-lg">
                {item.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-orange-500 transition-colors duration-300">{t(item.titleKey)}</h3>
              <p className="text-gray-600 text-sm">{t(item.descKey)}</p>
              <Button variant="link" className="text-orange-500 mt-2 p-0 h-auto text-sm font-medium">
                {t('common.viewDetails')} →
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
