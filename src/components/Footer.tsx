
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

const Footer = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      toast({
        title: t("footer.consentRequiredTitle"),
        description: t("footer.consentRequired"),
        variant: "destructive",
      });
      return;
    }
    setEmail("");
    setAccepted(false);
    toast({
      title: t("footer.subscribedTitle"),
      description: t("footer.subscribedDesc"),
    });
  };

  return (
    <footer className="text-white bg-orange-500 py-6 px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Company Info with Newsletter */}
          <div>
            <div className="flex items-center mb-3">
              <img
                src="/lovable-uploads/9a1d192d-e9d6-4064-944c-c583427ab323.png"
                alt="LEGA Logo"
                className="h-8 w-auto object-contain"
                loading="lazy"
                width={120}
                height={40}
              />
            </div>
            
            {/* Newsletter Subscription */}
            <div className="mb-3">
              <p className="text-white text-xs mb-2">
                {t('footer.subscribeNewsletter')}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="relative">
                <Input
                  type="email"
                  placeholder={t('footer.enterEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:border-white pr-12 h-9 text-sm"
                  required
                  maxLength={255}
                />
                <button 
                  type="submit" 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200 transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
              <div className="flex items-start gap-2 mt-2">
                <Checkbox
                  id="newsletter-consent"
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(v === true)}
                  className="mt-0.5 border-white data-[state=checked]:bg-white data-[state=checked]:text-orange-500"
                />
                <label
                  htmlFor="newsletter-consent"
                  className="text-white text-[11px] leading-snug cursor-pointer"
                >
                  {t("footer.consentReadAccept")}{" "}
                  <Link to="/privacy" className="underline hover:text-gray-200">
                    {t("footer.privacyPolicy")}
                  </Link>
                </label>
              </div>
            </div>
            
            {/* Social Media Icons */}
            <div className="flex space-x-2">
              <a
                href="https://wa.me/351123456789"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm transition-transform duration-300 hover:scale-110 cursor-pointer"
              >
                <svg className="h-5 w-5 fill-[#25D366]" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488" />
                </svg>
              </a>

              <a
                href="https://facebook.com/lega"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm transition-transform duration-300 hover:scale-110 cursor-pointer"
              >
                <svg className="h-5 w-5 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              <a
                href="https://instagram.com/lega"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm transition-transform duration-300 hover:scale-110 cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="igFooter" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F9CE34" />
                      <stop offset="50%" stopColor="#EE2A7B" />
                      <stop offset="100%" stopColor="#6228D7" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#igFooter)" d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.069 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.069c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.775.13 4.602.396 3.635 1.363 2.668 2.33 2.402 3.503 2.344 4.78 2.286 6.06 2.272 6.469 2.272 12s.014 5.94.072 7.22c.058 1.277.324 2.45 1.291 3.417.967.967 2.14 1.233 3.417 1.291 1.28.058 1.689.072 7.22.072s5.94-.014 7.22-.072c1.277-.058 2.45-.324 3.417-1.291.967-.967 1.233-2.14 1.291-3.417.058-1.28.072-1.689.072-7.22s-.014-5.94-.072-7.22c-.058-1.277-.324-2.45-1.291-3.417C21.45.396 20.277.13 19 .072 17.72.014 17.311 0 12 0z" />
                  <path fill="url(#igFooter)" d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8z" />
                  <circle fill="url(#igFooter)" cx="18.406" cy="5.594" r="1.44" />
                </svg>
              </a>
            </div>
          </div>

          {/* Info Links */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-white uppercase tracking-wide">{t('footer.info')}</h3>
            <Separator className="bg-white/30 mb-3" />
            <ul className="space-y-1.5 text-sm">
  <li>
    <Link to="/terms" className="text-white hover:text-gray-200 transition-colors">
      {t('footer.termsOfService')}
    </Link>
  </li>

  <li>
    <Link to="/privacy" className="text-white hover:text-gray-200 transition-colors">
      {t('footer.privacyPolicy')}
    </Link>
  </li>

  <li>
    <Link to="/admin" className="text-white hover:text-gray-200 transition-colors">
      {t('footer.admin')}
    </Link>
  </li>
</ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-white uppercase tracking-wide">{t('footer.contact')}</h3>
            <Separator className="bg-white/30 mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-white">
                <Phone className="h-4 w-4" />
                <span className="font-normal text-white">+351 912 406 089</span>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <Mail className="h-4 w-4" />
                <span className="text-white">info@lega.pt</span>
              </div>
              <div className="flex items-start space-x-2 text-white">
                <MapPin className="h-4 w-4 mt-1 shrink-0" />
                <span className="text-white whitespace-pre-line text-xs leading-snug">
                  {"Av. Dr. António Palha Nº25\n5º DIR FRT 4715-009\nBraga, Portugal"}
                </span> 
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-white uppercase tracking-wide">{t('footer.location')}</h3>
            <Separator className="bg-white/30 mb-3" />
            <div className="w-full h-24 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-5 w-5 text-white mx-auto mb-1" />
                <p className="text-white text-xs leading-snug">
  Av. Dr. António Palha 25<br />
  4715-009 Braga, Portugal
</p>
                <a
  href="https://www.google.com/maps/search/?api=1&query=Av.+Dr.+Ant%C3%B3nio+Palha+25+Braga+Portugal"
  target="_blank"
  rel="noopener noreferrer"
  className="text-white underline text-xs"
>
  {t('footer.viewOnGoogleMaps')}
</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-4 pt-3 text-center">
          <p className="text-white text-xs">© 2026 Lega. {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
