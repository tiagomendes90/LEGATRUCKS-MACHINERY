import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import ProductList from '@/admin/ProductList';
import ProductForm from '@/admin/ProductForm';
import RealOrderManagement from '@/components/RealOrderManagement';
import { useVehicles } from '@/hooks/useVehicles';
import { Package, Star, TrendingUp, BarChart3, ExternalLink, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles({}, 1000);
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
    navigate('/');
  };

  const totalInventory = vehicles.length;
  const totalValue = vehicles.reduce((sum, v) => sum + (v as any).price_eur || 0, 0);
  const averagePrice = totalInventory > 0 ? totalValue / totalInventory : 0;
  const newVehicles = vehicles.filter(v => v.condition === 'new').length;
  const publishedVehicles = vehicles.filter(v => (v as any).is_published && v.is_active).length;
  const draftVehicles = vehicles.filter(v => !(v as any).is_published).length;
  const featuredVehicles = vehicles.filter(v => (v as any).is_featured).length;

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
        <h1 className="text-3xl font-bold">Bem-vindo, {user?.email}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Ir para Website
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Terminar Sessão
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Inventário Total</p>
                <p className="text-3xl font-bold text-foreground">{totalInventory}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {publishedVehicles} publicados | {draftVehicles} rascunhos
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                <p className="text-3xl font-bold text-foreground">€{(totalValue / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-muted-foreground mt-1">Total do inventário</p>
              </div>
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Preço Médio</p>
                <p className="text-3xl font-bold text-foreground">€{(averagePrice / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground mt-1">Por veículo</p>
              </div>
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Veículos Novos</p>
                <p className="text-3xl font-bold text-foreground">{newVehicles}</p>
                <p className="text-xs text-muted-foreground mt-1">{featuredVehicles} em destaque</p>
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="add-product">Adicionar Produto</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <ProductList />
        </TabsContent>

        <TabsContent value="add-product">
          <ProductForm />
        </TabsContent>

        <TabsContent value="orders">
          <RealOrderManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
