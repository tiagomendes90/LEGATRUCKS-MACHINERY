import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck } from "lucide-react";
import { useTrucks } from "@/hooks/useTrucks";
import { useFeaturedTrucks } from "@/hooks/useFeaturedTrucks";
import Autoplay from "embla-carousel-autoplay";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const FeaturedVehiclesSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Reduce limit to 6 for better performance
  const { data: trucks, isLoading: trucksLoading } = useTrucks(undefined, 6);
  const { data: featuredTrucksData, isLoading: featuredLoading } = useFeaturedTrucks();

  const isLoading = trucksLoading || featuredLoading;

  // Use featured trucks from database, fallback to trucks from inventory for carousel
  const featuredTrucks = featuredTrucksData && featuredTrucksData.length > 0 ? featuredTrucksData.map(featured => ({
    id: featured.trucks.id,
    name: `${featured.trucks.brand} ${featured.trucks.model}`,
    type: featured.trucks.subcategory || featured.trucks.category?.charAt(0).toUpperCase() + featured.trucks.category?.slice(1) || 'Vehicle',
    price: `$${featured.trucks.price.toLocaleString()}`,
    image: featured.trucks.images?.[0] || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop",
    features: featured.trucks.features?.slice(0, 3) || [`${featured.trucks.year} model`, "Premium engine", "Advanced transmission"]
  })) : trucks && trucks.length > 0 ? trucks.slice(0, 6).map(truck => ({
    id: truck.id,
    name: `${truck.brand} ${truck.model}`,
    type: truck.subcategory || truck.category?.charAt(0).toUpperCase() + truck.category?.slice(1) || 'Vehicle',
    price: `$${truck.price.toLocaleString()}`,
    image: truck.images?.[0] || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop",
    features: truck.features?.slice(0, 3) || [`${truck.year} model`, `${truck.engine} engine`, `${truck.transmission} transmission`]
  })) : [];

  const handleViewDetails = (vehicleId: string) => {
    navigate(`/vehicle/${vehicleId}`);
  };

  const LoadingSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="w-full h-48" />
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <section className="bg-slate-50 py-[90px]">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-slate-800">{t('home.featuredVehicles')}</h2>
        
        {isLoading ? (
          <LoadingSkeleton />
        ) : featuredTrucks.length > 0 ? (
          <div className="relative max-w-7xl mx-auto">
            <Carousel opts={{
              align: "start",
              loop: true,
              slidesToScroll: 2, // Reduced from 3 to 2
              breakpoints: {
                '(max-width: 768px)': { slidesToScroll: 1 },
                '(max-width: 1024px)': { slidesToScroll: 1 } // Reduced from 2 to 1
              }
            }} plugins={[Autoplay({ delay: 5000 })]} className="w-full"> {/* Increased delay */}
              <CarouselContent className="-ml-4">
                {featuredTrucks.map((vehicle, index) => (
                  <CarouselItem key={vehicle.id || index} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                      <div className="relative overflow-hidden">
                        <img 
                          src={vehicle.image} 
                          alt={vehicle.name} 
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <Badge className="absolute top-4 left-4 bg-blue-600">{vehicle.type}</Badge>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl">{vehicle.name}</CardTitle>
                        <CardDescription className="text-2xl font-bold text-orange-600">{vehicle.price}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-4">
                          {vehicle.features.map((feature, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className="w-full bg-slate-800 hover:bg-slate-700"
                          onClick={() => handleViewDetails(vehicle.id)}
                        >
                          {t('common.viewDetails')}
                        </Button>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('home.noFeaturedVehicles')}</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {t('home.noFeaturedDescription')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedVehiclesSection;
