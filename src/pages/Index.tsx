
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

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
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
