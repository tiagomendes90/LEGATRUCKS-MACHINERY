
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrands } from "@/hooks/useBrands";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useTranslation } from "react-i18next";

interface TruckFilterProps {
  category: string;
  onFilterChange: (filters: {
    brand: string;
    model: string;
    yearFrom: string;
    operatingHoursUntil: string;
    priceType: string;
    priceUntil: string;
    location: string;
    sortBy: string;
    mileageTo?: string;
  }) => void;
}

const TruckFilter = ({ category, onFilterChange }: TruckFilterProps) => {
  const { t } = useTranslation();
  const { data: brands } = useBrands(category);
  
  // Fetch filter options for different types
  const { data: priceOptions } = useFilterOptions(category, 'price_until');
  const { data: yearOptions } = useFilterOptions(category, 'year_from');
  const { data: mileageOptions } = useFilterOptions(category, category === 'trucks' ? 'mileage' : 'operating_hours');

  const [filters, setFilters] = useState({
    brand: "all",
    model: "",
    yearFrom: "all",
    operatingHoursUntil: "all",
    priceType: "all",
    priceUntil: "all",
    location: "",
    sortBy: "all",
    mileageTo: "all"
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Convert "all" values back to empty strings for the parent component
    const processedFilters = {
      ...newFilters,
      brand: newFilters.brand === "all" ? "" : newFilters.brand,
      yearFrom: newFilters.yearFrom === "all" ? "" : newFilters.yearFrom,
      operatingHoursUntil: newFilters.operatingHoursUntil === "all" ? "" : newFilters.operatingHoursUntil,
      priceType: newFilters.priceType === "all" ? "" : newFilters.priceType,
      priceUntil: newFilters.priceUntil === "all" ? "" : newFilters.priceUntil,
      sortBy: newFilters.sortBy === "all" ? "" : newFilters.sortBy,
      mileageTo: newFilters.mileageTo === "all" ? "" : newFilters.mileageTo
    };
    
    onFilterChange(processedFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      brand: "all",
      model: "",
      yearFrom: "all",
      operatingHoursUntil: "all",
      priceType: "all",
      priceUntil: "all",
      location: "",
      sortBy: "all",
      mileageTo: "all"
    };
    setFilters(resetFilters);
    
    // Convert to empty strings for parent component
    const processedFilters = {
      brand: "",
      model: "",
      yearFrom: "",
      operatingHoursUntil: "",
      priceType: "",
      priceUntil: "",
      location: "",
      sortBy: "",
      mileageTo: ""
    };
    
    onFilterChange(processedFilters);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('filters.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Brand Filter */}
          <div className="space-y-2">
            <Label>{t('filters.brand')}</Label>
            <Select value={filters.brand} onValueChange={(value) => handleFilterChange('brand', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectBrand')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allBrands')}</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.slug}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Filter */}
          <div className="space-y-2">
            <Label>{t('filters.model')}</Label>
            <Input
              placeholder={t('filters.enterModel')}
              value={filters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
            />
          </div>

          {/* Year Filter */}
          <div className="space-y-2">
            <Label>{t('filters.yearFrom')}</Label>
            <Select value={filters.yearFrom} onValueChange={(value) => handleFilterChange('yearFrom', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectYear')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allYears')}</SelectItem>
                {yearOptions?.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operating Hours/Mileage Filter */}
          <div className="space-y-2">
            <Label>
              {category === 'trucks' ? t('filters.mileageTo') : t('filters.operatingHoursUntil')}
            </Label>
            <Select 
              value={category === 'trucks' ? filters.mileageTo : filters.operatingHoursUntil} 
              onValueChange={(value) => handleFilterChange(category === 'trucks' ? 'mileageTo' : 'operatingHoursUntil', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={category === 'trucks' ? t('filters.selectMileage') : t('filters.selectHours')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {category === 'trucks' ? t('filters.allMileage') : t('filters.allHours')}
                </SelectItem>
                {mileageOptions?.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Filter */}
          <div className="space-y-2">
            <Label>{t('filters.priceUntil')}</Label>
            <Select value={filters.priceUntil} onValueChange={(value) => handleFilterChange('priceUntil', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectPrice')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allPrices')}</SelectItem>
                {priceOptions?.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <Label>{t('filters.location')}</Label>
            <Input
              placeholder={t('filters.enterLocation')}
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>

          {/* Sort Filter */}
          <div className="space-y-2">
            <Label>{t('filters.sortBy')}</Label>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectSort')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.defaultSort')}</SelectItem>
                <SelectItem value="price-low">{t('filters.priceLowToHigh')}</SelectItem>
                <SelectItem value="price-high">{t('filters.priceHighToLow')}</SelectItem>
                <SelectItem value="year-new">{t('filters.yearNewToOld')}</SelectItem>
                <SelectItem value="year-old">{t('filters.yearOldToNew')}</SelectItem>
                <SelectItem value="hours-low">{t('filters.hoursLowToHigh')}</SelectItem>
                <SelectItem value="hours-high">{t('filters.hoursHighToLow')}</SelectItem>
                <SelectItem value="name-asc">{t('filters.nameAtoZ')}</SelectItem>
                <SelectItem value="name-desc">{t('filters.nameZtoA')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button onClick={resetFilters} variant="outline" className="w-full">
              {t('filters.reset')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TruckFilter;
