
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

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
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-slate-800 text-white py-[150px] bg-blue-500">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('contact.title')}</h1>
          <p className="text-xl text-blue-100 max-w-3xl">{t('contact.subtitle')}</p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
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
                          placeholder="John Doe" 
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
                          placeholder="john@company.com" 
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
                          placeholder="(555) 123-4567" 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">{t('contact.companyName')}</Label>
                        <Input 
                          id="company" 
                          value={formData.company} 
                          onChange={(e) => handleInputChange("company", e.target.value)} 
                          placeholder="Your Company" 
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
                          <SelectItem value="buying-truck">{t('contact.interests.buying')}</SelectItem>
                          <SelectItem value="want-to-sell">{t('contact.interests.selling')}</SelectItem>
                          <SelectItem value="financing">{t('contact.interests.financing')}</SelectItem>
                          <SelectItem value="leasing">{t('contact.interests.leasing')}</SelectItem>
                          <SelectItem value="parts-service">{t('contact.interests.parts')}</SelectItem>
                          <SelectItem value="warranty">{t('contact.interests.warranty')}</SelectItem>
                          <SelectItem value="trade-in">{t('contact.interests.tradeIn')}</SelectItem>
                          <SelectItem value="fleet-solutions">{t('contact.interests.fleet')}</SelectItem>
                          <SelectItem value="insurance">{t('contact.interests.insurance')}</SelectItem>
                          <SelectItem value="general-inquiry">{t('contact.interests.general')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="message">{t('contact.message')}</Label>
                      <Textarea 
                        id="message" 
                        value={formData.message} 
                        onChange={(e) => handleInputChange("message", e.target.value)} 
                        placeholder={t('contact.messagePlaceholder')} 
                        rows={5} 
                        className="mt-1" 
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                      {t('contact.sendMessageBtn')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-800">{t('contact.getInTouch')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{t('contact.phone')}</h3>
                      <p className="text-gray-600">(555) 123-4567</p>
                      <p className="text-sm text-gray-500">{t('contact.salesInquiries')}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Mail className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{t('contact.email')}</h3>
                      <p className="text-gray-600">info@truckhub.com</p>
                      <p className="text-sm text-gray-500">{t('contact.respondWithin')}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <MapPin className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{t('contact.location')}</h3>
                      <p className="text-gray-600">123 Industrial Avenue</p>
                      <p className="text-gray-600">Business City, ST 12345</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{t('contact.businessHours')}</h3>
                      <p className="text-gray-600">{t('contact.mondayFriday')}</p>
                      <p className="text-gray-600">{t('contact.saturday')}</p>
                      <p className="text-gray-600">{t('contact.sunday')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-slate-50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-800 mb-3">{t('contact.immediateAssistance')}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {t('contact.urgentInquiries')}
                  </p>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    {t('contact.callNow')}
                  </Button>
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
