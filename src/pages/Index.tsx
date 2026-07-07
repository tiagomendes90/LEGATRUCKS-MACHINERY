
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FeaturedVehiclesSection from "@/components/home/FeaturedVehiclesSection";
import BrandsCarousel from "@/components/home/BrandsCarousel";
import QuickContactBar from "@/components/home/QuickContactBar";

import MidCTA from "@/components/home/MidCTA";
import FinalCTA from "@/components/home/FinalCTA";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="LEGA | Equipamentos e Soluções Industriais em Portugal"
        description="LEGA é a empresa portuguesa de referência em camiões, máquinas industriais, tractores, reboques e peças. Stock disponível, entrega nacional e assistência dedicada."
        path="/"
        keywords="LEGA, camiões usados, máquinas industriais, tractores, reboques, peças, equipamentos Portugal"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Categorias LEGA",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Camiões", url: "https://lega.pt/camioes" },
            { "@type": "ListItem", position: 2, name: "Máquinas", url: "https://lega.pt/maquinas" },
            { "@type": "ListItem", position: 3, name: "Tractores", url: "https://lega.pt/tractores" },
            { "@type": "ListItem", position: 4, name: "Reboques", url: "https://lega.pt/reboques" },
            { "@type": "ListItem", position: 5, name: "Peças", url: "https://lega.pt/pecas" },
          ],
        }}
      />
      <Navbar />
      
      <HeroSection />
      
      <QuickContactBar />
      
      <FeaturesSection />
      
      <FeaturedVehiclesSection />

      <MidCTA />

      <BrandsCarousel />

      <FinalCTA />

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default Index;
