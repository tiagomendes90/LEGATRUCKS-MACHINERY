import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Truck, Tractor, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const iconClass = "h-9 w-9 text-orange-500";

const lucideSvgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: iconClass,
};

// Minimal excavator arm (side profile): boom + stick + bucket — fills viewBox
const ExcavatorArmIcon = () => (
  <svg {...lucideSvgProps}>
    {/* boom from pivot up to elbow */}
    <path d="M3 21L13 4" />
    {/* stick from elbow down to bucket pin */}
    <path d="M13 4l8 9" />
    {/* bucket */}
    <path d="M21 13l-2 7h-7l2-6z" />
  </svg>
);

// Minimal trailer (side profile): towed trailer with drawbar + hitch ball
const TrailerIcon = () => (
  <svg {...lucideSvgProps}>
    {/* trailer body */}
    <path d="M7 6h15v11H7z" />
    {/* drawbar to hitch */}
    <path d="M7 11L2 17" />
    {/* hitch coupler */}
    <circle cx="2" cy="18" r="1.2" />
    {/* wheels */}
    <circle cx="12" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
  </svg>
);

const FeaturesSection = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">{t('home.categoriesSectionTitle')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {[
            { to: "/camioes", icon: <Truck className={iconClass} />, titleKey: "home.trucksTitle", descKey: "home.trucksDescription" },
            { to: "/maquinas", icon: <ExcavatorArmIcon />, titleKey: "home.machineryTitle", descKey: "home.machineryDescription" },
            { to: "/pecas", icon: <Wrench className={iconClass} />, titleKey: "home.partsTitle", descKey: "home.partsDescription" },
            { to: "/reboques", icon: <TrailerIcon />, titleKey: "home.trailersTitle", descKey: "home.trailersDescription" },
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
