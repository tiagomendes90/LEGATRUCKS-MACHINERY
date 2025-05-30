import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Truck, Users, Shield, Award } from "lucide-react";
import { useTrucks } from "@/hooks/useTrucks";
import { useFeaturedTrucks } from "@/hooks/useFeaturedTrucks";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Autoplay from "embla-carousel-autoplay";

const Index = () => {
  const { data: trucks } = useTrucks();
  const { data: featuredTrucksData } = useFeaturedTrucks();

  // Use featured trucks from database, fallback to first 6 trucks from inventory for carousel
  const featuredTrucks = featuredTrucksData && featuredTrucksData.length > 0
    ? featuredTrucksData.map(featured => ({
        id: featured.trucks.id,
        name: `${featured.trucks.brand} ${featured.trucks.model}`,
        type: featured.trucks.category?.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ') || 'Truck',
        price: `$${featured.trucks.price.toLocaleString()}`,
        image: featured.trucks.images?.[0] || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop",
        features: featured.trucks.features?.slice(0, 3) || [`${featured.trucks.year} model`, "Premium engine", "Advanced transmission"]
      }))
    : trucks && trucks.length > 0 
      ? trucks.slice(0, 6).map(truck => ({
          id: truck.id,
          name: `${truck.brand} ${truck.model}`,
          type: truck.category?.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ') || 'Truck',
          price: `$${truck.price.toLocaleString()}`,
          image: truck.images?.[0] || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop",
          features: truck.features?.slice(0, 3) || [`${truck.year} model`, `${truck.engine} engine`, `${truck.transmission} transmission`]
        }))
      : [];

  // Get unique brands from the trucks database
  const uniqueBrands = trucks ? [...new Set(trucks.map(truck => truck.brand))] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      
      {/* Hero Section with Full Screen Image */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url('/lovable-uploads/5e2912d0-c74c-4979-91b4-a8a43d2ac24b.png')`
      }}>
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="container mx-auto px-6 text-center text-white">
            <h1 className="text-5xl mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent font-extrabold md:text-6xl lg:text-7xl">
              TRUCKS & MACHINERY
            </h1>
            <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto md:text-2xl">
              100+ NEW TRUCKS AND MACHINES IN STOCK
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg">Contact</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-[120px]">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
              <p className="text-gray-600">Built to last with superior materials and craftsmanship</p>
            </div>
            <div className="text-center group">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Reliable Service</h3>
              <p className="text-gray-600">24/7 support and comprehensive warranty coverage</p>
            </div>
            <div className="text-center group">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Expert Team</h3>
              <p className="text-gray-600">Experienced professionals to guide your purchase</p>
            </div>
            <div className="text-center group">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Industry Leader</h3>
              <p className="text-gray-600">Trusted by businesses nationwide for over 20 years</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trucks Carousel */}
      <section className="bg-slate-50 py-[90px]">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-800">Featured Trucks</h2>
          {featuredTrucks.length > 0 ? (
            <div className="relative">
              <Carousel opts={{
                align: "start",
                loop: true
              }} className="w-full max-w-7xl mx-auto">
                <CarouselContent className="-ml-4">
                  {featuredTrucks.map((truck, index) => (
                    <CarouselItem key={truck.id || index} className="pl-4 md:basis-1/3">
                      <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                        <div className="relative overflow-hidden">
                          <img 
                            src={truck.image} 
                            alt={truck.name} 
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          <Badge className="absolute top-4 left-4 bg-blue-600">{truck.type}</Badge>
                        </div>
                        <CardHeader>
                          <CardTitle className="text-xl">{truck.name}</CardTitle>
                          <CardDescription className="text-2xl font-bold text-orange-600">{truck.price}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 mb-4">
                            {truck.features.map((feature, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button className="w-full bg-slate-800 hover:bg-slate-700">View Details</Button>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Featured Trucks</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No trucks are currently featured. Add some trucks to your inventory or set featured trucks in the admin panel.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Truck Brands Carousel */}
      <section className="bg-white px-0 py-[30px]">
        <div className="container mx-auto py-0 my-0 px-[24px]">
          
          <div className="flex justify-center">
            <Carousel opts={{
            align: "start",
            loop: true
          }} plugins={[Autoplay({
            delay: 2000
          })]} className="w-full max-w-5xl">
              <CarouselContent className="-ml-2 md:-ml-4">
                {uniqueBrands.length > 0 ? uniqueBrands.map((brand, index) => <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/3 lg:basis-1/4">
                    <div className="p-1">
                      <Card className="border-0 shadow-none">
                        <CardContent className="flex aspect-square items-center justify-center p-6">
                          <div className="text-center">
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                              <Truck className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider">
                              {brand}
                            </h3>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>) :
              // Fallback brands if no trucks in database
              ['Volvo', 'Scania', 'Mercedes', 'MAN', 'Iveco', 'DAF'].map((brand, index) => <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/3 lg:basis-1/4">
                      <div className="p-1">
                        <Card className="border-0 shadow-none">
                          <CardContent className="flex aspect-square items-center justify-center p-6 py-0 px-0">
                            <div className="text-center">
                              <div className="bg-gradient-to-br from-blue-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Truck className="h-8 w-8 text-white" />
                              </div>
                              <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider">
                                {brand}
                              </h3>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>)}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
