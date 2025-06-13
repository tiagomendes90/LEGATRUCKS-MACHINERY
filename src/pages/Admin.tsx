import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Users, Package, DollarSign, BarChart3, LogOut, Search, Filter, Home, Upload, X, Star, ArrowLeft, ArrowRight, Copy } from "lucide-react";
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
import { compressImage } from "@/utils/imageCompression";

interface VehicleMedia {
  coverImage: string;
  images: string[];
  videos: string[];
}

const Admin = () => {
  const { t } = useTranslation();
  const { data: trucks = [], isLoading } = useTrucks();
  const addTruckMutation = useAddTruck();
  const deleteTruckMutation = useDeleteTruck();
  const updateTruckMutation = useUpdateTruck();
  const addSpecificationsMutation = useAddVehicleSpecifications();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

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

  const { data: allBrands = [] } = useBrands();
  const { data: subcategoryOptions = [] } = useFilterOptions(newTruck.category || 'trucks', 'subcategory');

  const [vehicleSpecifications, setVehicleSpecifications] = useState<Partial<VehicleSpecifications>>({});
  const [vehicleMedia, setVehicleMedia] = useState<VehicleMedia>({
    coverImage: "",
    images: [],
    videos: []
  });

  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [activeAddTruckTab, setActiveAddTruckTab] = useState("basic-info");
  const [currentStep, setCurrentStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState({ step1: false, step2: true, step3: true });
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");

  const { toast } = useToast();

  const getMileageUnit = () => {
    if (newTruck.category === 'trucks') {
      return 'Kilometers';
    } else if (newTruck.category === 'machinery' || newTruck.category === 'agriculture') {
      return 'Operating Hours';
    }
    return 'Mileage';
  };

  const getMileagePlaceholder = () => {
    if (newTruck.category === 'trucks') {
      return '50000';
    } else if (newTruck.category === 'machinery' || newTruck.category === 'agriculture') {
      return '5000';
    }
    return '50000';
  };

  useEffect(() => {
    const setupAdmin = async () => {
      if (user) {
        try {
          console.log('Setting up admin profile for:', user.email);
          await ensureAdminProfile();
          console.log('Admin profile setup completed');
          
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

  useEffect(() => {
    const step1Valid = newTruck.brand && newTruck.model && newTruck.year && newTruck.price && 
                     newTruck.condition && newTruck.description && newTruck.category;
    const step3Valid = vehicleMedia.coverImage && vehicleMedia.images.length > 0;
    
    setIsFormValid({
      step1: !!step1Valid,
      step2: true,
      step3: !!step3Valid
    });
  }, [newTruck, vehicleMedia]);

  const handleCategoryChange = (category: string) => {
    setNewTruck({
      ...newTruck,
      category,
      subcategory: ""
    });
  };

  const getCurrentYear = () => new Date().getFullYear();

  const handleNextStep = () => {
    if (currentStep === 1 && !isFormValid.step1) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setActiveAddTruckTab(currentStep === 1 ? "specifications" : "media");
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setActiveAddTruckTab(currentStep === 2 ? "basic-info" : "specifications");
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video') => {
    if (!files) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (type === 'image' && !file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select image files only.",
          variant: "destructive",
        });
        continue;
      }
      
      if (type === 'video' && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select video files only.",
          variant: "destructive",
        });
        continue;
      }

      if (type === 'image' && vehicleMedia.images.length >= 25) {
        toast({
          title: "Image Limit Reached",
          description: "Maximum of 25 images allowed.",
          variant: "destructive",
        });
        break;
      }

      if (type === 'video' && vehicleMedia.videos.length >= 3) {
        toast({
          title: "Video Limit Reached",
          description: "Maximum of 3 videos allowed.",
          variant: "destructive",
        });
        break;
      }

      try {
        if (type === 'image') {
          toast({
            title: "Compressing Image",
            description: "Please wait while we optimize your image...",
          });

          const compressedBase64 = await compressImage(file, {
            maxWidth: 1200,
            maxHeight: 800,
            quality: 0.8,
            maxSizeKB: 300
          });
          
          if (!vehicleMedia.coverImage) {
            setVehicleMedia(prev => ({
              ...prev,
              coverImage: compressedBase64
            }));
          } else {
            setVehicleMedia(prev => ({
              ...prev,
              images: [...prev.images, compressedBase64]
            }));
          }

          toast({
            title: "Image Optimized",
            description: "Image has been compressed and uploaded successfully.",
          });
        } else {
          const base64 = await convertFileToBase64(file);
          setVehicleMedia(prev => ({
            ...prev,
            videos: [...prev.videos, base64]
          }));
        }
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Failed to process file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddImage = async (imageUrl: string) => {
    if (vehicleMedia.images.length >= 25) {
      toast({
        title: "Image Limit Reached",
        description: "Maximum of 25 additional images allowed.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Compressing Image",
        description: "Please wait while we optimize your image...",
      });

      const compressedBase64 = await compressImage(imageUrl, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.8,
        maxSizeKB: 300
      });

      setVehicleMedia(prev => ({
        ...prev,
        images: [...prev.images, compressedBase64]
      }));

      toast({
        title: "Image Optimized",
        description: "Image has been compressed and added successfully.",
      });
    } catch (error) {
      toast({
        title: "Compression Error",
        description: "Failed to compress image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetCoverImage = async (imageUrl: string) => {
    try {
      toast({
        title: "Compressing Cover Image",
        description: "Please wait while we optimize your cover image...",
      });

      const compressedBase64 = await compressImage(imageUrl, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.85,
        maxSizeKB: 400
      });

      setVehicleMedia(prev => ({
        ...prev,
        coverImage: compressedBase64
      }));

      toast({
        title: "Cover Image Optimized",
        description: "Cover image has been compressed and set successfully.",
      });
    } catch (error) {
      toast({
        title: "Compression Error",
        description: "Failed to compress cover image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTruck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!isFormValid.step1 || !isFormValid.step3) {
      toast({
        title: "Incomplete Form",
        description: "Please complete all required steps before adding the vehicle.",
        variant: "destructive",
      });
      return;
    }
    
    const allImages = [vehicleMedia.coverImage, ...vehicleMedia.images, ...vehicleMedia.videos];

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
      images: allImages
    };

    try {
      let addedTruck;
      
      if (isEditMode && editingTruck) {
        await updateTruckMutation.mutateAsync({ id: editingTruck.id, updates: truckData });
        addedTruck = { ...editingTruck, ...truckData };
      } else {
        addedTruck = await addTruckMutation.mutateAsync(truckData);
      }
      
      if (addedTruck && Object.keys(vehicleSpecifications).length > 0) {
        const specsWithTruckId = {
          ...vehicleSpecifications,
          truck_id: addedTruck.id
        } as VehicleSpecifications;
        
        await addSpecificationsMutation.mutateAsync(specsWithTruckId);
      }

      resetForm();
      
      toast({
        title: "Success",
        description: isEditMode ? "Vehicle updated successfully!" : "Vehicle added successfully!",
      });
    } catch (error) {
      console.error('Failed to add/update truck:', error);
    }
  };

  const resetForm = () => {
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
    setVehicleMedia({ coverImage: "", images: [], videos: [] });
    setCurrentStep(1);
    setActiveAddTruckTab("basic-info");
    setIsEditMode(false);
    setEditingTruck(null);
  };

  const handleDeleteTruck = (id: string) => {
    deleteTruckMutation.mutate(id);
  };

  const handleEditTruck = (truck: Truck) => {
    setNewTruck({
      brand: truck.brand,
      model: truck.model,
      year: truck.year.toString(),
      mileage: truck.mileage?.toString() || "",
      price: truck.price.toString(),
      condition: truck.condition,
      engine: truck.engine,
      transmission: truck.transmission,
      description: truck.description,
      horsepower: truck.horsepower?.toString() || "",
      category: truck.category || "",
      subcategory: truck.subcategory || "",
      features: truck.features || [],
      images: truck.images || []
    });

    if (truck.images && truck.images.length > 0) {
      setVehicleMedia({
        coverImage: truck.images[0] || "",
        images: truck.images.slice(1).filter(img => !img.includes('video')) || [],
        videos: truck.images.filter(img => img.includes('video')) || []
      });
    }

    setEditingTruck(truck);
    setIsEditMode(true);
    setCurrentStep(1);
    setActiveAddTruckTab("basic-info");
    setActiveTab("add-truck");
  };

  const handleDuplicateTruck = (truck: Truck) => {
    setNewTruck({
      brand: truck.brand,
      model: `${truck.model} - Copy`,
      year: truck.year.toString(),
      mileage: truck.mileage?.toString() || "",
      price: truck.price.toString(),
      condition: truck.condition,
      engine: truck.engine,
      transmission: truck.transmission,
      description: truck.description,
      horsepower: truck.horsepower?.toString() || "",
      category: truck.category || "",
      subcategory: truck.subcategory || "",
      features: truck.features || [],
      images: truck.images || []
    });

    if (truck.images && truck.images.length > 0) {
      setVehicleMedia({
        coverImage: truck.images[0] || "",
        images: truck.images.slice(1).filter(img => !img.includes('video')) || [],
        videos: truck.images.filter(img => img.includes('video')) || []
      });
    }

    setEditingTruck(null);
    setIsEditMode(false);
    setCurrentStep(1);
    setActiveAddTruckTab("basic-info");
    setActiveTab("add-truck");

    toast({
      title: "Veículo Duplicado",
      description: "Os dados do veículo foram copiados. Pode agora fazer as alterações necessárias.",
    });
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

  const handleRemoveImage = (index: number) => {
    setVehicleMedia(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddVideo = (videoUrl: string) => {
    if (vehicleMedia.videos.length >= 3) {
      toast({
        title: "Video Limit Reached",
        description: "Maximum of 3 videos allowed.",
        variant: "destructive",
      });
      return;
    }
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="inventory">{t('admin.inventory')}</TabsTrigger>
            <TabsTrigger value="featured">{t('admin.featured')}</TabsTrigger>
            <TabsTrigger value="add-truck">{isEditMode ? "Edit Vehicle" : t('admin.addVehicle')}</TabsTrigger>
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
                            onClick={() => handleDuplicateTruck(truck)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Copy className="h-4 w-4" />
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
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                        1
                      </div>
                      <span className="font-medium">{t('admin.basicInfo')}</span>
                    </div>
                    <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                        2
                      </div>
                      <span className="font-medium">{t('admin.specifications')}</span>
                    </div>
                    <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                        3
                      </div>
                      <span className="font-medium">{t('admin.photosVideos')}</span>
                    </div>
                  </div>
                  {isEditMode && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-700 font-medium">
                        Editing: {editingTruck?.brand} {editingTruck?.model} ({editingTruck?.year})
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetForm}
                        className="mt-2"
                      >
                        Cancel Edit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Tabs value={activeAddTruckTab} onValueChange={setActiveAddTruckTab} className="space-y-6">
                <TabsContent value="basic-info">
                  <Card>
                    <CardHeader>
                      <CardTitle>Step 1: {t('admin.basicInfo')}</CardTitle>
                      <CardDescription>Add basic vehicle information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-6">
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
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('admin.selectBrand')} />
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
                              min="1950"
                              max={getCurrentYear() + 1}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="mileage">{getMileageUnit()}</Label>
                            <Input
                              id="mileage"
                              type="number"
                              value={newTruck.mileage}
                              onChange={(e) => setNewTruck({...newTruck, mileage: e.target.value})}
                              placeholder={getMileagePlaceholder()}
                              min="0"
                              max="2000000"
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
                              min="1000"
                              max="5000000"
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
                              min="50"
                              max="2000"
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

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={handleNextStep}
                            disabled={!isFormValid.step1}
                          >
                            Next: Specifications
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="specifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Step 2: {t('admin.specifications')}</CardTitle>
                      <CardDescription>Add detailed technical specifications (optional)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <VehicleSpecificationsForm
                        specifications={vehicleSpecifications}
                        onSpecificationsChange={setVehicleSpecifications}
                      />
                      <div className="mt-6 flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevStep}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back: Basic Info
                        </Button>
                        <Button
                          type="button"
                          onClick={handleNextStep}
                        >
                          Next: Media
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="media">
                  <Card>
                    <CardHeader>
                      <CardTitle>Step 3: {t('admin.photosVideos')}</CardTitle>
                      <CardDescription>Add cover image, additional photos (max 25), and videos (max 3)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Cover Image *
                        </Label>
                        <div className="mt-2 space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter cover image URL"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.target as HTMLInputElement;
                                  if (input.value.trim()) {
                                    handleSetCoverImage(input.value.trim());
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const input = document.querySelector(`input[placeholder="Enter cover image URL"]`) as HTMLInputElement;
                                if (input?.value.trim()) {
                                  handleSetCoverImage(input.value.trim());
                                  input.value = '';
                                }
                              }}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Set Cover
                            </Button>
                          </div>
                          <div>
                            <Label htmlFor="cover-file-upload" className="cursor-pointer">
                              <Button type="button" variant="outline" asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Cover Image
                                </span>
                              </Button>
                            </Label>
                            <Input
                              id="cover-file-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e.target.files, 'image')}
                            />
                          </div>
                          {vehicleMedia.coverImage && (
                            <div className="relative inline-block">
                              <img
                                src={vehicleMedia.coverImage}
                                alt="Cover image"
                                className="w-48 h-32 object-cover rounded-lg border-2 border-yellow-500"
                              />
                              <Badge className="absolute top-2 left-2 bg-yellow-500">Cover</Badge>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => setVehicleMedia(prev => ({ ...prev, coverImage: "" }))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-medium">Additional Photos ({vehicleMedia.images.length}/25)</Label>
                        <div className="mt-2 space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter photo URL"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.target as HTMLInputElement;
                                  if (input.value.trim()) {
                                    handleAddImage(input.value.trim());
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const input = document.querySelector(`input[placeholder="Enter photo URL"]`) as HTMLInputElement;
                                if (input?.value.trim()) {
                                  handleAddImage(input.value.trim());
                                  input.value = '';
                                }
                              }}
                              disabled={vehicleMedia.images.length >= 25}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Add Photo
                            </Button>
                          </div>
                          <div>
                            <Label htmlFor="photos-file-upload" className="cursor-pointer">
                              <Button 
                                type="button" 
                                variant="outline" 
                                asChild
                                disabled={vehicleMedia.images.length >= 25}
                              >
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Photos
                                </span>
                              </Button>
                            </Label>
                            <Input
                              id="photos-file-upload"
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => handleFileUpload(e.target.files, 'image')}
                            />
                          </div>
                          {vehicleMedia.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {vehicleMedia.images.map((photo, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={photo}
                                    alt={`Vehicle photo ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveImage(index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-medium">Vehicle Videos ({vehicleMedia.videos.length}/3)</Label>
                        <div className="mt-2 space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter video URL (YouTube, Vimeo, etc.)"
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
                                const input = document.querySelector(`input[placeholder="Enter video URL (YouTube, Vimeo, etc.)"]`) as HTMLInputElement;
                                if (input?.value.trim()) {
                                  handleAddVideo(input.value.trim());
                                  input.value = '';
                                }
                              }}
                              disabled={vehicleMedia.videos.length >= 3}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Add Video
                            </Button>
                          </div>
                          <div>
                            <Label htmlFor="videos-file-upload" className="cursor-pointer">
                              <Button 
                                type="button" 
                                variant="outline" 
                                asChild
                                disabled={vehicleMedia.videos.length >= 3}
                              >
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Videos
                                </span>
                              </Button>
                            </Label>
                            <Input
                              id="videos-file-upload"
                              type="file"
                              accept="video/*"
                              multiple
                              className="hidden"
                              onChange={(e) => handleFileUpload(e.target.files, 'video')}
                            />
                          </div>
                          {vehicleMedia.videos.length > 0 && (
                            <div className="space-y-2">
                              {vehicleMedia.videos.map((video, index) => (
                                <div key={index} className="relative group p-4 border rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 truncate mr-4">
                                      Video {index + 1}: {video.length > 50 ? video.substring(0, 50) + '...' : video}
                                    </p>
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

                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevStep}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back: Specifications
                        </Button>
                        <Button 
                          onClick={handleAddTruck}
                          disabled={addTruckMutation.isPending || addSpecificationsMutation.isPending || !isFormValid.step1 || !isFormValid.step3}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {addTruckMutation.isPending || addSpecificationsMutation.isPending ? 
                            (isEditMode ? 'Updating Vehicle...' : 'Adding Vehicle...') : 
                            (isEditMode ? 'Update Vehicle' : 'Add Vehicle')
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>

        <EditTruckModal 
          truck={editingTruck}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTruck(null);
          }}
          onSave={() => {}}
        />
      </div>
    </div>
  );
};

export default Admin;
