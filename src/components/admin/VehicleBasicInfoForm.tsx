
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBrands } from "@/hooks/useBrands";
import { useFilterOptions } from "@/hooks/useFilterOptions";

interface VehicleFormData {
  brand: string;
  model: string;
  year: string;
  mileage: string;
  price: string;
  condition: string;
  engine: string;
  transmission: string;
  description: string;
  horsepower: string;
  category: string;
  subcategory: string;
  features: string[];
  images: string[];
}

interface VehicleBasicInfoFormProps {
  newTruck: VehicleFormData;
  setNewTruck: React.Dispatch<React.SetStateAction<VehicleFormData>>;
  onNext: () => void;
  isFormValid: boolean;
}

const VehicleBasicInfoForm = ({ newTruck, setNewTruck, onNext, isFormValid }: VehicleBasicInfoFormProps) => {
  const { t } = useTranslation();
  const { data: allBrands = [] } = useBrands();
  const { data: subcategoryOptions = [] } = useFilterOptions(newTruck.category || 'trucks', 'subcategory');

  const getCurrentYear = () => new Date().getFullYear();

  // Helper function to get the correct unit label based on category
  const getMileageUnit = () => {
    if (newTruck.category === 'trucks') {
      return 'Kilometers';
    } else if (newTruck.category === 'machinery' || newTruck.category === 'agriculture') {
      return 'Operating Hours';
    }
    return 'Mileage';
  };

  // Helper function to get the correct placeholder based on category
  const getMileagePlaceholder = () => {
    if (newTruck.category === 'trucks') {
      return '50000';
    } else if (newTruck.category === 'machinery' || newTruck.category === 'agriculture') {
      return '5000';
    }
    return '50000';
  };

  const handleCategoryChange = (category: string) => {
    setNewTruck({
      ...newTruck,
      category,
      subcategory: ""
    });
  };

  return (
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
          onClick={onNext}
          disabled={!isFormValid}
        >
          Next: Specifications
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};

export default VehicleBasicInfoForm;
