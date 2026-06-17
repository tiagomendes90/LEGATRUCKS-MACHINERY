
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";
import contactBanner from "@/assets/contact-banner.jpg";
import PageHero from "@/components/PageHero";

const WHATSAPP_NUMBER = "351912406089";
const PHONE_DISPLAY = "+351 912 406 089";
const EMAIL = "info@lega.pt";

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    interest: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: t('contact.messageSent'),
      description: t('contact.thankYou')
    });
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      interest: "",
      message: ""
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Contact LEGA | Request a Quote for Trucks, Machinery & Parts"
        description="Get in touch with LEGA for quotes on used trucks, construction machinery, trailers, tractors and parts. Fast response across Europe."
        path="/contactos"
      />
      <Navbar />

      <PageHero title={t('contact.title')} subtitle={t('contact.subtitle')} />

      {/* Image Banner */}
      <section className="relative w-full overflow-hidden" style={{ height: 250 }}>
        <img
          src={contactBanner}
          alt="LEGA trucks and machinery yard"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative container mx-auto px-6 h-full flex items-center">
          <p className="text-white text-xl md:text-2xl font-semibold max-w-2xl drop-shadow">
            {t('contact.bannerHeadline')}
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">

            {/* Left column - Contact info (40%) */}
            <div className="lg:col-span-2 order-1 lg:order-1 space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-800">{t('contact.getInTouch')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg shrink-0">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{t('contact.phone')} / WhatsApp</h3>
                      <a href={`tel:+${WHATSAPP_NUMBER}`} className="text-gray-700 hover:text-orange-600">
                        {PHONE_DISPLAY}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{t('contact.email')}</h3>
                      <a href={`mailto:${EMAIL}`} className="text-gray-700 hover:text-orange-600">
                        {EMAIL}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-3 rounded-lg shrink-0">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{t('contact.location')}</h3>
                      <p className="text-gray-700">Av. Dr. António Palha Nº25</p>
                      <p className="text-gray-700">5º DIR FRT</p>
                      <p className="text-gray-700">4715-009 Braga</p>
                      <p className="text-gray-700">Portugal</p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                    >
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-5 w-5" />
                        {t('contact.whatsapp')}
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="w-full border-slate-300"
                    >
                      <a href={`mailto:${EMAIL}`}>
                        <Mail className="h-5 w-5" />
                        {t('contact.emailUs')}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Google Map */}
              <Card className="shadow-lg overflow-hidden">
                <iframe
                  title="LEGA location"
                  src="https://www.google.com/maps?q=Av.+Dr.+Ant%C3%B3nio+Palha+25,+4715-009+Braga,+Portugal&output=embed"
                  width="100%"
                  height="300"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Card>
            </div>

            {/* Right column - Form (60%) */}
            <div className="lg:col-span-3 order-2 lg:order-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-800">{t('contact.sendMessage')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">{t('contact.fullName')} *</Label>
                        <Input 
                          id="name" 
                          value={formData.name} 
                          onChange={(e) => handleInputChange("name", e.target.value)} 
                          placeholder={t('contactPage.namePlaceholder')} 
                          required 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">{t('contact.emailAddress')} *</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => handleInputChange("email", e.target.value)} 
                          placeholder={t('contactPage.emailPlaceholder')} 
                          required 
                          className="mt-1" 
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone">{t('contact.phoneNumber')}</Label>
                        <Input 
                          id="phone" 
                          value={formData.phone} 
                          onChange={(e) => handleInputChange("phone", e.target.value)} 
                          placeholder={t('contactPage.phonePlaceholder')} 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">{t('contact.companyName')}</Label>
                        <Input 
                          id="company" 
                          value={formData.company} 
                          onChange={(e) => handleInputChange("company", e.target.value)} 
                          placeholder={t('contactPage.companyPlaceholder')} 
                          className="mt-1" 
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="interest">{t('contact.interestedIn')}</Label>
                      <Select onValueChange={(value) => handleInputChange("interest", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('contact.selectInterest')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trucks">{t('contact.interests.trucks')}</SelectItem>
                          <SelectItem value="machinery">{t('contact.interests.machinery')}</SelectItem>
                          <SelectItem value="trailers">{t('contact.interests.trailers')}</SelectItem>
                          <SelectItem value="tractors">{t('contact.interests.tractors')}</SelectItem>
                          <SelectItem value="parts">{t('contact.interests.parts')}</SelectItem>
                          <SelectItem value="selling">{t('contact.interests.selling')}</SelectItem>
                          <SelectItem value="general">{t('contact.interests.general')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="message">{t('contact.message')} *</Label>
                      <Textarea 
                        id="message" 
                        value={formData.message} 
                        onChange={(e) => handleInputChange("message", e.target.value)} 
                        placeholder={t('contact.messagePlaceholder')} 
                        rows={5} 
                        className="mt-1" 
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-orange-500 hover:bg-blue-700 text-white transition-colors"
                    >
                      {t('contact.sendMessageBtn')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
