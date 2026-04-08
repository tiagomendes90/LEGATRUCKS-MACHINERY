
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-28 pb-12">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-8 w-1/4 mb-8" />
          <Skeleton className="w-full h-[520px] rounded-xl mb-12" />
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-28 pb-12">
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

  // Extract dynamic spec values
  const dynamicSpecs = (vehicle.spec_values || []).map((sv: any) => {
    const def = sv.spec_definition;
    if (!def) return null;
    let value: string | number | boolean | null = null;
    if (def.data_type === 'number') value = sv.value_number;
    else if (def.data_type === 'boolean') value = sv.value_boolean;
    else value = sv.value_text;
    
    const displayValue = def.data_type === 'boolean' 
      ? (value ? '✓' : '✗')
      : value != null 
        ? `${value}${def.unit ? ` ${def.unit}` : ''}`
        : t('vehicleDetails.notSpecified');

    return {
      id: sv.id,
      label: def.label || def.name,
      value: displayValue,
    };
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-28 pb-12">

        {/* TITLE + PRICE + BADGES */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary">{vehicle.subcategory?.name || 'Produto'}</Badge>
            <Badge variant="outline">{vehicle.condition}</Badge>
            {vehicle.brand?.name && <Badge variant="outline">{vehicle.brand.name}</Badge>}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{vehicle.title}</h1>
          <p className="text-2xl lg:text-3xl font-bold text-primary mt-2">
            {vehicle.price ? `€${vehicle.price.toLocaleString()}` : t('vehicleDetails.contactForPrice')}
          </p>
        </div>

        {/* PREMIUM GALLERY */}
        <div className="mb-12">
          <VehicleImageGallery images={imageUrls} vehicleName={vehicle.title} />
        </div>

        {/* CONTENT: Description + Specs | Contact sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* LEFT: Description + Specifications */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('vehicleDetails.description')}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{vehicle.description}</p>
            </div>

            {/* Base Specifications */}
            <Card>
              <CardHeader><CardTitle>{t('vehicleDetails.specifications')}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {vehicle.year && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-foreground">{t('vehicleDetails.year')}:</span>
                        <span className="ml-2 text-muted-foreground">{vehicle.year}</span>
                      </div>
                    </div>
                  )}
                  {(vehicle.location_city || vehicle.location_country) && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-foreground">{t('vehicleDetails.location')}:</span>
                        <span className="ml-2 text-muted-foreground">
                          {[vehicle.location_city, vehicle.location_country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                  {vehicle.model && (
                    <div className="flex items-center space-x-3">
                      <div>
                        <span className="font-medium text-foreground">{t('vehicleDetails.model')}:</span>
                        <span className="ml-2 text-muted-foreground">{vehicle.model}</span>
                      </div>
                    </div>
                  )}
                  {vehicle.brand?.name && (
                    <div className="flex items-center space-x-3">
                      <div>
                        <span className="font-medium text-foreground">{t('vehicleDetails.brand')}:</span>
                        <span className="ml-2 text-muted-foreground">{vehicle.brand.name}</span>
                      </div>
                    </div>
                  )}
                  {/* Dynamic specs from spec_values */}
                  {dynamicSpecs.map((spec: any) => (
                    <div key={spec.id} className="flex items-center space-x-3">
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

          {/* RIGHT: Contact (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <Card>
                <CardHeader><CardTitle>{t('vehicleDetails.contactInfo')}</CardTitle></CardHeader>
                <CardContent>
                  <VehicleActions vehicle={vehicle as any} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Similar Vehicles */}
        <div className="mt-12 pt-8 border-t border-border">
          <SimilarVehicles vehicleId={vehicle.id} subcategoryId={vehicle.subcategory_id} />
        </div>
      </div>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default VehicleDetails;
