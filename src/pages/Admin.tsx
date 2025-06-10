import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTrucks, Truck } from "@/hooks/useTrucks";
import { useAddTruck, useDeleteTruck } from "@/hooks/useTrucks";
import { useUpdateTruck } from "@/hooks/useUpdateTruck";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Truck,
  DollarSign,
  TrendingUp,
  Star,
  Edit,
  Trash2,
} from 'lucide-react';
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useBrands } from "@/hooks/useBrands";
import { useAuth } from "@/hooks/useAuth";

const Admin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();

  const [activeTab, setActiveTab] = useState("inventory");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Truck>>({
    category: "trucks",
    condition: "new",
    engine: "cummins-x15",
    transmission: "manual",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  const { data: trucks = [], isLoading: isLoadingTrucks } = useTrucks();
  const { data: subcategoryOptions = [] } = useFilterOptions(formData.category || 'trucks', 'subcategory');
  const { data: brands = [] } = useBrands(formData.category || 'trucks');
  const addVehicle = useAddTruck();
  const updateVehicle = useUpdateTruck();
  const deleteVehicle = useDeleteTruck();
  
  // Calculate real analytics data from actual trucks
  const totalInventory = trucks.length;
  const totalValue = trucks.reduce((sum, truck) => sum + (truck.price || 0), 0);
  const avgPrice = totalInventory > 0 ? totalValue / totalInventory : 0;
  const newVehicles = trucks.filter(truck => truck.condition === 'new').length;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t('admin.signOutSuccess'),
        description: t('admin.signedOut'),
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCategoryChange = (value: string) => {
    setFormData({ ...formData, category: value, subcategory: '' });
  };

  const handleAddPhoto = () => {
    const photoUrl = prompt(t('admin.enterPhotoUrl'));
    if (photoUrl) {
      setPhotos([...photos, photoUrl]);
    }
  };

  const handleAddVideo = () => {
    const videoUrl = prompt(t('admin.enterVideoUrl'));
    if (videoUrl) {
      setVideos([...videos, videoUrl]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.brand || !formData.model || !formData.year || !formData.price || !formData.condition || !formData.engine || !formData.transmission || !formData.description) {
      toast({
        title: t('common.error'),
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const truckData = {
      ...formData,
      year: Number(formData.year),
      mileage: Number(formData.mileage),
      price: Number(formData.price),
      horsepower: Number(formData.horsepower),
      images: photos,
    };

    try {
      if (editingVehicleId) {
        // Update existing vehicle
        await updateVehicle.mutateAsync({ id: editingVehicleId, updates: truckData });
        toast({
          title: "Success",
          description: "Truck updated successfully!",
        });
      } else {
        // Add new vehicle
        await addVehicle.mutateAsync(truckData);
        toast({
          title: "Success",
          description: "Truck added successfully!",
        });
      }

      // Reset form and state
      setFormData({
        category: "trucks",
        condition: "new",
        engine: "cummins-x15",
        transmission: "manual",
      });
      setPhotos([]);
      setVideos([]);
      setCoverImageIndex(0);
      setEditingVehicleId(null);
      setActiveTab('inventory');
      setCurrentStep(1);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to add/update vehicle',
        variant: 'destructive',
      });
    }
  };

  const handleEditVehicle = (vehicle: Truck) => {
    // Pre-fill the form with vehicle data
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model,
      category: vehicle.category || '',
      subcategory: vehicle.subcategory || '',
      condition: vehicle.condition,
      year: vehicle.year,
      mileage: vehicle.mileage || 0,
      price: vehicle.price,
      engine: vehicle.engine,
      transmission: vehicle.transmission,
      horsepower: vehicle.horsepower || 0,
      description: vehicle.description
    });
    
    setPhotos(vehicle.images || []);
    setVideos([]);
    setCoverImageIndex(0);
    
    // Set the vehicle ID for editing
    setEditingVehicleId(vehicle.id);
    
    // Switch to add vehicle view
    setActiveTab('add');
    setCurrentStep(1);
  };

  const filteredTrucks = trucks.filter((truck) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      truck.brand.toLowerCase().includes(searchTerm) ||
      truck.model.toLowerCase().includes(searchTerm) ||
      truck.description.toLowerCase().includes(searchTerm)
    );
  });

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">{t('admin.category')}</Label>
          <Select onValueChange={handleCategoryChange} defaultValue={formData.category || "trucks"}>
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
          <Select onValueChange={(value) => setFormData({ ...formData, subcategory: value })} defaultValue={formData.subcategory || ''}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.selectSubcategory')} />
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
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="brand">{t('admin.brand')}</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, brand: value })} defaultValue={formData.brand || ''}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.selectBrand')} />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.slug}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="model">{t('admin.model')}</Label>
          <Input
            type="text"
            id="model"
            name="model"
            value={formData.model || ""}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="condition">{t('admin.condition')}</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, condition: value })} defaultValue={formData.condition || "new"}>
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
        <div>
          <Label htmlFor="year">{t('admin.year')}</Label>
          <Input
            type="number"
            id="year"
            name="year"
            value={formData.year || ""}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="mileage">{t('admin.mileage')}</Label>
          <Input
            type="number"
            id="mileage"
            name="mileage"
            value={formData.mileage || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <Button onClick={() => setCurrentStep(2)}>
        {t('admin.continueToSpecifications')}
      </Button>
    </div>
  );

  const renderSpecifications = () => (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">{t('admin.price')}</Label>
          <Input
            type="number"
            id="price"
            name="price"
            value={formData.price || ""}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="engine">{t('admin.engine')}</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, engine: value })} defaultValue={formData.engine || "cummins-x15"}>
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
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="transmission">{t('admin.transmission')}</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, transmission: value })} defaultValue={formData.transmission || "manual"}>
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
            type="number"
            id="horsepower"
            name="horsepower"
            value={formData.horsepower || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">{t('admin.description')}</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleInputChange}
          placeholder={t('admin.descriptionPlaceholder')}
          rows={4}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          {t('admin.backToBasicInfo')}
        </Button>
        <Button onClick={() => setCurrentStep(3)}>
          {t('admin.continueToMedia')}
        </Button>
      </div>
    </div>
  );

  const renderPhotosVideos = () => (
    <div className="space-y-4">
      <div>
        <Label>{t('admin.vehiclePhotos')}</Label>
        <div className="flex space-x-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative w-32 h-24 rounded-md overflow-hidden">
              <img
                src={photo}
                alt={`Vehicle Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === coverImageIndex && (
                <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold">Cover</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1"
                onClick={() => {
                  const newPhotos = [...photos];
                  newPhotos.splice(index, 1);
                  setPhotos(newPhotos);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddPhoto}>
            {t('admin.addPhoto')}
          </Button>
        </div>
      </div>

      <div>
        <Label>{t('admin.vehicleVideos')}</Label>
        <div className="flex space-x-2">
          {videos.map((video, index) => (
            <div key={index} className="relative w-32 h-24 rounded-md overflow-hidden">
              <video src={video} controls className="w-full h-full object-cover"></video>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1"
                onClick={() => {
                  const newVideos = [...videos];
                  newVideos.splice(index, 1);
                  setVideos(newVideos);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddVideo}>
            {t('admin.addVideo')}
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>
          {t('admin.backToSpecs')}
        </Button>
        <Button type="submit" disabled={addVehicle.isPending || updateVehicle.isPending}>
          {addVehicle.isPending || updateVehicle.isPending
            ? t('admin.addingVehicle')
            : t('admin.addVehicleWithMedia')}
        </Button>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">{t('admin.analytics')}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalInventory')}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInventory}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalValue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.avgPrice')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(avgPrice).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.newVehicles')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newVehicles}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('admin.vehicleInventory')}</h2>
        <Input
          type="search"
          placeholder={t('admin.searchVehicles')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="grid gap-6">
        {filteredTrucks.map((truck) => (
          <Card key={truck.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{truck.brand} {truck.model}</h3>
                  <p className="text-sm text-muted-foreground">
                    {truck.year} • {truck.condition} • ${truck.price?.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditVehicle(truck)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteVehicle.mutate(truck.id)}
                    disabled={deleteVehicle.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Category:</span> {truck.category}
                </div>
                <div>
                  <span className="font-medium">Engine:</span> {truck.engine}
                </div>
                <div>
                  <span className="font-medium">Transmission:</span> {truck.transmission}
                </div>
                <div>
                  <span className="font-medium">Mileage:</span> {truck.mileage?.toLocaleString()} km
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTrucks.length === 0 && (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('admin.noVehiclesFound')}</h3>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
        <Button variant="outline" onClick={handleSignOut}>
          {t('admin.signOut')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">{t('admin.manageVehicles')}</TabsTrigger>
          <TabsTrigger value="add">{t('admin.addVehicle')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('admin.analytics')}</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          {renderInventory()}
        </TabsContent>
        <TabsContent value="add">
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && renderBasicInfo()}
            {currentStep === 2 && renderSpecifications()}
            {currentStep === 3 && renderPhotosVideos()}
          </form>
        </TabsContent>
        <TabsContent value="analytics">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
