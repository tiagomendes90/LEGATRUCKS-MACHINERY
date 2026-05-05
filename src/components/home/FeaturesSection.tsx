import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Truck, Tractor, Wrench, HandCoins } from "lucide-react";

const FeaturesSection = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-[120px]">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {[
            { to: "/camioes", icon: <Truck className="h-9 w-9 text-orange-500" />, titleKey: "home.trucksTitle", descKey: "home.trucksDescription" },
            { to: "/maquinas", icon: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9">
                <path d="M1 20h22" /><path d="M6 20V8l4-4h4l4 4v12" /><path d="M2 20l4-8" /><path d="M22 20l-4-8" /><rect x="9" y="12" width="6" height="4" rx="1" />
              </svg>
            ), titleKey: "home.machineryTitle", descKey: "home.machineryDescription" },
            { to: "/reboques", icon: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9">
                <rect x="1" y="6" width="15" height="10" rx="1" /><circle cx="6" cy="18" r="2" /><circle cx="12" cy="18" r="2" /><path d="M16 11h5l2 4v3h-7" /><path d="M1 11h15" />
              </svg>
            ), titleKey: "home.trailersTitle", descKey: "home.trailersDescription" },
            { to: "/pecas", icon: <Wrench className="h-9 w-9 text-orange-500" />, titleKey: "home.partsTitle", descKey: "home.partsDescription" },
            { to: "/tractores", icon: <Tractor className="h-9 w-9 text-orange-500" />, titleKey: "home.tractorsTitle", descKey: "home.tractorsDescription" },
            { to: "/contactos", icon: <HandCoins className="h-9 w-9 text-orange-500" />, titleKey: "home.wantToSellTitle", descKey: "home.wantToSellDescription" },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="text-center group cursor-pointer">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 bg-orange-100 group-hover:bg-orange-300 group-hover:scale-110 group-hover:shadow-xl">
                {item.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-orange-500 transition-colors duration-300">{t(item.titleKey)}</h3>
              <p className="text-gray-600 text-sm">{t(item.descKey)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
