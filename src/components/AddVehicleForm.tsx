import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { useNewVehicleBrands } from "@/hooks/useNewVehicleBrands";
import { useImageKitUpload } from "@/hooks/useImageKitUpload";
import { MainImageUpload } from "./MainImageUpload";
import { SecondaryImagesUpload } from "./SecondaryImagesUpload";

export const AddVehicleForm = () => {
  // State declarations
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_eur: "",
    registration_year: "",
    condition: "used",
    brand_id: "",
    subcategory_id: "",
    fuel_type: "",
    gearbox: "",
    mileage_km: "",
    operating_hours: "",
    drivetrain: "",
    axles: "",
    power_ps: "",
    weight_kg: "",
    body_color: "",
    location: "",
    contact_info: "",
    is_published: false,
    is_featured: false,
    is_active: true,
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [secondaryImages, setSecondaryImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: brands = [], isLoading: brandsLoading, error: brandsError } = useNewVehicleBrands();
  const { uploadImages, isUploading } = useImageKitUpload();

  // Get selected category
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  // Filter subcategories based on selected category
  const availableSubcategories = selectedCategory?.subcategories || [];

  // Filter brands based on selected category
  const availableBrands = React.useMemo(() => {
    if (!selectedCategoryId || !brands.length || !categories.length) return [];
    
    const categoryName = categories.find(cat => cat.id === selectedCategoryId)?.name;
    if (!categoryName) return [];
    
    return brands.filter(brand => 
      brand.category?.includes(categoryName)
    );
  }, [selectedCategoryId, brands, categories]);

  // Reset subcategory and brand when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      setFormData(prev => ({ 
        ...prev, 
        subcategory_id: "",
        brand_id: ""
      }));
    }
  }, [selectedCategoryId]);

  // handleInputChange function
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // handleSubmit function with ImageKit integration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.price_eur || 
          !formData.registration_year || !formData.brand_id || !formData.subcategory_id) {
        toast({
          title: "Erro de validação",
          description: "Por favor preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      // Create vehicle record first
      const vehicleData = {
        ...formData,
        price_eur: parseFloat(formData.price_eur),
        registration_year: parseInt(formData.registration_year),
        mileage_km: formData.mileage_km ? parseInt(formData.mileage_km) : null,
        operating_hours: formData.operating_hours ? parseInt(formData.operating_hours) : null,
        axles: formData.axles ? parseInt(formData.axles) : null,
        power_ps: formData.power_ps ? parseInt(formData.power_ps) : null,
        weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
      };

      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (vehicleError) throw vehicleError;

      console.log('✅ Vehicle created:', vehicle.id);

      // Upload images via ImageKit if any are selected
      const allImages = mainImage ? [mainImage, ...secondaryImages] : secondaryImages;
      
      if (allImages.length > 0) {
        toast({
          title: "A carregar imagens...",
          description: "Otimizando imagens via ImageKit...",
        });

        await uploadImages(allImages, vehicle.id);
      }

      toast({
        title: "Sucesso!",
        description: "Veículo adicionado com sucesso com imagens otimizadas!",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        price_eur: "",
        registration_year: "",
        condition: "used",
        brand_id: "",
        subcategory_id: "",
        fuel_type: "",
        gearbox: "",
        mileage_km: "",
        operating_hours: "",
        drivetrain: "",
        axles: "",
        power_ps: "",
        weight_kg: "",
        body_color: "",
        location: "",
        contact_info: "",
        is_published: false,
        is_featured: false,
        is_active: true,
      });
      setSelectedCategoryId("");
      setMainImage(null);
      setSecondaryImages([]);

    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar veículo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoriesLoading || brandsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">A carregar formulário...</div>
      </div>
    );
  }

  if (brandsError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">Erro ao carregar marcas</div>
          <p className="text-gray-600">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Adicionar Novo Veículo</CardTitle>
        <CardDescription>
          Preencha os detalhes do veículo - as imagens serão otimizadas automaticamente via ImageKit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="specs">Especificações</TabsTrigger>
              <TabsTrigger value="images">Imagens</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Volvo FH16 750 Globetrotter"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategory_id">Subcategoria *</Label>
                  <Select 
                    value={formData.subcategory_id} 
                    onValueChange={(value) => handleInputChange('subcategory_id', value)}
                    disabled={!selectedCategoryId || availableSubcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategoryId && availableSubcategories.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Nenhuma subcategoria disponível para esta categoria
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="brand_id">Marca *</Label>
                  <Select 
                    value={formData.brand_id} 
                    onValueChange={(value) => handleInputChange('brand_id', value)}
                    disabled={!selectedCategoryId || availableBrands.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBrands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategoryId && availableBrands.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Nenhuma marca disponível para esta categoria
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price_eur">Preço (EUR) *</Label>
                  <Input
                    id="price_eur"
                    type="number"
                    value={formData.price_eur}
                    onChange={(e) => handleInputChange('price_eur', e.target.value)}
                    placeholder="Ex: 45000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="registration_year">Ano de Registo *</Label>
                  <Input
                    id="registration_year"
                    type="number"
                    value={formData.registration_year}
                    onChange={(e) => handleInputChange('registration_year', e.target.value)}
                    placeholder="Ex: 2020"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="condition">Estado *</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="used">Usado</SelectItem>
                      <SelectItem value="restored">Restaurado</SelectItem>
                      <SelectItem value="modified">Modificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva as características e estado do veículo..."
                  rows={4}
                  required
                />
              </div>
            </TabsContent>

            <TabsContent value="specs" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fuel_type">Combustível</Label>
                  <Select value={formData.fuel_type} onValueChange={(value) => handleInputChange('fuel_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o combustível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="gasoline">Gasolina</SelectItem>
                      <SelectItem value="electric">Elétrico</SelectItem>
                      <SelectItem value="hybrid">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gearbox">Transmissão</Label>
                  <Select value={formData.gearbox} onValueChange={(value) => handleInputChange('gearbox', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a transmissão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automática</SelectItem>
                      <SelectItem value="semi-automatic">Semi-automática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mileage_km">Quilómetros</Label>
                  <Input
                    id="mileage_km"
                    type="number"
                    value={formData.mileage_km}
                    onChange={(e) => handleInputChange('mileage_km', e.target.value)}
                    placeholder="Ex: 150000"
                  />
                </div>

                <div>
                  <Label htmlFor="operating_hours">Horas de Funcionamento</Label>
                  <Input
                    id="operating_hours"
                    type="number"
                    value={formData.operating_hours}
                    onChange={(e) => handleInputChange('operating_hours', e.target.value)}
                    placeholder="Ex: 5000"
                  />
                </div>

                <div>
                  <Label htmlFor="power_ps">Potência (PS)</Label>
                  <Input
                    id="power_ps"
                    type="number"
                    value={formData.power_ps}
                    onChange={(e) => handleInputChange('power_ps', e.target.value)}
                    placeholder="Ex: 500"
                  />
                </div>

                <div>
                  <Label htmlFor="drivetrain">Tração</Label>
                  <Select value={formData.drivetrain} onValueChange={(value) => handleInputChange('drivetrain', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a tração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2wd">2WD</SelectItem>
                      <SelectItem value="4wd">4WD</SelectItem>
                      <SelectItem value="awd">AWD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="axles">Número de Eixos</Label>
                  <Input
                    id="axles"
                    type="number"
                    value={formData.axles}
                    onChange={(e) => handleInputChange('axles', e.target.value)}
                    placeholder="Ex: 2"
                  />
                </div>

                <div>
                  <Label htmlFor="weight_kg">Peso (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                    placeholder="Ex: 40000"
                  />
                </div>

                <div>
                  <Label htmlFor="body_color">Cor</Label>
                  <Input
                    id="body_color"
                    value={formData.body_color}
                    onChange={(e) => handleInputChange('body_color', e.target.value)}
                    placeholder="Ex: Azul"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <div>
                <Label>Imagem Principal</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Otimizada automaticamente via ImageKit (WebP, CDN)
                </p>
                <MainImageUpload
                  image={mainImage}
                  onImageChange={setMainImage}
                />
              </div>

              <div>
                <Label>Imagens Secundárias</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Todas as imagens são otimizadas via ImageKit
                </p>
                <SecondaryImagesUpload
                  images={secondaryImages}
                  onImagesChange={setSecondaryImages}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => handleInputChange('is_published', checked)}
                  />
                  <Label htmlFor="is_published">Publicado</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                  />
                  <Label htmlFor="is_featured">Em Destaque</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>

                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Ex: Lisboa, Portugal"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_info">Informações de Contacto</Label>
                  <Textarea
                    id="contact_info"
                    value={formData.contact_info}
                    onChange={(e) => handleInputChange('contact_info', e.target.value)}
                    placeholder="Informações de contacto específicas para este veículo..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting || isUploading ? "A processar..." : "Adicionar Veículo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
