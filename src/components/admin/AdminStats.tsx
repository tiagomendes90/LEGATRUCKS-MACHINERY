
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign, BarChart3, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Truck } from "@/hooks/useTrucks";

interface AdminStatsProps {
  trucks: Truck[];
}

const AdminStats = ({ trucks }: AdminStatsProps) => {
  const { t } = useTranslation();

  const stats = [
    { 
      title: t('admin.totalInventory'), 
      value: trucks.length.toString(), 
      icon: <Package className="h-8 w-8" />, 
      color: "bg-blue-500" 
    },
    { 
      title: t('admin.totalValue'), 
      value: trucks.length > 0 ? `$${(trucks.reduce((sum, truck) => sum + truck.price, 0) / 1000000).toFixed(1)}M` : "$0", 
      icon: <DollarSign className="h-8 w-8" />, 
      color: "bg-green-500" 
    },
    { 
      title: t('admin.avgPrice'), 
      value: trucks.length > 0 ? `$${Math.round(trucks.reduce((sum, truck) => sum + truck.price, 0) / trucks.length / 1000)}K` : "$0", 
      icon: <BarChart3 className="h-8 w-8" />, 
      color: "bg-purple-500" 
    },
    { 
      title: t('admin.newVehicles'), 
      value: trucks.filter(truck => truck.condition === "new").length.toString(), 
      icon: <Users className="h-8 w-8" />, 
      color: "bg-orange-500" 
    }
  ];

  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;
