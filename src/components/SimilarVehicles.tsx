
import React from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SimilarVehiclesProps {
  vehicleId: string;
  subcategoryId: string;
}

const SimilarVehicles: React.FC<SimilarVehiclesProps> = ({ vehicleId, subcategoryId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { data: vehicles, isLoading } = useVehicles(
    { subcategory: subcategoryId },
    6
  );

  // Filter out the current vehicle
  const similarVehicles = vehicles?.filter(v => v.id !== vehicleId) || [];

  if (isLoading || similarVehicles.length === 0) {
    return null;
  }

  const handleVehicleClick = (vehicle: any) => {
    navigate(`/vehicle/${vehicle.id}`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t('vehicleDetails.similarVehicles')}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarVehicles.slice(0, 3).map((vehicle) => (
          <Card key={vehicle.id} className="group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleVehicleClick(vehicle)}>
            <div className="relative overflow-hidden">
              <img 
                src={vehicle.main_image_url || vehicle.images?.[0]?.image_url || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=400&h=250&fit=crop"} 
                alt={vehicle.title} 
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <Badge className="absolute top-3 left-3 bg-blue-600">
                {vehicle.subcategory?.name}
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-2">{vehicle.title}</CardTitle>
              <div className="text-xl font-bold text-orange-600">
                €{vehicle.price_eur.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                {vehicle.registration_year} • {vehicle.condition}
                {vehicle.mileage_km && ` • ${vehicle.mileage_km.toLocaleString()} km`}
                {vehicle.operating_hours && ` • ${vehicle.operating_hours.toLocaleString()} h`}
              </div>
              <Button 
                className="w-full bg-slate-800 hover:bg-slate-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVehicleClick(vehicle);
                }}
              >
                {t('common.viewDetails')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SimilarVehicles;
