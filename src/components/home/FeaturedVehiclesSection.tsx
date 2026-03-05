
import { useFeaturedVehicles } from "@/hooks/useFeaturedVehicles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const FeaturedVehiclesSection = () => {
  const { data: featuredProducts = [], isLoading } = useFeaturedVehicles();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!featuredProducts.length) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Produtos em Destaque</h2>
            <p className="text-gray-600 mb-8">Nenhum produto em destaque de momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Produtos em Destaque</h2>
          <p className="text-gray-600">Selecionados especialmente para si</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.slice(0, 6).map((item: any) => {
            const product = item.product;
            if (!product) return null;
            return (
              <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <img 
                    src={product.images?.[0]?.image_url || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=400&h=250&fit=crop"} 
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge className="absolute top-2 right-2 bg-red-600">Destaque</Badge>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                  <p className="text-gray-600 mb-2">{product.brand?.name} {product.year && `• ${product.year}`}</p>
                  <p className="text-lg font-bold text-primary mb-4">€{(product.price || 0).toLocaleString()}</p>
                  <Button 
                    onClick={() => navigate(`/vehicle/${product.id}`)}
                    className="w-full"
                  >
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeaturedVehiclesSection;
