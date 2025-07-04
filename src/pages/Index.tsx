
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Wrench, Tractor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FeaturedVehiclesSection from "@/components/home/FeaturedVehiclesSection";
import BrandsCarousel from "@/components/home/BrandsCarousel";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const categories = [
  {
    id: "trucks",
    name: "Trucks",
    icon: Truck,
    description: "Heavy-duty trucks for transport and logistics",
    slug: "trucks"
  },
  {
    id: "machinery",
    name: "Machinery",
    icon: Wrench,
    description: "Construction and industrial machinery",
    slug: "machinery"
  },
  {
    id: "agriculture",
    name: "Agriculture",
    icon: Tractor,
    description: "Agricultural vehicles and equipment",
    slug: "agriculture"
  }
];

const Index = () => {
  const navigate = useNavigate();
  const { data: recentVehicles = [] } = useVehicles({}, 8);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <HeroSection />
      
      {/* Categories Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Explore Our Categories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find the perfect vehicle for your needs from our extensive collection of trucks, machinery, and agricultural equipment.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <Button 
                      onClick={() => navigate(`/${category.slug}`)}
                      className="w-full"
                      variant="outline"
                    >
                      Browse {category.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <FeaturedVehiclesSection />

      {/* Recent Vehicles Section */}
      {recentVehicles.length > 0 && (
        <div className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Recently Added</h2>
              <p className="text-gray-600">Check out our latest vehicle additions</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentVehicles.slice(0, 4).map((vehicle) => (
                <Card key={vehicle.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative">
                    <img 
                      src={vehicle.main_image_url || vehicle.images?.[0]?.image_url || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=300&h=200&fit=crop"} 
                      alt={vehicle.title}
                      className="w-full h-40 object-cover rounded-t-lg"
                    />
                    <Badge className="absolute top-2 left-2 bg-green-600">New</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 text-sm">{vehicle.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{vehicle.brand?.name} • {vehicle.registration_year}</p>
                    <p className="font-bold text-primary text-sm">€{vehicle.price_eur.toLocaleString()}</p>
                    <Button 
                      size="sm" 
                      className="w-full mt-2 text-xs" 
                      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" onClick={() => navigate('/trucks')}>
                View All Vehicles
              </Button>
            </div>
          </div>
        </div>
      )}

      <BrandsCarousel />
      <FeaturesSection />
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default Index;
