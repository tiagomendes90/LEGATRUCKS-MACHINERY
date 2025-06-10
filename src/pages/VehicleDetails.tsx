
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Calendar, Gauge, Fuel } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useTrucks } from "@/hooks/useTrucks";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: trucks = [] } = useTrucks();
  
  const vehicle = trucks.find(truck => truck.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleBackToCatalog = () => {
    if (vehicle?.category) {
      navigate(`/${vehicle.category}`);
    } else {
      navigate('/');
    }
  };

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-20 mt-16">
          <h1 className="text-2xl font-bold text-center">{t('notFound.title')}</h1>
          <p className="text-center">{t('notFound.message')}</p>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/')}>{t('notFound.returnHome')}</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8 mt-20">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={handleBackToCatalog}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery with Carousel */}
          <div>
            {vehicle.images && vehicle.images.length > 0 ? (
              vehicle.images.length === 1 ? (
                <img
                  src={vehicle.images[0]}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-auto rounded-lg shadow-md"
                />
              ) : (
                <Carousel className="w-full">
                  <CarouselContent>
                    {vehicle.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <img
                            src={image}
                            alt={`${vehicle.brand} ${vehicle.model} - Image ${index + 1}`}
                            className="w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              )
            ) : (
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                <Truck className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {vehicle.brand} {vehicle.model}
            </h1>
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant={vehicle.condition === 'new' ? 'default' : 'secondary'}>
                {vehicle.condition}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{t('vehicleDetails.year')}: {vehicle.year}</span>
              </div>
              {vehicle.mileage && (
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  <span>{t('vehicleDetails.mileage')}: {vehicle.mileage.toLocaleString()} km</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                <span>{t('vehicleDetails.engine')}: {vehicle.engine}</span>
              </div>
              {vehicle.horsepower && (
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  <span>{t('vehicleDetails.horsepower')}: {vehicle.horsepower} hp</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                <span>{t('vehicleDetails.transmission')}: {vehicle.transmission}</span>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                <span>{t('vehicleDetails.category')}: {vehicle.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                <span>{t('vehicleDetails.subcategory')}: {vehicle.subcategory}</span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">{t('vehicleDetails.description')}</h2>
              <p className="text-gray-700">{vehicle.description}</p>
            </div>

            <div className="mt-6">
              <div className="text-2xl font-bold text-orange-600 mb-4">
                ${vehicle.price?.toLocaleString()}
              </div>
              <div className="flex space-x-4">
                <Button>{t('vehicleDetails.requestQuote')}</Button>
                <Button variant="outline">{t('vehicleDetails.callNow')}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default VehicleDetails;
