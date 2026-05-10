import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Truck, Tractor, Wrench, HandCoins, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

const FeaturesSection = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">{t('home.categoriesSectionTitle')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {[
            { to: "/camioes", icon: <Truck className="h-9 w-9 text-orange-500" />, titleKey: "home.trucksTitle", descKey: "home.trucksDescription" },
            { to: "/maquinas", icon: <Construction className="h-9 w-9 text-orange-500" />, titleKey: "home.machineryTitle", descKey: "home.machineryDescription" },
            { to: "/reboques", icon: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9">
                <rect x="1" y="6" width="15" height="10" rx="1" /><circle cx="6" cy="18" r="2" /><circle cx="12" cy="18" r="2" /><path d="M16 11h5l2 4v3h-7" /><path d="M1 11h15" />
              </svg>
            ), titleKey: "home.trailersTitle", descKey: "home.trailersDescription" },
            { to: "/pecas", icon: <Wrench className="h-9 w-9 text-orange-500" />, titleKey: "home.partsTitle", descKey: "home.partsDescription" },
            { to: "/tractores", icon: <Tractor className="h-9 w-9 text-orange-500" />, titleKey: "home.tractorsTitle", descKey: "home.tractorsDescription" },
            // Hidden temporarily — re-enable later
            // { to: "/contactos", icon: <HandCoins className="h-9 w-9 text-orange-500" />, titleKey: "home.wantToSellTitle", descKey: "home.wantToSellDescription" },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="text-center group cursor-pointer">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 bg-orange-100 group-hover:bg-orange-300 group-hover:scale-110 group-hover:shadow-xl">
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
