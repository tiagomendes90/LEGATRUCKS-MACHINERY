
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useNewVehicleBrands } from "@/hooks/useNewVehicleBrands";
import { useCategories } from "@/hooks/useCategories";
import { useAddVehicle } from "@/hooks/useVehicles";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { MainImageUpload } from "./MainImageUpload";
import { SecondaryImagesUpload } from "./SecondaryImagesUpload";
import { useImageUpload } from "@/hooks/useImageUpload";

const vehicleSchema = z.object({
  title: z.string().min(1, "Nome/Modelo do veículo é obrigatório"),
  description: z.string().optional(),
  brand_id: z.string().min(1, "Marca é obrigatória"),
  subcategory_id: z.string().min(1, "Subcategoria é obrigatória"),
  condition: z.enum(["new", "used", "restored", "modified"]),
  registration_year: z.number().min(1900, "Ano deve ser válido").max(new Date().getFullYear() + 1, "Ano não pode ser futuro"),
  price_eur: z.number().min(0, "Preço deve ser positivo"),
  mileage_km: z.number().min(0).optional(),
  operating_hours: z.number().min(0).optional(),
  fuel_type: z.enum(["diesel", "electric", "hybrid", "petrol", "gas"]).optional(),
  gearbox: z.enum(["manual", "automatic", "semi-automatic"]).optional(),
  power_ps: z.number().min(0).optional(),
  drivetrain: z.enum(["4x2", "4x4", "6x2", "6x4", "8x4", "8x6"]).optional(),
  axles: z.number().min(0).optional(),
  weight_kg: z.number().min(0).optional(),
  body_color: z.string().optional(),
  location: z.string().optional(),
  contact_info: z.string().optional(),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface AddVehicleFormProps {
  onSuccess?: () => void;
}

export const AddVehicleForm = ({ onSuccess }: AddVehicleFormProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [secondaryImages, setSecondaryImages] = useState<File[]>([]);
  const { data: brands = [] } = useNewVehicleBrands();
  const { data: categories = [] } = useCategories();
  const addVehicleMutation = useAddVehicle();
  const { uploadImages, isUploading } = useImageUpload();
  const { toast } = useToast();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      title: "",
      description: "",
      brand_id: "",
      subcategory_id: "",
      condition: "used",
      registration_year: new Date().getFullYear(),
      price_eur: 0,
      is_published: false,
      is_featured: false,
    },
  });

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const availableSubcategories = selectedCategory?.subcategories || [];
  const categorySlug = selectedCategory?.slug;

  // Campos dinâmicos baseados na categoria
  const showMileage = categorySlug === "trucks";
  const showOperatingHours = categorySlug === "machinery" || categorySlug === "agriculture";

  const onSubmit = async (data: VehicleFormData) => {
    // Validação da imagem principal
    if (!mainImage) {
      toast({
        title: "Erro",
        description: "Imagem principal é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    // Validação dos campos condicionais
    if (showMileage && (!data.mileage_km || data.mileage_km <= 0)) {
      toast({
        title: "Erro",
        description: "Quilómetros é obrigatório para veículos da categoria trucks.",
        variant: "destructive",
      });
      return;
    }

    if (showOperatingHours && (!data.operating_hours || data.operating_hours <= 0)) {
      toast({
        title: "Erro",
        description: "Horas de uso é obrigatório para esta categoria.",
        variant: "destructive",
      });
      return;
    }

    try {
      const vehicleData = {
        title: data.title,
        description: data.description || "",
        brand_id: data.brand_id,
        subcategory_id: data.subcategory_id,
        condition: data.condition,
        registration_year: data.registration_year,
        price_eur: data.price_eur,
        mileage_km: data.mileage_km,
        operating_hours: data.operating_hours,
        fuel_type: data.fuel_type,
        gearbox: data.gearbox,
        power_ps: data.power_ps,
        drivetrain: data.drivetrain,
        axles: data.axles,
        weight_kg: data.weight_kg,
        body_color: data.body_color,
        location: data.location,
        contact_info: data.contact_info,
        is_published: data.is_published,
        is_featured: data.is_featured,
        is_active: true, // Sempre ativo por defeito
      };
      
      const newVehicle = await addVehicleMutation.mutateAsync(vehicleData);
      
      // Upload das imagens
      const allImages = [];
      if (mainImage) {
        allImages.push(mainImage);
      }
      if (secondaryImages.length > 0) {
        allImages.push(...secondaryImages);
      }
      
      if (allImages.length > 0) {
        await uploadImages(allImages, newVehicle.id);
      }
      
      toast({
        title: "Sucesso!",
        description: "Veículo adicionado com sucesso ao inventário.",
      });
      
      // Reset do formulário
      form.reset();
      setSelectedCategoryId("");
      setMainImage(null);
      setSecondaryImages([]);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao adicionar veículo:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar veículo. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAsDraft = () => {
    form.setValue("is_published", false);
    form.handleSubmit(onSubmit)();
  };

  const handlePublish = () => {
    form.setValue("is_published", true);
    form.handleSubmit(onSubmit)();
  };

  const isSubmitting = addVehicleMutation.isPending || isUploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Novo Veículo</CardTitle>
        <CardDescription>Preencha os dados do veículo. Campos marcados com * são obrigatórios.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-8">
            {/* 1. Dados Básicos do Veículo */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">📋 Dados Básicos</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome/Modelo do Veículo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mercedes Actros 1845, Volvo FH12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a marca" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={(value) => {
                      setSelectedCategoryId(value);
                      form.setValue("subcategory_id", "");
                    }}
                  >
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
                  {!selectedCategoryId && (
                    <p className="text-sm text-red-500">Categoria é obrigatória</p>
                  )}
                </FormItem>

                <FormField
                  control={form.control}
                  name="subcategory_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoria *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedCategoryId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSubcategories.map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="used">Usado</SelectItem>
                          <SelectItem value="restored">Restaurado</SelectItem>
                          <SelectItem value="modified">Modificado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registration_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="2020"
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_eur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (€) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000"
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Campos dinâmicos baseados na categoria */}
              <div className="grid md:grid-cols-2 gap-4">
                {showMileage && (
                  <FormField
                    control={form.control}
                    name="mileage_km"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quilómetros (km) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="100000"
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {showOperatingHours && (
                  <FormField
                    control={form.control}
                    name="operating_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horas de Uso *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5000"
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização</FormLabel>
                      <FormControl>
                        <Input placeholder="Lisboa, Portugal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada do veículo, estado, equipamentos, etc..." 
                        rows={4} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 2. Especificações Técnicas */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">⚙️ Especificações Técnicas</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="fuel_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Combustível</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o combustível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="petrol">Gasolina</SelectItem>
                          <SelectItem value="electric">Elétrico</SelectItem>
                          <SelectItem value="hybrid">Híbrido</SelectItem>
                          <SelectItem value="gas">Gás</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gearbox"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transmissão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a transmissão" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="automatic">Automática</SelectItem>
                          <SelectItem value="semi-automatic">Semi-automática</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="power_ps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potência (PS)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="450"
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="drivetrain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tração</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tração" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="4x2">4x2</SelectItem>
                          <SelectItem value="4x4">4x4</SelectItem>
                          <SelectItem value="6x2">6x2</SelectItem>
                          <SelectItem value="6x4">6x4</SelectItem>
                          <SelectItem value="8x4">8x4</SelectItem>
                          <SelectItem value="8x6">8x6</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="axles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eixos</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="2"
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="12000"
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="body_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <Input placeholder="Branco, Azul..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 3. Upload de Imagens */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">📸 Imagens do Veículo</h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-base font-medium mb-4 text-gray-700">
                    Imagem Principal * 
                    <span className="text-sm text-gray-500 ml-2">(obrigatória)</span>
                  </h4>
                  <MainImageUpload
                    image={mainImage}
                    onImageChange={setMainImage}
                  />
                </div>
                
                <div>
                  <h4 className="text-base font-medium mb-4 text-gray-700">
                    Imagens de Detalhe 
                    <span className="text-sm text-gray-500 ml-2">(máx. 20)</span>
                  </h4>
                  <SecondaryImagesUpload
                    images={secondaryImages}
                    onImagesChange={setSecondaryImages}
                    maxImages={20}
                  />
                </div>
              </div>
            </div>

            {/* 4. Configurações de Visibilidade */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">👁️ Visibilidade</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Publicar veículo</FormLabel>
                        <p className="text-sm text-gray-500">
                          Torna o veículo visível no website
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Veículo em destaque</FormLabel>
                        <p className="text-sm text-gray-500">
                          Aparece na página inicial
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 5. Informações de Contacto */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">📞 Contacto</h3>
              
              <FormField
                control={form.control}
                name="contact_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informações de Contacto</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Nome, telefone, email, horários de contacto..." 
                        rows={3} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 6. Botões de Ação */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar como Rascunho
              </Button>
              
              <Button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Publicar Veículo
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  form.reset();
                  setSelectedCategoryId("");
                  setMainImage(null);
                  setSecondaryImages([]);
                }}
                disabled={isSubmitting}
              >
                Limpar Formulário
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
