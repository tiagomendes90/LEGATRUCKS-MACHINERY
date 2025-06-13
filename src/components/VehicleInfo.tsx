
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Truck } from "@/hooks/useTrucks";

interface VehicleInfoProps {
  vehicle: Truck;
}

const VehicleInfo = ({ vehicle }: VehicleInfoProps) => {
  const { t } = useTranslation();

  // Helper function to get the correct unit label based on category
  const getMileageUnit = () => {
    if (vehicle.category === 'trucks') {
      return 'km';
    } else if (vehicle.category === 'machinery' || vehicle.category === 'agriculture') {
      return t('vehicleDetails.hours');
    }
    return t('vehicleDetails.hours');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <Badge variant="secondary" className="mb-3">
          {vehicle.category}
        </Badge>
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
          {vehicle.brand} {vehicle.model}
        </h1>
        <p className="text-3xl lg:text-4xl text-primary font-bold">
          ${vehicle.price.toLocaleString()}
        </p>
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-600">{t('vehicleDetails.year')}</p>
          <p className="font-semibold text-lg">{vehicle.year}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">{t('vehicleDetails.mileage')}</p>
          <p className="font-semibold text-lg">
            {vehicle.mileage ? vehicle.mileage.toLocaleString() : '0'} {getMileageUnit()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">{t('vehicleDetails.condition')}</p>
          <p className="font-semibold text-lg">{vehicle.condition}</p>
        </div>
        {vehicle.horsepower && (
          <div className="text-center">
            <p className="text-sm text-gray-600">{t('vehicleDetails.horsepower')}</p>
            <p className="font-semibold text-lg">{vehicle.horsepower} HP</p>
          </div>
        )}
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('vehicleDetails.overview')}</TabsTrigger>
          <TabsTrigger value="specifications">{t('vehicleDetails.specifications')}</TabsTrigger>
          <TabsTrigger value="features">{t('vehicleDetails.features')}</TabsTrigger>
          <TabsTrigger value="description">{t('vehicleDetails.description')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.engine')}</h4>
                <p className="text-lg">{vehicle.engine}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.transmission')}</h4>
                <p className="text-lg">{vehicle.transmission}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.category')}</h4>
                <p className="text-lg">{vehicle.category}</p>
              </div>
            </div>
            <div className="space-y-4">
              {vehicle.subcategory && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.subcategory')}</h4>
                  <p className="text-lg">{vehicle.subcategory}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.brand')}</h4>
                <p className="text-lg">{vehicle.brand}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.model')}</h4>
                <p className="text-lg">{vehicle.model}</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="specifications" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.engine')}</h4>
                <p className="text-lg">{vehicle.engine}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.transmission')}</h4>
                <p className="text-lg">{vehicle.transmission}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.year')}</h4>
                <p className="text-lg">{vehicle.year}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.mileage')}</h4>
                <p className="text-lg">{vehicle.mileage ? vehicle.mileage.toLocaleString() : '0'} {getMileageUnit()}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.condition')}</h4>
                <p className="text-lg">{vehicle.condition}</p>
              </div>
              {vehicle.horsepower && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.horsepower')}</h4>
                  <p className="text-lg">{vehicle.horsepower} HP</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="features" className="space-y-4 mt-6">
          {vehicle.features && vehicle.features.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {vehicle.features.map((feature, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('vehicleDetails.noFeatures')}</p>
          )}
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
