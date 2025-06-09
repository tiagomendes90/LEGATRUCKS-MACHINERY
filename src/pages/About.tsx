
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Wrench, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();
  
  const stats = [{
    number: "20+",
    label: t('about.stats.yearsExperience')
  }, {
    number: "5000+",
    label: t('about.stats.trucksSold')
  }, {
    number: "50+",
    label: t('about.stats.expertTeam')
  }, {
    number: "24/7",
    label: t('about.stats.supportAvailable')
  }];

  const values = [{
    icon: <Award className="h-8 w-8 text-blue-600" />,
    title: t('about.values.quality.title'),
    description: t('about.values.quality.description')
  }, {
    icon: <Users className="h-8 w-8 text-green-600" />,
    title: t('about.values.customer.title'),
    description: t('about.values.customer.description')
  }, {
    icon: <Wrench className="h-8 w-8 text-orange-600" />,
    title: t('about.values.expert.title'),
    description: t('about.values.expert.description')
  }, {
    icon: <Globe className="h-8 w-8 text-purple-600" />,
    title: t('about.values.leadership.title'),
    description: t('about.values.leadership.description')
  }];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-slate-800 text-white py-[150px] bg-blue-500">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('about.title')}</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-lg text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-800 mb-6">{t('about.ourStory')}</h2>
              <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                <p>{t('about.storyP1')}</p>
                <p>{t('about.storyP2')}</p>
                <p>{t('about.storyP3')}</p>
              </div>
            </div>
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=600&h=400&fit=crop" alt="Our facility" className="rounded-lg shadow-xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-16">{t('about.ourValues')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-800">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-slate-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('common.readyToWork')}</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">{t('common.experienceDifference')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 px-8 py-6 text-lg">
              {t('common.browseInventory')}
            </Button>
            <Button size="lg" variant="outline" className="bg-sky-300 hover:bg-sky-200 text-slate-800 px-8 py-6 text-lg">
              {t('common.contactTeam')}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default About;
