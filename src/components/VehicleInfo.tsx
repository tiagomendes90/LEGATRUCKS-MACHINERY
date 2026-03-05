
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

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <Badge variant="secondary" className="mb-3">
          {vehicle.subcategory?.category?.name || 'Produto'}
        </Badge>
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
          {vehicle.brand?.name} {vehicle.title}
        </h1>
        <p className="text-3xl lg:text-4xl text-primary font-bold">
          €{(vehicle.price || 0).toLocaleString()}
        </p>
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        {vehicle.year && (
          <div className="text-center">
            <p className="text-sm text-gray-600">{t('vehicleDetails.year')}</p>
            <p className="font-semibold text-lg">{vehicle.year}</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-sm text-gray-600">{t('vehicleDetails.condition')}</p>
          <p className="font-semibold text-lg">{vehicle.condition}</p>
        </div>
        {vehicle.model && (
          <div className="text-center">
            <p className="text-sm text-gray-600">Modelo</p>
            <p className="font-semibold text-lg">{vehicle.model}</p>
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
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.category')}</h4>
                <p className="text-lg">{vehicle.subcategory?.category?.name}</p>
              </div>
              {vehicle.subcategory && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.subcategory')}</h4>
                  <p className="text-lg">{vehicle.subcategory.name}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.brand')}</h4>
                <p className="text-lg">{vehicle.brand?.name}</p>
              </div>
              {(vehicle.location_city || vehicle.location_country) && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.location')}</h4>
                  <p className="text-lg">{[vehicle.location_city, vehicle.location_country].filter(Boolean).join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="specifications" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {vehicle.year && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.year')}</h4>
                  <p className="text-lg">{vehicle.year}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-600 mb-1">{t('vehicleDetails.condition')}</h4>
                <p className="text-lg">{vehicle.condition}</p>
              </div>
            </div>
            <div className="space-y-4">
              {vehicle.model && (
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">Modelo</h4>
                  <p className="text-lg">{vehicle.model}</p>
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
