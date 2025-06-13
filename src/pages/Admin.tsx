
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTrucks, useAddTruck, useDeleteTruck, Truck } from "@/hooks/useTrucks";
import { useUpdateTruck } from "@/hooks/useUpdateTruck";
import { useAddVehicleSpecifications, VehicleSpecifications } from "@/hooks/useVehicleSpecifications";
import EditTruckModal from "@/components/EditTruckModal";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import RealOrderManagement from "@/components/RealOrderManagement";
import FeaturedTrucksManager from "@/components/FeaturedTrucksManager";
import { ensureAdminProfile, forceCreateAdminProfile } from "@/utils/adminSetup";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Import new admin components
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStats from "@/components/admin/AdminStats";
import InventoryTab from "@/components/admin/InventoryTab";
import AddVehicleTab from "@/components/admin/AddVehicleTab";

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

  const [vehicleSpecifications, setVehicleSpecifications] = useState<Partial<VehicleSpecifications>>({});
  const [vehicleMedia, setVehicleMedia] = useState<VehicleMedia>({
    coverImage: "",
    images: [],
    videos: []
  });

  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");

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

  const handleAddTruck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
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
      
      // If truck was added/updated successfully and there are specifications, add them
      if (addedTruck && Object.keys(vehicleSpecifications).length > 0) {
        const specsWithTruckId = {
          ...vehicleSpecifications,
          truck_id: addedTruck.id
        } as VehicleSpecifications;
        
        await addSpecificationsMutation.mutateAsync(specsWithTruckId);
      }

      // Reset forms
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
    setIsEditMode(false);
    setEditingTruck(null);
  };

  const handleDeleteTruck = (id: string) => {
    deleteTruckMutation.mutate(id);
  };

  const handleEditTruck = (truck: Truck) => {
    // Populate the form with existing truck data
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

    // Populate media if available
    if (truck.images && truck.images.length > 0) {
      setVehicleMedia({
        coverImage: truck.images[0] || "",
        images: truck.images.slice(1).filter(img => !img.includes('video')) || [],
        videos: truck.images.filter(img => img.includes('video')) || []
      });
    }

    setEditingTruck(truck);
    setIsEditMode(true);
    
    // Switch to the add-truck tab
    setActiveTab("add-truck");
  };

  const handleDuplicateTruck = (truck: Truck) => {
    // Copy all truck data but reset IDs and add "Copy" to the model name
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

    // Copy media if available
    if (truck.images && truck.images.length > 0) {
      setVehicleMedia({
        coverImage: truck.images[0] || "",
        images: truck.images.slice(1).filter(img => !img.includes('video')) || [],
        videos: truck.images.filter(img => img.includes('video')) || []
      });
    }

    // Reset edit mode and go to add-truck tab
    setEditingTruck(null);
    setIsEditMode(false);
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
        <AdminHeader 
          userEmail={user?.email}
          onGoHome={handleGoHome}
          onSignOut={handleSignOut}
        />

        <AdminStats trucks={trucks} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="inventory">{t('admin.inventory')}</TabsTrigger>
            <TabsTrigger value="featured">{t('admin.featured')}</TabsTrigger>
            <TabsTrigger value="add-truck">{isEditMode ? "Edit Vehicle" : t('admin.addVehicle')}</TabsTrigger>
            <TabsTrigger value="orders">{t('admin.orders')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('admin.analytics')}</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <InventoryTab
              trucks={trucks}
              onEditTruck={handleEditTruck}
              onDuplicateTruck={handleDuplicateTruck}
              onDeleteTruck={handleDeleteTruck}
              isDeleting={deleteTruckMutation.isPending}
            />
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
            <AddVehicleTab
              newTruck={newTruck}
              setNewTruck={setNewTruck}
              vehicleSpecifications={vehicleSpecifications}
              setVehicleSpecifications={setVehicleSpecifications}
              vehicleMedia={vehicleMedia}
              setVehicleMedia={setVehicleMedia}
              onAddTruck={handleAddTruck}
              isEditMode={isEditMode}
              editingTruck={editingTruck}
              onResetForm={resetForm}
              isLoading={addTruckMutation.isPending || addSpecificationsMutation.isPending}
            />
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
