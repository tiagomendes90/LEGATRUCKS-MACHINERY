import { useEffect, useState } from 'react';
import { supabase } from '@/admin/supabaseClient';
import ProductList from '@/admin/ProductList';
import ProductForm from '@/admin/ProductForm';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RealOrderManagement from '@/components/RealOrderManagement';
import { Package, TrendingUp, ExternalLink, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, brand:brands(name, slug), images:product_images(image_url, sort_order)');
    setProducts(data || []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

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

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bem-vindo, {user?.email}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Website
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Produtos</p>
                <p className="text-3xl font-bold text-foreground">{products.length}</p>
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
                <p className="text-3xl font-bold text-foreground">
                  €{products.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="add-product">
            {editing ? 'Editar Produto' : 'Adicionar Produto'}
          </TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <ProductList />
        </TabsContent>

        <TabsContent value="add-product">
          <ProductForm
            editingProduct={editing}
            onSuccess={() => {
              setEditing(null);
              loadProducts();
            }}
            onCancel={() => setEditing(null)}
          />
        </TabsContent>

        <TabsContent value="orders">
          <RealOrderManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
