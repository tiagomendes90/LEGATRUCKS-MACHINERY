import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Users, Package, DollarSign, BarChart3, LogOut, Search, Filter, Home, Upload, X } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Admin = () => {
  const { t } = useTranslation();
  const { data: trucks = [], isLoading } = useTrucks();
  const addTruckMutation = useAddTruck();
  const deleteTruckMutation = useDeleteTruck();
  const updateTruckMutation = useUpdateTruck();
  const addSpecificationsMutation = useAddVehicleSpecifications();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  // Move newTruck state declaration BEFORE the hooks that depend on it
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

  // Now these hooks can access newTruck.category safely
  const { data: allBrands = [] } = useBrands(newTruck.category);
  const { data: subcategoryOptions = [] } = useFilterOptions(newTruck.category || 'trucks', 'subcategory');

  const [vehicleSpecifications, setVehicleSpecifications] = useState<Partial<VehicleSpecifications>>({});
  const [vehicleMedia, setVehicleMedia] = useState({
    photos: [] as string[],
    videos: [] as string[]
  });

  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [activeAddTruckTab, setActiveAddTruckTab] = useState("basic-info");

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

  // Reset subcategory and brand when category changes
  const handleCategoryChange = (category: string) => {
    setNewTruck({
      ...newTruck,
      category,
      subcategory: "", // Reset subcategory
      brand: "" // Reset brand
    });
  };

  const switchToTab = (tabValue: string) => {
    setActiveAddTruckTab(tabValue);
    // Use a small delay to ensure the tab content is rendered
    setTimeout(() => {
      const tabTrigger = document.querySelector(`[data-value="${tabValue}"]`) as HTMLElement;
      if (tabTrigger) {
        tabTrigger.click();
      }
    }, 100);
  };

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
      images: [...newTruck.images, ...vehicleMedia.photos, ...vehicleMedia.videos]
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
      setVehicleMedia({ photos: [], videos: [] });
      setActiveAddTruckTab("basic-info");
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
      title: t('admin.signedOut'),
      description: t('admin.signOutSuccess'),
    });
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleAddPhoto = (photoUrl: string) => {
    setVehicleMedia(prev => ({
      ...prev,
      photos: [...prev.photos, photoUrl]
    }));
  };

  const handleRemovePhoto = (index: number) => {
    setVehicleMedia(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleAddVideo = (videoUrl: string) => {
    setVehicleMedia(prev => ({
      ...prev,
      videos: [...prev.videos, videoUrl]
    }));
  };

  const handleRemoveVideo = (index: number) => {
    setVehicleMedia(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         truck.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCondition = conditionFilter === "all" || truck.condition === conditionFilter;
    return matchesSearch && matchesCondition;
  });

  const stats = [
    { title: t('admin.totalInventory'), value: trucks.length.toString(), icon: <Package className="h-8 w-8" />, color: "bg-blue-500" },
    { title: t('admin.totalValue'), value: `$${(trucks.reduce((sum, truck) => sum + truck.price, 0) / 1000000).toFixed(1)}M`, icon: <DollarSign className="h-8 w-8" />, color: "bg-green-500" },
    { title: t('admin.avgPrice'), value: `$${trucks.length > 0 ? Math.round(trucks.reduce((sum, truck) => sum + truck.price, 0) / trucks.length / 1000) : 0}K`, icon: <BarChart3 className="h-8 w-8" />, color: "bg-purple-500" },
    { title: t('admin.newVehicles'), value: trucks.filter(truck => truck.condition === "new").length.toString(), icon: <Users className="h-8 w-8" />, color: "bg-orange-500" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">{t('admin.title')}</h1>
            <p className="text-gray-600">{t('admin.welcome')}, {user?.email}</p>
          </div>
          <div className="space-x-2">
            <Button onClick={handleGoHome} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              {t('common.legarWebsite')}
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              {t('admin.signOut')}
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
            <TabsTrigger value="inventory">{t('admin.inventory')}</TabsTrigger>
            <TabsTrigger value="featured">{t('admin.featured')}</TabsTrigger>
            <TabsTrigger value="add-truck">{t('admin.addVehicle')}</TabsTrigger>
            <TabsTrigger value="orders">{t('admin.orders')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('admin.analytics')}</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
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
                      {t('admin.noVehiclesFound')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured">
            <FeaturedTrucksManager />
          </TabsContent>

          <TabsContent value="orders">
            <RealOrderManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="add-truck">
            <Tabs value={activeAddTruckTab} onValueChange={setActiveAddTruckTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic-info" data-value="basic-info">{t('admin.basicInfo')}</TabsTrigger>
                <TabsTrigger value="specifications" data-value="specifications">{t('admin.specifications')}</TabsTrigger>
                <TabsTrigger value="media" data-value="media">{t('admin.photosVideos')}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic-info">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.addVehicle')}</CardTitle>
                    <CardDescription>Add a new vehicle to your inventory with basic information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddTruck} className="space-y-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <Label htmlFor="category">{t('admin.category')} *</Label>
                          <Select onValueChange={handleCategoryChange} value={newTruck.category}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('admin.selectCategory')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="trucks">{t('admin.trucks')}</SelectItem>
                              <SelectItem value="machinery">{t('admin.machinery')}</SelectItem>
                              <SelectItem value="agriculture">{t('admin.agriculture')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="subcategory">{t('admin.subcategory')}</Label>
                          <Select 
                            onValueChange={(value) => setNewTruck({...newTruck, subcategory: value})}
                            value={newTruck.subcategory}
                            disabled={!newTruck.category}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={!newTruck.category ? t('admin.selectCategory') : t('admin.selectSubcategory')} />
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
                          <Label htmlFor="brand">{t('admin.brand')} *</Label>
                          <Select 
                            onValueChange={(value) => setNewTruck({...newTruck, brand: value})}
                            value={newTruck.brand}
                            disabled={!newTruck.category}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={!newTruck.category ? t('admin.selectCategory') : t('admin.selectBrand')} />
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
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="model">{t('admin.model')} *</Label>
                          <Input
                            id="model"
                            value={newTruck.model}
                            onChange={(e) => setNewTruck({...newTruck, model: e.target.value})}
                            placeholder="FH16"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="condition">{t('admin.condition')} *</Label>
                          <Select onValueChange={(value) => setNewTruck({...newTruck, condition: value})} value={newTruck.condition}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('admin.selectCondition')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">{t('admin.new')}</SelectItem>
                              <SelectItem value="used">{t('admin.used')}</SelectItem>
                              <SelectItem value="certified">{t('admin.certifiedPreOwned')}</SelectItem>
                              <SelectItem value="refurbished">{t('admin.refurbished')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <Label htmlFor="year">{t('admin.year')} *</Label>
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
                          <Label htmlFor="mileage">{t('admin.mileage')}</Label>
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
                          <Label htmlFor="price">{t('admin.price')} *</Label>
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

                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <Label htmlFor="engine">{t('admin.engine')}</Label>
                          <Select onValueChange={(value) => setNewTruck({...newTruck, engine: value})} value={newTruck.engine}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('admin.selectEngine')} />
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
                          <Label htmlFor="transmission">{t('admin.transmission')}</Label>
                          <Select onValueChange={(value) => setNewTruck({...newTruck, transmission: value})} value={newTruck.transmission}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('admin.selectTransmission')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">{t('admin.manual')}</SelectItem>
                              <SelectItem value="automatic">{t('admin.automatic')}</SelectItem>
                              <SelectItem value="automated-manual">{t('admin.automatedManual')}</SelectItem>
                              <SelectItem value="cvt">{t('admin.cvt')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="horsepower">{t('admin.horsepower')}</Label>
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

                      <div>
                        <Label htmlFor="description">{t('admin.description')} *</Label>
                        <Textarea
                          id="description"
                          value={newTruck.description}
                          onChange={(e) => setNewTruck({...newTruck, description: e.target.value})}
                          placeholder={t('admin.descriptionPlaceholder')}
                          rows={4}
                          required
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button 
                          type="submit" 
                          className="flex-1" 
                          disabled={addTruckMutation.isPending || addSpecificationsMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {addTruckMutation.isPending || addSpecificationsMutation.isPending ? t('admin.addingVehicle') : t('admin.addVehicleToInventory')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => switchToTab("specifications")}
                          className="flex-1"
                        >
                          {t('admin.continueToSpecs')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specifications">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.specifications')}</CardTitle>
                    <CardDescription>Add detailed technical specifications and features for the vehicle</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VehicleSpecificationsForm
                      specifications={vehicleSpecifications}
                      onSpecificationsChange={setVehicleSpecifications}
                    />
                    <div className="mt-6 flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => switchToTab("basic-info")}
                        className="flex-1"
                      >
                        {t('admin.backToBasicInfo')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => switchToTab("media")}
                        className="flex-1"
                      >
                        {t('admin.continueToMedia')}
                      </Button>
                      <Button 
                        onClick={handleAddTruck}
                        className="flex-1" 
                        disabled={addTruckMutation.isPending || addSpecificationsMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {addTruckMutation.isPending || addSpecificationsMutation.isPending ? t('admin.addVehicleWithSpecs') : t('admin.addVehicleWithSpecs')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.photosVideos')}</CardTitle>
                    <CardDescription>Add photos and videos to showcase the vehicle</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Photos Section */}
                    <div>
                      <Label className="text-base font-medium">{t('admin.vehiclePhotos')}</Label>
                      <div className="mt-2 space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder={t('admin.enterPhotoUrl')}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                if (input.value.trim()) {
                                  handleAddPhoto(input.value.trim());
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.querySelector(`input[placeholder="${t('admin.enterPhotoUrl')}"]`) as HTMLInputElement;
                              if (input?.value.trim()) {
                                handleAddPhoto(input.value.trim());
                                input.value = '';
                              }
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {t('admin.addPhoto')}
                          </Button>
                        </div>
                        {vehicleMedia.photos.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {vehicleMedia.photos.map((photo, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={photo}
                                  alt={`Vehicle photo ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleRemovePhoto(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Videos Section */}
                    <div>
                      <Label className="text-base font-medium">{t('admin.vehicleVideos')}</Label>
                      <div className="mt-2 space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder={t('admin.enterVideoUrl')}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                if (input.value.trim()) {
                                  handleAddVideo(input.value.trim());
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.querySelector(`input[placeholder="${t('admin.enterVideoUrl')}"]`) as HTMLInputElement;
                              if (input?.value.trim()) {
                                handleAddVideo(input.value.trim());
                                input.value = '';
                              }
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {t('admin.addVideo')}
                          </Button>
                        </div>
                        {vehicleMedia.videos.length > 0 && (
                          <div className="space-y-4">
                            {vehicleMedia.videos.map((video, index) => (
                              <div key={index} className="relative group p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-gray-600 truncate mr-4">{video}</p>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveVideo(index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => switchToTab("specifications")}
                        className="flex-1"
                      >
                        {t('admin.backToSpecs')}
                      </Button>
                      <Button 
                        onClick={handleAddTruck}
                        className="flex-1" 
                        disabled={addTruckMutation.isPending || addSpecificationsMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {addTruckMutation.isPending || addSpecificationsMutation.isPending ? t('admin.addingVehicle') : t('admin.addVehicleWithMedia')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
