
import { useParams } from "react-router-dom";
import { useVehicle } from "@/hooks/useVehicles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Gauge, Fuel, Settings, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VehicleActions from "@/components/VehicleActions";
import VehicleImageGallery from "@/components/VehicleImageGallery";
import SimilarVehicles from "@/components/SimilarVehicles";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useTranslation } from "react-i18next";

const VehicleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: vehicle, isLoading, error } = useVehicle(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="w-full h-96 mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-6" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="w-full h-64" />
            </div>
          </div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {t('vehicleDetails.notFound')}
            </h1>
            <p className="text-gray-600">
              {t('vehicleDetails.notFoundDescription')}
            </p>
          </div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  // Transform images array to string array for compatibility
  const imageUrls = vehicle.images?.map(img => img.image_url) || [];

  const specifications = [
    { 
      icon: Calendar, 
      label: t('vehicleDetails.year'), 
      value: vehicle.registration_year 
    },
    { 
      icon: MapPin, 
      label: t('vehicleDetails.location'), 
      value: vehicle.location || t('vehicleDetails.notSpecified') 
    },
    { 
      icon: Gauge, 
      label: vehicle.mileage_km ? t('vehicleDetails.mileage') : t('vehicleDetails.operatingHours'), 
      value: vehicle.mileage_km ? `${vehicle.mileage_km.toLocaleString()} km` : vehicle.operating_hours ? `${vehicle.operating_hours.toLocaleString()} h` : t('vehicleDetails.notSpecified')
    },
    { 
      icon: Fuel, 
      label: t('vehicleDetails.fuelType'), 
      value: vehicle.fuel_type || t('vehicleDetails.notSpecified') 
    },
    { 
      icon: Settings, 
      label: t('vehicleDetails.gearbox'), 
      value: vehicle.gearbox || t('vehicleDetails.notSpecified') 
    },
    { 
      icon: Truck, 
      label: t('vehicleDetails.power'), 
      value: vehicle.power_ps ? `${vehicle.power_ps} PS` : t('vehicleDetails.notSpecified') 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <VehicleImageGallery 
              images={imageUrls} 
              vehicleName={vehicle.title}
            />
            
            {/* Vehicle Info */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary">
                  {vehicle.subcategory?.name || t('vehicleDetails.vehicle')}
                </Badge>
                <Badge variant="outline">
                  {vehicle.condition}
                </Badge>
                {vehicle.brand?.name && (
                  <Badge variant="outline">
                    {vehicle.brand.name}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vehicle.title}
              </h1>
              
              <div className="text-3xl font-bold text-orange-600 mb-6">
                €{vehicle.price_eur.toLocaleString()}
              </div>
              
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold mb-4">
                  {t('vehicleDetails.description')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {vehicle.description}
                </p>
              </div>
            </div>
            
            {/* Specifications */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>{t('vehicleDetails.specifications')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <spec.icon className="h-5 w-5 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">
                          {spec.label}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {spec.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('vehicleDetails.contactInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <VehicleActions 
                    vehicle={{
                      ...vehicle,
                      condition: vehicle.condition as "new" | "used" | "restored" | "modified"
                    }} 
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Similar Vehicles */}
        <div className="mt-16">
          <SimilarVehicles 
            vehicleId={vehicle.id}
            subcategoryId={vehicle.subcategory_id}
          />
        </div>
      </div>
      
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default VehicleDetails;
