import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Truck, Tractor, HandCoins } from "lucide-react";
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

// Excavator arm (side profile): bent boom from base, stick down to bucket
const ExcavatorArmIcon = () => (
  <svg {...lucideSvgProps}>
    {/* boom: from base pivot up to elbow */}
    <path d="M20 20L13 5" />
    {/* stick: from elbow down to bucket pivot */}
    <path d="M13 5L5 17" />
    {/* elbow joint */}
    <circle cx="13" cy="5" r="1" />
    {/* base pin */}
    <circle cx="20" cy="20" r="0.8" />
    {/* bucket */}
    <path d="M5 17c-1.5 1.5 -1 4 1.5 4.5l5 -2.5z" />
  </svg>
);

// Parts icon: shopping cart with two small gears inside
const PartsIcon = () => (
  <svg {...lucideSvgProps}>
    {/* cart frame: handle -> top rail -> right side down to wheel axis */}
    <path d="M2 3h2l2 3M6 6h15l-2 9H8L6 6z" />
    {/* wheels */}
    <circle cx="9" cy="19" r="1.4" />
    <circle cx="17" cy="19" r="1.4" />
    {/* gear 1 inside cart (left) */}
    <circle cx="11" cy="10.5" r="1.6" />
    <path d="M11 8.2v.8M11 12v.8M8.7 10.5h.8M12.5 10.5h.8M9.4 8.9l.55.55M12.05 11.55l.55.55M9.4 12.1l.55-.55M12.05 9.45l.55-.55" />
    {/* gear 2 inside cart (right) */}
    <circle cx="16" cy="11.5" r="1.3" />
    <path d="M16 9.6v.6M16 12.8v.6M14.1 11.5h.6M17.3 11.5h.6M14.75 10.25l.45.45M16.8 12.3l.45.45M14.75 12.75l.45-.45M16.8 10.7l.45-.45" />
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
            { to: "/reboques", icon: <TrailerIcon />, titleKey: "home.trailersTitle", descKey: "home.trailersDescription" },
            { to: "/tractores", icon: <Tractor className={iconClass} />, titleKey: "home.tractorsTitle", descKey: "home.tractorsDescription" },
            { to: "/pecas", icon: <PartsIcon />, titleKey: "home.partsTitle", descKey: "home.partsDescription" },
            { to: "/contactos", icon: <HandCoins className={iconClass} />, titleKey: "home.wantToSellTitle", descKey: "home.wantToSellDescription" },
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
