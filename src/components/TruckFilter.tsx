
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
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
  
  // Fetch filter options from database
  const { data: priceOptions } = useFilterOptions(category, 'price');
  const { data: yearOptions } = useFilterOptions(category, 'year');
  
  // Use different filter types based on category
  const hoursFilterType = category === 'trucks' ? 'mileage' : 'operating_hours';
  const { data: hoursOptions } = useFilterOptions(category, hoursFilterType);

  const [filters, setFilters] = useState({
    brand: "all",
    model: "",
    yearFrom: "any",
    operatingHoursUntil: "any",
    priceType: "until",
    priceUntil: "any",
    location: "",
    sortBy: "default",
    mileageTo: "any"
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const filterData = {
      brand: filters.brand === "all" ? "" : filters.brand,
      model: filters.model,
      yearFrom: filters.yearFrom === "any" ? "" : filters.yearFrom,
      operatingHoursUntil: filters.operatingHoursUntil === "any" ? "" : filters.operatingHoursUntil,
      priceType: filters.priceType,
      priceUntil: filters.priceUntil === "any" ? "" : filters.priceUntil,
      location: filters.location,
      sortBy: filters.sortBy === "default" ? "" : filters.sortBy,
      ...(category === 'trucks' && { mileageTo: filters.operatingHoursUntil === "any" ? "" : filters.operatingHoursUntil })
    };
    onFilterChange(filterData);
  }, [filters, onFilterChange, category]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      brand: "all",
      model: "",
      yearFrom: "any",
      operatingHoursUntil: "any",
      priceType: "until",
      priceUntil: "any",
      location: "",
      sortBy: "default",
      mileageTo: "any"
    });
  };

  const getHoursLabel = () => {
    switch (category) {
      case 'trucks':
        return t('filters.mileage');
      case 'machinery':
      case 'agriculture':
        return t('filters.operatingHours');
      default:
        return t('filters.operatingHours');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filters.title')}
          </CardTitle>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden"
          >
            {isExpanded ? t('common.hide') : t('common.show')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('filters.brand')}</label>
            <Select value={filters.brand} onValueChange={(value) => handleFilterChange('brand', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectBrand')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allBrands')}</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand.slug} value={brand.slug}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('filters.model')}</label>
            <Input
              type="text"
              placeholder={t('filters.enterModel')}
              value={filters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
            />
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('filters.yearFrom')}</label>
            <Select value={filters.yearFrom} onValueChange={(value) => handleFilterChange('yearFrom', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectYear')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('filters.anyYear')}</SelectItem>
                {yearOptions?.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hours/Mileage Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{getHoursLabel()}</label>
            <Select value={filters.operatingHoursUntil} onValueChange={(value) => handleFilterChange('operatingHoursUntil', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectHours')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('filters.anyHours')}</SelectItem>
                {hoursOptions?.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Price Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('filters.priceUntil')}</label>
            <Select value={filters.priceUntil} onValueChange={(value) => handleFilterChange('priceUntil', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectPrice')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('filters.anyPrice')}</SelectItem>
                {priceOptions?.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('filters.location')}</label>
            <Input
              type="text"
              placeholder={t('filters.enterLocation')}
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('filters.sortBy')}</label>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectSort')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t('filters.defaultSort')}</SelectItem>
                <SelectItem value="price-low">{t('filters.priceLowToHigh')}</SelectItem>
                <SelectItem value="price-high">{t('filters.priceHighToLow')}</SelectItem>
                <SelectItem value="year-new">{t('filters.yearNewest')}</SelectItem>
                <SelectItem value="year-old">{t('filters.yearOldest')}</SelectItem>
                <SelectItem value="hours-low">{t('filters.hoursLowToHigh')}</SelectItem>
                <SelectItem value="hours-high">{t('filters.hoursHighToLow')}</SelectItem>
                <SelectItem value="name-asc">{t('filters.nameAZ')}</SelectItem>
                <SelectItem value="name-desc">{t('filters.nameZA')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            {t('filters.clearAll')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TruckFilter;
