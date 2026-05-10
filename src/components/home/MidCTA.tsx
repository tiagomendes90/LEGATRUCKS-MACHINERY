import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const WhatsAppIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.83 11.83 0 0 0 5.64 1.43h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.43ZM12.05 21.4h-.01a9.55 9.55 0 0 1-4.87-1.33l-.35-.21-3.8 1 1.02-3.7-.23-.38a9.56 9.56 0 1 1 17.74-5 9.56 9.56 0 0 1-9.5 9.62Zm5.24-7.16c-.29-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.74.94-.91 1.13-.17.19-.34.21-.62.07-.29-.14-1.21-.45-2.3-1.42-.85-.76-1.42-1.7-1.59-1.99-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.39 0 1.41 1.02 2.78 1.17 2.97.14.19 2.02 3.08 4.89 4.31.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.33Z"/>
  </svg>
);

const MidCTA = () => {
  const { t } = useTranslation();
  const whatsappUrl = `https://wa.me/351912406089?text=${encodeURIComponent(t('whatsapp.message'))}`;

  return (
    <section className="py-20 bg-orange-50">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold mb-3">{t('home.midCtaTitle')}</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">{t('home.midCtaSubtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 rounded-xl">
            <Link to="/contactos">{t('home.requestQuote')}</Link>
          </Button>
          <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-white px-8 rounded-xl">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-5 w-5 mr-2" />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MidCTA;