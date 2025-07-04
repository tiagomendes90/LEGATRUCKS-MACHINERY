
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Edit, Trash2, Filter } from "lucide-react";
import { useVehicles, useDeleteVehicle } from "@/hooks/useVehicles";
import { useToast } from "@/hooks/use-toast";

export const VehicleManagement = () => {
  // Use includeUnpublished=true to show all vehicles in admin panel
  const { data: vehicles = [], isLoading } = useVehicles({}, 50, true);
  const deleteVehicleMutation = useDeleteVehicle();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const handleDeleteVehicle = (vehicleId: string) => {
    if (confirm('Tem a certeza de que deseja eliminar este veículo?')) {
      deleteVehicleMutation.mutate(vehicleId);
    }
  };

  const getStatusBadge = (vehicle: any) => {
    if (!vehicle.is_active) {
      return <Badge variant="destructive">Inativo</Badge>;
    }
    if (!vehicle.is_published) {
      return <Badge variant="secondary">Rascunho</Badge>;
    }
    if (vehicle.is_featured) {
      return <Badge className="bg-green-600">Destaque</Badge>;
    }
    return <Badge className="bg-blue-600">Publicado</Badge>;
  };

  // Display brand categories as badges
  const getBrandCategoriesBadges = (brand: any) => {
    if (!brand?.category || !Array.isArray(brand.category)) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {brand.category.map((cat: string, index: number) => (
          <Badge key={index} variant="outline" className="text-xs">
            {cat}
          </Badge>
        ))}
      </div>
    );
  };

  const filteredVehicles = statusFilter === "all" 
    ? vehicles 
    : vehicles.filter(vehicle => {
        switch (statusFilter) {
          case "published":
            return vehicle.is_published && vehicle.is_active;
          case "draft":
            return !vehicle.is_published;
          case "inactive":
            return !vehicle.is_active;
          case "featured":
            return vehicle.is_featured;
          default:
            return true;
        }
      });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">A carregar veículos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{vehicles.length}</p>
              <p className="text-sm text-gray-600">Total de Veículos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {vehicles.filter(v => v.is_published && v.is_active).length}
              </p>
              <p className="text-sm text-gray-600">Publicados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {vehicles.filter(v => !v.is_published).length}
              </p>
              <p className="text-sm text-gray-600">Rascunhos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {vehicles.filter(v => v.is_featured).length}
              </p>
              <p className="text-sm text-gray-600">Em Destaque</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestão de Veículos</CardTitle>
              <CardDescription>Gerir o inventário de veículos</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Veículos</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="featured">Em Destaque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img 
                        src={vehicle.main_image_url || vehicle.images?.[0]?.image_url || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=100&h=100&fit=crop"} 
                        alt={vehicle.title} 
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{vehicle.title}</p>
                        <p className="text-sm text-gray-500">
                          {vehicle.condition === 'new' ? 'Novo' : 
                           vehicle.condition === 'used' ? 'Usado' : 
                           vehicle.condition === 'restored' ? 'Restaurado' : 'Modificado'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.subcategory?.name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{vehicle.brand?.name}</p>
                      {getBrandCategoriesBadges(vehicle.brand)}
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.registration_year}</TableCell>
                  <TableCell>€{vehicle.price_eur.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(vehicle)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" title="Ver">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={deleteVehicleMutation.isPending}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredVehicles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum veículo encontrado com os critérios selecionados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
