import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import CamioesIcon from "@/components/icons/CamioesIcon";
import CarrinhasIcon from "@/components/icons/CarrinhasIcon";
import MaquinasIcon from "@/components/icons/MaquinasIcon";
import PecasIcon from "@/components/icons/PecasIcon";
import ReboquesIcon from "@/components/icons/ReboquesIcon";
import TractoresIcon from "@/components/icons/TractoresIcon";
import VenderIcon from "@/components/icons/VenderIcon";

const iconClass = "h-6 w-12 text-lega-blue";

const FeaturesSection = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">{t('home.categoriesSectionTitle')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {[
            { to: "/camioes", icon: <CamioesIcon className={iconClass} />, titleKey: "home.trucksTitle", descKey: "home.trucksDescription" },
            { to: "/categoria/vans", icon: <CarrinhasIcon className={iconClass} />, titleKey: "home.vansTitle", descKey: "home.vansDescription" },
            { to: "/maquinas", icon: <MaquinasIcon className={iconClass} />, titleKey: "home.machineryTitle", descKey: "home.machineryDescription" },
            { to: "/reboques", icon: <ReboquesIcon className={iconClass} />, titleKey: "home.trailersTitle", descKey: "home.trailersDescription" },
            { to: "/tractores", icon: <TractoresIcon className={iconClass} />, titleKey: "home.tractorsTitle", descKey: "home.tractorsDescription" },
            { to: "/pecas", icon: <PecasIcon className={iconClass} />, titleKey: "home.partsTitle", descKey: "home.partsDescription" },
            { to: "/contactos", icon: <VenderIcon className={iconClass} />, titleKey: "home.wantToSellTitle", descKey: "home.wantToSellDescription" },
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
