
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter subscription for:", email);
    // Add newsletter subscription logic here
    setEmail("");
  };

  return (
    <footer className="text-white bg-orange-500 py-12 px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info with Newsletter */}
          <div>
            <div className="flex items-center mb-6">
              <img 
                src="/lovable-uploads/1a81f82c-9a4f-4f4f-8f58-da6ed2f213dc.png" 
                alt="LEGA Logo" 
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            
            {/* Newsletter Subscription */}
            <div className="mb-6">
              <p className="text-white text-sm mb-3">
                {t('footer.subscribeNewsletter')}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="relative">
                <Input
                  type="email"
                  placeholder={t('footer.enterEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:border-white pr-12"
                  required
                />
                <button 
                  type="submit" 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200 transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            </div>
            
            {/* Social Media Icons */}
            <div className="flex space-x-4">
              <a href="https://wa.me/351123456789" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200 transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488" />
                </svg>
              </a>
              
              <a href="https://facebook.com/lega" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200 transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              
              <a href="https://instagram.com/lega" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200 transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C8.396 0 7.952.01 6.684.048 5.417.085 4.598.22 3.896.42c-.73.198-1.348.46-1.963.976-.615.515-.866 1.125-1.064 1.853C.668 3.9.533 4.718.496 5.982.458 7.25.448 7.694.448 11.315c0 3.622.01 4.066.048 5.334.037 1.263.172 2.082.372 2.782.198.73.46 1.348.976 1.963.515.615 1.125.866 1.853 1.064.7.2 1.519.335 2.782.372 1.268.038 1.712.048 5.334.048 3.621 0 4.065-.01 5.333-.048 1.263-.037 2.081-.172 2.782-.372.73-.198 1.348-.46 1.963-.976.615-.515.866-1.125 1.064-1.853.2-.7.335-1.519.372-2.782.038-1.268.048-1.712.048-5.334 0-3.621-.01-4.065-.048-5.333-.037-1.263-.172-2.082-.372-2.782-.198-.73-.46-1.348-.976-1.963C22.794.978 22.184.727 21.456.529 20.756.329 19.938.194 18.675.157 17.407.119 16.963.109 13.342.109l-1.325.9zM12.017 2.892c3.573 0 3.99.01 5.4.048 1.3.06 2.006.278 2.476.463.622.242 1.066.53 1.532.997.466.466.755.91.997 1.532.185.47.403 1.176.463 2.476.038 1.41.048 1.827.048 5.4 0 3.573-.01 3.99-.048 5.4-.06 1.3-.278 2.006-.463 2.476-.242.622-.53 1.066-.997 1.532-.466.466-.91.755-1.532.997-.47.185-1.176.403-2.476.463-1.41.038-1.827.048-5.4.048-3.573 0-3.99-.01-5.4-.048-1.3-.06-2.006-.278-2.476-.463-.622-.242-1.066-.53-1.532-.997-.466.466-.91.755-1.532-.997-.47-.185-1.176-.403-2.476.463-1.41-.038-1.827.048-5.4.048z" />
                  <path d="M12.017 15.33a3.33 3.33 0 1 1 0-6.66 3.33 3.33 0 0 1 0 6.66zM12.017 7.052a4.948 4.948 0 1 0 0 9.896 4.948 4.948 0 0 0 0-9.896zM18.68 6.84a1.156 1.156 0 1 1-2.312 0 1.156 1.156 0 0 1 2.312 0z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Info Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">{t('footer.info')}</h3>
            <Separator className="bg-white/30 mb-4" />
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-white hover:text-gray-200 transition-colors">{t('footer.termsOfService')}</Link></li>
              <li><Link to="/privacy" className="text-white hover:text-gray-200 transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/admin" className="text-white hover:text-gray-200 transition-colors">{t('footer.admin')}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">{t('footer.contact')}</h3>
            <Separator className="bg-white/30 mb-4" />
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-white">
                <Phone className="h-4 w-4" />
                <span className="font-normal text-white">(351) 123 456 789</span>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <Mail className="h-4 w-4" />
                <span className="text-white">info@lega.pt</span>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <MapPin className="h-4 w-4" />
                <span className="text-white">123 Joane, Braga, Portugal</span>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">{t('footer.location')}</h3>
            <Separator className="bg-white/30 mb-4" />
            <div className="w-full h-32 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-white mx-auto mb-2" />
                <p className="text-white text-sm">
                  Joane, Braga<br />
                  Portugal
                </p>
                <a 
                  href="https://maps.google.com/?q=Joane,Braga,Portugal" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white text-xs underline mt-1 inline-block"
                >
                  {t('footer.viewOnGoogleMaps')}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-4 text-center">
          <p className="text-white">© 2025 Lega. {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
