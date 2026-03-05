
import { useParams } from "react-router-dom";
import { useVehicle } from "@/hooks/useVehicles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin } from "lucide-react";
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
            </div>
            <div className="lg:col-span-1"><Skeleton className="w-full h-64" /></div>
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
            <h1 className="text-2xl font-bold text-foreground mb-4">{t('vehicleDetails.notFound')}</h1>
            <p className="text-muted-foreground">{t('vehicleDetails.notFoundDescription')}</p>
          </div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  const imageUrls = vehicle.images?.map((img: any) => img.image_url) || [];

  const specifications = [
    { icon: Calendar, label: t('vehicleDetails.year'), value: vehicle.year },
    { icon: MapPin, label: t('vehicleDetails.location'), value: [vehicle.location_city, vehicle.location_country].filter(Boolean).join(', ') || t('vehicleDetails.notSpecified') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <VehicleImageGallery images={imageUrls} vehicleName={vehicle.title} />
            
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary">{vehicle.subcategory?.name || 'Produto'}</Badge>
                <Badge variant="outline">{vehicle.condition}</Badge>
                {vehicle.brand?.name && <Badge variant="outline">{vehicle.brand.name}</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{vehicle.title}</h1>
              <div className="text-3xl font-bold text-orange-600 mb-6">€{(vehicle.price || 0).toLocaleString()}</div>
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold mb-4">{t('vehicleDetails.description')}</h3>
                <p className="text-muted-foreground leading-relaxed">{vehicle.description}</p>
              </div>
            </div>
            
            <Card className="mt-8">
              <CardHeader><CardTitle>{t('vehicleDetails.specifications')}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <spec.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-foreground">{spec.label}:</span>
                        <span className="ml-2 text-muted-foreground">{spec.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader><CardTitle>{t('vehicleDetails.contactInfo')}</CardTitle></CardHeader>
                <CardContent>
                  <VehicleActions vehicle={vehicle as any} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <div className="mt-16">
          <SimilarVehicles vehicleId={vehicle.id} subcategoryId={vehicle.subcategory_id} />
        </div>
      </div>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default VehicleDetails;
