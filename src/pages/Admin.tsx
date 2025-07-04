import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RealOrderManagement from "@/components/RealOrderManagement";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { VehicleManagement } from "@/components/VehicleManagement";
import AddVehicleForm from "@/components/AddVehicleForm";
import { useVehicles } from "@/hooks/useVehicles";
import { useOrders } from "@/hooks/useOrders";
import { Plus, Package, Star, TrendingUp, BarChart3, ExternalLink, LogOut } from "lucide-react";

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles({}, 1000);
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">A carregar...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleGoToWebsite = () => {
    navigate("/");
  };

  // Calculate statistics from real data
  const totalInventory = vehicles.length;
  const totalValue = vehicles.reduce((sum, vehicle) => sum + vehicle.price_eur, 0);
  const averagePrice = totalInventory > 0 ? totalValue / totalInventory : 0;
  const newVehicles = vehicles.filter(v => v.condition === 'new').length;
  const publishedVehicles = vehicles.filter(v => v.is_published && v.is_active).length;
  const draftVehicles = vehicles.filter(v => !v.is_published).length;
  const featuredVehicles = vehicles.filter(v => v.is_featured).length;

  // Loading state
  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">A carregar dados...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bem-vindo, geral@lega.pt</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGoToWebsite}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Ir para Website
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Terminar Sessão
          </Button>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inventário Total</p>
                <p className="text-3xl font-bold">{totalInventory}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {publishedVehicles} publicados | {draftVehicles} rascunhos
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                <p className="text-3xl font-bold">€{(totalValue / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-gray-500 mt-1">
                  Total do inventário
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Preço Médio</p>
                <p className="text-3xl font-bold">€{(averagePrice / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500 mt-1">
                  Por veículo
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Veículos Novos</p>
                <p className="text-3xl font-bold">{newVehicles}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {featuredVehicles} em destaque
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="add-vehicle">Adicionar Veículo</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <VehicleManagement />
        </TabsContent>

        <TabsContent value="add-vehicle">
          <AddVehicleForm />
        </TabsContent>

        <TabsContent value="orders">
          <RealOrderManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
