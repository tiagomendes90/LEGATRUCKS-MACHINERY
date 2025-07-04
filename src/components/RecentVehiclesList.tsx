
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLatestVehicles } from "@/hooks/useVehicleSearch";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface RecentVehiclesListProps {
  limit?: number;
  className?: string;
}

const RecentVehiclesList = ({ limit = 6, className = "" }: RecentVehiclesListProps) => {
  const { data: vehicles, isLoading, error } = useLatestVehicles(limit);
  const navigate = useNavigate();

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/vehicle/${vehicleId}`);
  };

  if (isLoading) {
    return (
      <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="w-full h-48" />
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar veículos recentes</p>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum veículo encontrado</p>
      </div>
    );
  }

  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {vehicles.map((vehicle) => (
        <Card 
          key={vehicle.id} 
          className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
          onClick={() => handleVehicleClick(vehicle.id)}
        >
          <div className="relative overflow-hidden">
            <img 
              src={vehicle.main_image_url || vehicle.images?.[0]?.image_url || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop"} 
              alt={vehicle.title} 
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <Badge className="absolute top-4 left-4 bg-blue-600">
              {vehicle.subcategory?.name || 'Veículo'}
            </Badge>
            <Badge className="absolute top-4 right-4 bg-green-600">
              Recente
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-xl">{vehicle.title}</CardTitle>
            <CardDescription className="text-2xl font-bold text-orange-600">
              €{vehicle.price_eur.toLocaleString()}
            </CardDescription>
            <div className="text-sm text-gray-500">
              {vehicle.registration_year} • {vehicle.condition}
              {vehicle.brand?.name && ` • ${vehicle.brand.name}`}
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-slate-800 hover:bg-slate-700"
              onClick={(e) => {
                e.stopPropagation();
                handleVehicleClick(vehicle.id);
              }}
            >
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RecentVehiclesList;
