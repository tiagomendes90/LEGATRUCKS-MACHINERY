
import { VehicleFormData } from '@/hooks/useVehicleForm';

export const validateVehicleFormTab = (
  currentTab: string,
  formData: VehicleFormData,
  distanceField: any,
  mainImage: File | null,
  toast: any
): boolean => {
  switch (currentTab) {
    case "basic":
      if (!formData.title || !formData.price_eur || 
          !formData.registration_year || !formData.brand_id || !formData.subcategory_id) {
        toast({
          title: "Erro de validação",
          description: "Por favor preencha todos os campos obrigatórios (Nome/Modelo, Categoria, Subcategoria, Marca, Ano, Preço).",
          variant: "destructive",
        });
        return false;
      }
      
      if (distanceField && !formData[distanceField.field as keyof VehicleFormData]) {
        toast({
          title: "Erro de validação",
          description: `Por favor preencha o campo ${distanceField.label}.`,
          variant: "destructive",
        });
        return false;
      }
      
      const cleanPrice = formData.price_eur.replace(/,/g, '');
      if (isNaN(parseFloat(cleanPrice)) || parseFloat(cleanPrice) <= 0) {
        toast({
          title: "Erro de validação",
          description: "Por favor insira um preço válido.",
          variant: "destructive",
        });
        return false;
      }
      return true;
      
    case "images":
      if (!mainImage) {
        toast({
          title: "Erro de validação",
          description: "Por favor selecione uma imagem principal.",
          variant: "destructive",
        });
        return false;
      }
      return true;
      
    default:
      return true;
  }
};
