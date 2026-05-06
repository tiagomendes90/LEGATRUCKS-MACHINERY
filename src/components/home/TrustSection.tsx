import { useTranslation } from "react-i18next";
import { Package, Globe, Shield, Zap } from "lucide-react";

const TrustSection = () => {
  const { t } = useTranslation();

  const items = [
    { icon: <Package className="h-8 w-8 text-orange-500" />, text: t('home.trustWideRange') },
    { icon: <Globe className="h-8 w-8 text-orange-500" />, text: t('home.trustDelivery') },
    { icon: <Shield className="h-8 w-8 text-orange-500" />, text: t('home.trustTrusted') },
    { icon: <Zap className="h-8 w-8 text-orange-500" />, text: t('home.trustSupport') },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-10">{t('home.trustTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3 p-6 rounded-xl bg-white shadow-sm">
              {item.icon}
              <p className="font-medium text-base">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;