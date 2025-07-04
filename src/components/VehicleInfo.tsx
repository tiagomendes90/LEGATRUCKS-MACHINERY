
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Vehicle } from "@/hooks/useVehicles";

interface VehicleInfoProps {
  vehicle: Vehicle;
}

const VehicleInfo = ({ vehicle }: VehicleInfoProps) => {
  const { t } = useTranslation();

  // Helper function to get the correct unit label based on category
  const getMileageUnit = () => {
    if (vehicle.subcategory?.category?.slug === 'trucks') {
      return 'km';
    } else if (vehicle.subcategory?.category?.slug === 'machinery' || vehicle.subcategory?.category?.slug === 'agriculture') {
      return t('vehicleDetails.hours');
    }
    return t('vehicleDetails.hours');
  };

  const getMileageValue = () => {
    if (vehicle.subcategory?.category?.slug === 'trucks') {
      return vehicle.mileage_km ? vehicle.mileage_km.toLocaleString() : '0';
    } else {
      return vehicle.operating_hours ? vehicle.operating_hours.toLocaleString() : '0';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <Badge variant="secondary" className="mb-3">
          {vehicle.subcategory?.category?.name || 'Vehicle'}
        </Badge>
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
          {vehicle.brand?.name} {vehicle.title}
        </h1>
        <p className="text-3xl lg:text-4xl text-primary font-bold">
          €{vehicle.price_eur.toLocaleString()}
        </p>
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-600">{t('vehicleDetails.year')}</p>
          <p className="font-semibold text-lg">{vehicle.registration_year}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">{t('vehicleDetails.mileage')}</p>
          <p className="font-semibold text-lg">
            {getMileageValue()} {getMileageUnit()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">{t('vehicleDetails.condition')}</p>
          <p className="font-semibold text-lg">{vehicle.condition}</p>
        </div>
        {vehicle.power_ps && (
          <div className="text-center">
            <p className="text-sm text-gray-600">{t('vehicleDetails.horsepower')}</p>
            <p className="font-semibold text-lg">{vehicle.power_ps} PS</p>
          </div>
        )}
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t('vehicleDetails.overview')}</TabsTrigger>
          <TabsTrigger value="specifications">{t('vehicleDetails.specifications')}</TabsTrigger>
          <TabsTrigger value="description">{t('vehicleDetails.description')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {vehicle.fuel_type && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.fuelType')}</h4>
                  <p className="text-lg">{vehicle.fuel_type}</p>
                </div>
              )}
              {vehicle.gearbox && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.gearbox')}</h4>
                  <p className="text-lg">{vehicle.gearbox}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.category')}</h4>
                <p className="text-lg">{vehicle.subcategory?.category?.name}</p>
              </div>
            </div>
            <div className="space-y-4">
              {vehicle.subcategory && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.subcategory')}</h4>
                  <p className="text-lg">{vehicle.subcategory.name}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.brand')}</h4>
                <p className="text-lg">{vehicle.brand?.name}</p>
              </div>
              {vehicle.location && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.location')}</h4>
                  <p className="text-lg">{vehicle.location}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="specifications" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {vehicle.fuel_type && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.fuelType')}</h4>
                  <p className="text-lg">{vehicle.fuel_type}</p>
                </div>
              )}
              {vehicle.gearbox && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.gearbox')}</h4>
                  <p className="text-lg">{vehicle.gearbox}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.year')}</h4>
                <p className="text-lg">{vehicle.registration_year}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.mileage')}</h4>
                <p className="text-lg">{getMileageValue()} {getMileageUnit()}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.condition')}</h4>
                <p className="text-lg">{vehicle.condition}</p>
              </div>
              {vehicle.power_ps && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.power')}</h4>
                  <p className="text-lg">{vehicle.power_ps} PS</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="description" className="space-y-4 mt-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed text-lg">{vehicle.description}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleInfo;
