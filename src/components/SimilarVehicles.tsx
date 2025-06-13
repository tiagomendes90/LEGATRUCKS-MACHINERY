
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Truck } from "@/hooks/useTrucks";

interface SimilarVehiclesProps {
  vehicles: Truck[];
}

const SimilarVehicles = ({ vehicles }: SimilarVehiclesProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-8">{t('vehicleDetails.similarVehicles')}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map(vehicle => (
          <Card key={vehicle.id} className="group hover:shadow-lg transition-all duration-300">
            <div className="relative overflow-hidden">
              <img
                src={vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : "https://via.placeholder.com/400x200"}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <Badge className="absolute top-4 left-4">{vehicle.category}</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">{vehicle.brand} {vehicle.model}</CardTitle>
              <CardDescription className="text-xl text-primary font-semibold">
                ${vehicle.price.toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                <div>Ano: {vehicle.year}</div>
                <div>Estado: {vehicle.condition}</div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => navigate(`/vehicle/${vehicle.id}`)}
              >
                {t('common.viewDetails')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default SimilarVehicles;
