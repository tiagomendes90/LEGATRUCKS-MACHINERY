import { useTranslation } from "react-i18next";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const QuickContactBar = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-orange-500 py-4">
      <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
        <a
          href="tel:+351912406089"
          className="flex items-center gap-2 text-white font-semibold text-lg hover:text-orange-100 transition-colors"
        >
          <Phone className="h-5 w-5" />
          +351 912 406 089
        </a>
        <Button asChild className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-orange-600 rounded-full">
          <Link to="/contactos">
            <MessageCircle className="h-4 w-4 mr-2" />
            {t('home.quickContactCta')}
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default QuickContactBar;