
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Edit, Copy, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Truck } from "@/hooks/useTrucks";

interface InventoryTabProps {
  trucks: Truck[];
  onEditTruck: (truck: Truck) => void;
  onDuplicateTruck: (truck: Truck) => void;
  onDeleteTruck: (id: string) => void;
  isDeleting: boolean;
}

const InventoryTab = ({ trucks, onEditTruck, onDuplicateTruck, onDeleteTruck, isDeleting }: InventoryTabProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [conditionFilter, setConditionFilter] = useState("all");

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         truck.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCondition = conditionFilter === "all" || truck.condition === conditionFilter;
    return matchesSearch && matchesCondition;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('admin.vehicleInventory')}</CardTitle>
            <CardDescription>{t('admin.manageInventoryDesc')}</CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('admin.searchVehicles')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allConditions')}</SelectItem>
                <SelectItem value="new">{t('admin.new')}</SelectItem>
                <SelectItem value="used">{t('admin.used')}</SelectItem>
                <SelectItem value="certified">{t('admin.certified')}</SelectItem>
                <SelectItem value="refurbished">{t('admin.refurbished')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredTrucks.map((truck) => (
            <div key={truck.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{truck.brand} {truck.model}</h3>
                    <p className="text-gray-600">{truck.year} • {truck.condition} • {truck.mileage?.toLocaleString()} miles</p>
                    <p className="font-medium text-green-600">${truck.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={truck.condition === "new" ? "default" : "secondary"}>
                  {truck.condition}
                </Badge>
                <Badge variant="outline">
                  {truck.category}
                </Badge>
                {truck.subcategory && (
                  <Badge variant="outline">
                    {truck.subcategory}
                  </Badge>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEditTruck(truck)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDuplicateTruck(truck)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onDeleteTruck(truck.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredTrucks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('admin.noVehiclesFound')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryTab;
