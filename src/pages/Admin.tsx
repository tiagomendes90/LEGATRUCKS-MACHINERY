import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Users, Package, DollarSign, BarChart3, LogOut, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTrucks, useAddTruck, useDeleteTruck, Truck } from "@/hooks/useTrucks";
import { useUpdateTruck } from "@/hooks/useUpdateTruck";
import { useAddVehicleSpecifications, VehicleSpecifications } from "@/hooks/useVehicleSpecifications";
import EditTruckModal from "@/components/EditTruckModal";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import RealOrderManagement from "@/components/RealOrderManagement";
import FeaturedTrucksManager from "@/components/FeaturedTrucksManager";
import VehicleSpecificationsForm from "@/components/VehicleSpecificationsForm";
import { ensureAdminProfile, forceCreateAdminProfile } from "@/utils/adminSetup";
import { supabase } from "@/integrations/supabase/client";
import { useBrands } from "@/hooks/useBrands";
import { useFilterOptions } from "@/hooks/useFilterOptions";

const Admin = () => {
  const { data: trucks = [], isLoading } = useTrucks();
  const addTruckMutation = useAddTruck();
  const deleteTruckMutation = useDeleteTruck();
  const updateTruckMutation = useUpdateTruck();
  const addSpecificationsMutation = useAddVehicleSpecifications();
  const { signOut, user } = useAuth();

  const { data: allBrands = [] } = useBrands();
  const { data: subcategoryOptions = [] } = useFilterOptions('trucks', 'subcategory');

  const [newTruck, setNewTruck] = useState({
    brand: "",
    model: "",
    year: "",
    mileage: "",
    price: "",
    condition: "",
    engine: "",
    transmission: "",
    description: "",
    horsepower: "",
    category: "",
    subcategory: "",
    features: [] as string[],
    images: [] as string[]
  });

  const [vehicleSpecifications, setVehicleSpecifications] = useState<Partial<VehicleSpecifications>>({});

  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [conditionFilter, setConditionFilter] = useState("all");

  const { toast } = useToast();

  // Enhanced admin profile setup on component mount
  useEffect(() => {
    const setupAdmin = async () => {
      if (user) {
        try {
          console.log('Setting up admin profile for:', user.email);
          await ensureAdminProfile();
          console.log('Admin profile setup completed');
          
          // Verify the profile was created correctly
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          console.log('Current profile:', profile);
          
          if (!profile || profile.role !== 'admin') {
            console.log('Profile verification failed, force creating...');
            await forceCreateAdminProfile();
          }
        } catch (error) {
          console.error('Failed to set up admin profile:', error);
          toast({
            title: "Profile Setup Error",
            description: "Failed to set up admin profile. Attempting force creation...",
            variant: "destructive",
          });
          
          try {
            await forceCreateAdminProfile();
            toast({
              title: "Profile Created",
              description: "Admin profile created successfully.",
            });
          } catch (forceError) {
            console.error('Force creation failed:', forceError);
            toast({
              title: "Critical Error",
              description: "Unable to create admin profile. Please contact support.",
              variant: "destructive",
            });
          }
        }
      }
    };

    setupAdmin();
  }, [user, toast]);

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const truckData = {
      brand: newTruck.brand,
      model: newTruck.model,
      year: parseInt(newTruck.year),
      mileage: parseInt(newTruck.mileage) || 0,
      price: parseFloat(newTruck.price),
      condition: newTruck.condition,
      engine: newTruck.engine,
      transmission: newTruck.transmission,
      description: newTruck.description,
      horsepower: parseInt(newTruck.horsepower) || 0,
      category: newTruck.category,
      subcategory: newTruck.subcategory,
      features: newTruck.features,
      images: newTruck.images
    };

    try {
      const addedTruck = await addTruckMutation.mutateAsync(truckData);
      
      // If truck was added successfully and there are specifications, add them
      if (addedTruck && Object.keys(vehicleSpecifications).length > 0) {
        const specsWithTruckId = {
          ...vehicleSpecifications,
          truck_id: addedTruck.id
        } as VehicleSpecifications;
        
        await addSpecificationsMutation.mutateAsync(specsWithTruckId);
      }

      // Reset forms
      setNewTruck({
        brand: "",
        model: "",
        year: "",
        mileage: "",
        price: "",
        condition: "",
        engine: "",
        transmission: "",
        description: "",
        horsepower: "",
        category: "",
        subcategory: "",
        features: [],
        images: []
      });
      setVehicleSpecifications({});
    } catch (error) {
      console.error('Failed to add truck:', error);
    }
  };

  const handleDeleteTruck = (id: string) => {
    deleteTruckMutation.mutate(id);
  };

  const handleEditTruck = (truck: Truck) => {
    setEditingTruck(truck);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updates: Partial<Truck>) => {
    if (editingTruck) {
      updateTruckMutation.mutate({ id: editingTruck.id, updates });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });
  };

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         truck.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCondition = conditionFilter === "all" || truck.condition === conditionFilter;
    return matchesSearch && matchesCondition;
  });

  const stats = [
    { title: "Total Inventory", value: trucks.length.toString(), icon: <Package className="h-8 w-8" />, color: "bg-blue-500" },
    { title: "Total Value", value: `$${(trucks.reduce((sum, truck) => sum + truck.price, 0) / 1000000).toFixed(1)}M`, icon: <DollarSign className="h-8 w-8" />, color: "bg-green-500" },
    { title: "Avg. Price", value: `$${trucks.length > 0 ? Math.round(trucks.reduce((sum, truck) => sum + truck.price, 0) / trucks.length / 1000) : 0}K`, icon: <BarChart3 className="h-8 w-8" />, color: "bg-purple-500" },
    { title: "New Vehicles", value: trucks.filter(truck => truck.condition === "new").length.toString(), icon: <Users className="h-8 w-8" />, color: "bg-orange-500" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.email}</p>
          </div>
          <div className="space-x-2">
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
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

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="add-truck">Add Vehicle</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Vehicle Inventory</CardTitle>
                    <CardDescription>Manage your vehicle inventory and update availability</CardDescription>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search vehicles..."
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
                        <SelectItem value="all">All Conditions</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="certified">Certified</SelectItem>
                        <SelectItem value="refurbished">Refurbished</SelectItem>
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
                            onClick={() => handleEditTruck(truck)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteTruck(truck.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={deleteTruckMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredTrucks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No vehicles found matching your criteria.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured">
            <FeaturedTrucksManager />
          </TabsContent>

          <TabsContent value="add-truck">
            <Tabs defaultValue="basic-info" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic-info">Basic Information</TabsTrigger>
                <TabsTrigger value="specifications">Technical Specifications</TabsTrigger>
              </TabsList>

              <TabsContent value="basic-info">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Vehicle</CardTitle>
                    <CardDescription>Add a new vehicle to your inventory with basic information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddTruck} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="brand">Brand</Label>
                          <Select onValueChange={(value) => setNewTruck({...newTruck, brand: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                            <SelectContent>
                              {allBrands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.slug}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="model">Model</Label>
                          <Input
                            id="model"
                            value={newTruck.model}
                            onChange={(e) => setNewTruck({...newTruck, model: e.target.value})}
                            placeholder="FH16"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <Label htmlFor="year">Year</Label>
                          <Input
                            id="year"
                            type="number"
                            value={newTruck.year}
                            onChange={(e) => setNewTruck({...newTruck, year: e.target.value})}
                            placeholder="2024"
                            min="2000"
                            max="2024"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="mileage">Mileage</Label>
                          <Input
                            id="mileage"
                            type="number"
                            value={newTruck.mileage}
                            onChange={(e) => setNewTruck({...newTruck, mileage: e.target.value})}
                            placeholder="50000"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="price">Price ($)</Label>
                          <Input
                            id="price"
                            type="number"
                            value={newTruck.price}
                            onChange={(e) => setNewTruck({...newTruck, price: e.target.value})}
                            placeholder="125000"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-6">
                        <div>
                          <Label htmlFor="condition">Condition</Label>
                          <Select onValueChange={(value) => setNewTruck({...newTruck, condition: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="used">Used</SelectItem>
                              <SelectItem value="certified">Certified Pre-Owned</SelectItem>
                              <SelectItem value="refurbished">Refurbished</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select onValueChange={(value) => setNewTruck({...newTruck, category: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="trucks">Trucks</SelectItem>
                              <SelectItem value="machinery">Machinery</SelectItem>
                              <SelectItem value="agriculture">Agriculture</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="subcategory">Subcategory</Label>
                          <Select onValueChange={(value) => setNewTruck({...newTruck, subcategory: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subcategory" />
                            </SelectTrigger>
                            <SelectContent>
                              {subcategoryOptions.map((option) => (
                                <SelectItem key={option.id} value={option.option_value}>
                                  {option.option_label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="horsepower">Horsepower</Label>
                          <Input
                            id="horsepower"
                            type="number"
                            value={newTruck.horsepower}
                            onChange={(e) => setNewTruck({...newTruck, horsepower: e.target.value})}
                            placeholder="500"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="engine">Engine</Label>
                          <Select onValueChange={(value) => setNewTruck({...newTruck, engine: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select engine" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cummins-x15">Cummins X15</SelectItem>
                              <SelectItem value="detroit-dd15">Detroit DD15</SelectItem>
                              <SelectItem value="caterpillar-c15">Caterpillar C15</SelectItem>
                              <SelectItem value="paccar-px-9">Paccar PX-9</SelectItem>
                              <SelectItem value="volvo-d13">Volvo D13</SelectItem>
                              <SelectItem value="mack-mp8">Mack MP8</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="transmission">Transmission</Label>
                          <Select onValueChange={(value) => setNewTruck({...newTruck, transmission: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transmission" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="automatic">Automatic</SelectItem>
                              <SelectItem value="automated-manual">Automated Manual</SelectItem>
                              <SelectItem value="cvt">CVT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newTruck.description}
                          onChange={(e) => setNewTruck({...newTruck, description: e.target.value})}
                          placeholder="Detailed description of the vehicle, features, and selling points..."
                          rows={4}
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={addTruckMutation.isPending || addSpecificationsMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {addTruckMutation.isPending || addSpecificationsMutation.isPending ? "Adding Vehicle..." : "Add Vehicle to Inventory"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Specifications</CardTitle>
                    <CardDescription>Add detailed technical specifications and features for the vehicle</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VehicleSpecificationsForm
                      specifications={vehicleSpecifications}
                      onSpecificationsChange={setVehicleSpecifications}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="orders">
            <RealOrderManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>

        <EditTruckModal 
          truck={editingTruck}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTruck(null);
          }}
          onSave={handleSaveEdit}
        />
      </div>
    </div>
  );
};

export default Admin;
