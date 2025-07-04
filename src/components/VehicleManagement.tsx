
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Edit, Trash2, Plus, Filter } from "lucide-react";
import { useVehicles, useDeleteVehicle } from "@/hooks/useVehicles";
import { useToast } from "@/hooks/use-toast";

export const VehicleManagement = () => {
  const { data: vehicles = [], isLoading } = useVehicles({}, 50);
  const deleteVehicleMutation = useDeleteVehicle();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const handleDeleteVehicle = (vehicleId: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      deleteVehicleMutation.mutate(vehicleId);
    }
  };

  const getStatusBadge = (vehicle: any) => {
    if (!vehicle.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (!vehicle.is_published) {
      return <Badge variant="secondary">Draft</Badge>;
    }
    if (vehicle.is_featured) {
      return <Badge className="bg-green-600">Featured</Badge>;
    }
    return <Badge className="bg-blue-600">Published</Badge>;
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
        <div className="text-lg">Loading vehicles...</div>
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
              <p className="text-sm text-gray-600">Total Vehicles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {vehicles.filter(v => v.is_published && v.is_active).length}
              </p>
              <p className="text-sm text-gray-600">Published</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {vehicles.filter(v => !v.is_published).length}
              </p>
              <p className="text-sm text-gray-600">Drafts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {vehicles.filter(v => v.is_featured).length}
              </p>
              <p className="text-sm text-gray-600">Featured</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Vehicle Management</CardTitle>
              <CardDescription>Manage your vehicle inventory</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                        <p className="text-sm text-gray-500">{vehicle.condition}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.subcategory?.name}</TableCell>
                  <TableCell>{vehicle.brand?.name}</TableCell>
                  <TableCell>{vehicle.registration_year}</TableCell>
                  <TableCell>€{vehicle.price_eur.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(vehicle)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={deleteVehicleMutation.isPending}
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
              No vehicles found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
