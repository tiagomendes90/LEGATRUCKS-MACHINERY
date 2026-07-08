
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Wrench, Globe, Truck, Tractor, Cog, MapPin, ShieldCheck, HeartHandshake } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
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
      <SEO
        title="Sobre a LEGA | Empresa Portuguesa de Equipamentos Industriais"
        description="Conheça a LEGA — empresa portuguesa especializada em camiões, máquinas industriais, tractores, reboques e peças, com cobertura nacional e assistência dedicada."
        path="/sobre"
        keywords="LEGA, sobre a LEGA, empresa portuguesa, equipamentos industriais, camiões, máquinas, tractores, reboques, peças"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "Sobre a LEGA",
            url: "https://lega.pt/sobre",
            about: {
              "@type": "Organization",
              name: "LEGA",
              alternateName: "LEGA Trucks & Machinery",
              url: "https://lega.pt",
              logo: "https://lega.pt/logo-hero.png",
              areaServed: { "@type": "Country", name: "Portugal" },
              foundingDate: "2005",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: "https://lega.pt/" },
              { "@type": "ListItem", position: 2, name: "Sobre a LEGA", item: "https://lega.pt/sobre" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "O que é a LEGA?", acceptedAnswer: { "@type": "Answer", text: "A LEGA é uma empresa portuguesa especializada na comercialização de camiões, máquinas industriais, tractores, reboques e peças, com sede em Vila Nova de Famalicão e cobertura nacional." } },
              { "@type": "Question", name: "Que tipos de equipamentos a LEGA disponibiliza?", acceptedAnswer: { "@type": "Answer", text: "Camiões pesados e comerciais, máquinas industriais e de construção, tractores agrícolas, reboques de várias tipologias e peças novas e usadas." } },
              { "@type": "Question", name: "A LEGA entrega em todo o país?", acceptedAnswer: { "@type": "Answer", text: "Sim. A LEGA opera com cobertura nacional em Portugal continental e ilhas." } },
              { "@type": "Question", name: "A LEGA presta assistência pós-venda?", acceptedAnswer: { "@type": "Answer", text: "Sim. A LEGA oferece assistência dedicada pós-venda, apoio técnico e fornecimento contínuo de peças." } },
            ],
          },
        ]}
      />
      <Navbar />
      
      <PageHero title="Sobre a LEGA" subtitle="Empresa portuguesa de referência em equipamentos e soluções industriais" />

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="sr-only">Sobre a LEGA — Empresa Portuguesa de Equipamentos Industriais</h1>
          <div className="text-lg text-gray-700 leading-relaxed space-y-5">
            <p>
              A <strong>LEGA</strong> é uma empresa portuguesa dedicada à comercialização de{" "}
              <strong>camiões, máquinas industriais, tractores agrícolas, reboques e peças</strong>,
              com sede em Vila Nova de Famalicão e operação em todo o território nacional. Ao longo
              de mais de duas décadas, a LEGA consolidou-se como parceiro de confiança de empresas de
              transporte, construção, obras públicas, agricultura, logística e indústria.
            </p>
            <p>
              O nosso propósito é <strong>disponibilizar equipamentos fiáveis, ao preço certo, com
              acompanhamento técnico especializado</strong>. Cada camião, máquina, tractor ou reboque
              que integra o stock da LEGA passa por avaliação criteriosa, garantindo qualidade e
              transparência ao cliente final.
            </p>
          </div>
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
              <img
                src="https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=600&h=400&fit=crop"
                alt="Instalações LEGA — Trucks & Machinery em Vila Nova de Famalicão"
                className="rounded-lg shadow-xl"
                loading="lazy"
                decoding="async"
                width={600}
                height={400}
              />
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

      {/* Missão / Visão / Valores */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-8">
                <ShieldCheck className="h-10 w-10 text-blue-600 mb-4" />
                <h2 className="text-2xl font-bold mb-3 text-slate-800">Missão</h2>
                <p className="text-gray-600 leading-relaxed">
                  Fornecer equipamentos industriais e agrícolas de qualidade a empresas portuguesas,
                  com transparência, apoio técnico especializado e soluções adaptadas a cada necessidade.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-8">
                <Globe className="h-10 w-10 text-blue-600 mb-4" />
                <h2 className="text-2xl font-bold mb-3 text-slate-800">Visão</h2>
                <p className="text-gray-600 leading-relaxed">
                  Ser a referência nacional em camiões, máquinas, tractores, reboques e peças,
                  reconhecida pela qualidade do stock, confiança e proximidade com o cliente.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-8">
                <HeartHandshake className="h-10 w-10 text-blue-600 mb-4" />
                <h2 className="text-2xl font-bold mb-3 text-slate-800">Valores</h2>
                <p className="text-gray-600 leading-relaxed">
                  Integridade, competência técnica, transparência comercial, foco no cliente e
                  compromisso com soluções sustentáveis e duradouras.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Áreas de atuação */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 text-center">
            Áreas de atuação da LEGA
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-12">
            Uma oferta completa para empresas que dependem de equipamentos fiáveis no dia-a-dia.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Truck className="h-8 w-8 text-blue-600" />, title: "Camiões pesados e comerciais", text: "Veículos para transporte de mercadorias, logística e distribuição." },
              { icon: <Cog className="h-8 w-8 text-blue-600" />, title: "Máquinas industriais", text: "Equipamentos para construção, obras públicas e movimentação de terras." },
              { icon: <Tractor className="h-8 w-8 text-blue-600" />, title: "Tractores agrícolas", text: "Soluções para agricultura, pecuária e exploração florestal." },
              { icon: <Truck className="h-8 w-8 text-blue-600" />, title: "Reboques", text: "Reboques de várias tipologias para transporte de máquinas, veículos e cargas." },
              { icon: <Wrench className="h-8 w-8 text-blue-600" />, title: "Peças novas e usadas", text: "Stock alargado de peças e componentes para todas as categorias." },
              { icon: <MapPin className="h-8 w-8 text-blue-600" />, title: "Cobertura nacional", text: "Entrega em Portugal continental e ilhas, com apoio dedicado." },
            ].map((item, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Serviços e assistência */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
            Serviços e assistência LEGA
          </h2>
          <div className="text-lg text-gray-700 space-y-4 leading-relaxed">
            <p>
              Para além da comercialização, a LEGA oferece um conjunto de serviços que asseguram
              o ciclo de vida completo do equipamento: <strong>avaliação técnica, apoio na escolha,
              logística de entrega, fornecimento contínuo de peças e assistência pós-venda</strong>.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Consultoria personalizada na escolha do camião, máquina, tractor ou reboque adequado.</li>
              <li>Apoio ao financiamento e opções de aquisição flexíveis.</li>
              <li>Serviço de transporte e entrega em Portugal continental e ilhas.</li>
              <li>Fornecimento de peças originais e alternativas para as principais marcas.</li>
              <li>Assistência pós-venda e apoio técnico contínuo.</li>
            </ul>
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
