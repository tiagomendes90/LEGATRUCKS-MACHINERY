
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useBrands } from "@/hooks/useBrands";
import { useFilterOptions } from "@/hooks/useFilterOptions";

interface FilterProps {
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

const TruckFilter = ({ category, onFilterChange }: FilterProps) => {
  const { t } = useTranslation();
  const { data: brands } = useBrands(category);
  
  // Get filter options from database
  const { data: subcategoryOptions } = useFilterOptions(category, 'subcategory');
  const { data: priceOptions } = useFilterOptions(category, 'price');
  const { data: hoursOptions } = useFilterOptions(category, 'hours');
  const { data: yearOptions } = useFilterOptions(category, 'year');

  console.log('Filter debug - category:', category);
  console.log('Filter debug - subcategoryOptions:', subcategoryOptions);
  console.log('Filter debug - priceOptions:', priceOptions);
  console.log('Filter debug - hoursOptions:', hoursOptions);
  console.log('Filter debug - yearOptions:', yearOptions);

  // filter state variables
  const [selectedBrand, setSelectedBrand] = useState("");
  const [model, setModel] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [operatingHoursUntil, setOperatingHoursUntil] = useState("");
  const [priceType, setPriceType] = useState("");
  const [priceUntil, setPriceUntil] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [mileageTo, setMileageTo] = useState("");

  // Generate default options if database doesn't provide them
  const defaultPriceOptions = [
    { option_value: "5000", option_label: "€5,000" },
    { option_value: "10000", option_label: "€10,000" },
    { option_value: "25000", option_label: "€25,000" },
    { option_value: "50000", option_label: "€50,000" },
    { option_value: "75000", option_label: "€75,000" },
    { option_value: "100000", option_label: "€100,000" },
    { option_value: "150000", option_label: "€150,000" },
    { option_value: "200000", option_label: "€200,000" },
    { option_value: "300000", option_label: "€300,000" },
    { option_value: "500000", option_label: "€500,000" },
  ];

  const defaultYearOptions = [
    { option_value: "2010", option_label: "2010" },
    { option_value: "2012", option_label: "2012" },
    { option_value: "2015", option_label: "2015" },
    { option_value: "2018", option_label: "2018" },
    { option_value: "2020", option_label: "2020" },
    { option_value: "2021", option_label: "2021" },
    { option_value: "2022", option_label: "2022" },
    { option_value: "2023", option_label: "2023" },
    { option_value: "2024", option_label: "2024" },
  ];

  const defaultHoursOptions = [
    { option_value: "1000", option_label: "1,000" },
    { option_value: "2500", option_label: "2,500" },
    { option_value: "5000", option_label: "5,000" },
    { option_value: "7500", option_label: "7,500" },
    { option_value: "10000", option_label: "10,000" },
    { option_value: "15000", option_label: "15,000" },
    { option_value: "20000", option_label: "20,000" },
    { option_value: "50000", option_label: "50,000" },
    { option_value: "100000", option_label: "100,000" },
    { option_value: "200000", option_label: "200,000" },
  ];

  // Use database options if available, otherwise use defaults
  const finalPriceOptions = priceOptions && priceOptions.length > 0 ? priceOptions : defaultPriceOptions;
  const finalYearOptions = yearOptions && yearOptions.length > 0 ? yearOptions : defaultYearOptions;
  const finalHoursOptions = hoursOptions && hoursOptions.length > 0 ? hoursOptions : defaultHoursOptions;

  // Filter out options with empty values to prevent the SelectItem error
  const validSubcategoryOptions = subcategoryOptions?.filter(option => option.option_value && option.option_value.trim() !== '') || [];
  const validPriceOptions = finalPriceOptions.filter(option => option.option_value && option.option_value.trim() !== '');
  const validYearOptions = finalYearOptions.filter(option => option.option_value && option.option_value.trim() !== '');
  const validHoursOptions = finalHoursOptions.filter(option => option.option_value && option.option_value.trim() !== '');

  console.log('Filter debug - validPriceOptions:', validPriceOptions);
  console.log('Filter debug - validYearOptions:', validYearOptions);
  console.log('Filter debug - validHoursOptions:', validHoursOptions);
  console.log('Filter debug - validSubcategoryOptions:', validSubcategoryOptions);

  useEffect(() => {
    onFilterChange({
      brand: selectedBrand,
      model: model.trim(),
      yearFrom,
      operatingHoursUntil,
      priceType,
      priceUntil,
      location: location.trim(),
      sortBy,
      mileageTo: category === 'trucks' ? mileageTo : undefined,
    });
  }, [selectedBrand, model, yearFrom, operatingHoursUntil, priceType, priceUntil, location, sortBy, mileageTo, category, onFilterChange]);

  const resetFilters = () => {
    setSelectedBrand("");
    setModel("");
    setYearFrom("");
    setOperatingHoursUntil("");
    setPriceType("");
    setPriceUntil("");
    setLocation("");
    setSortBy("");
    setMileageTo("");
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{t('filters.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          
          {/* Brand Filter */}
          <div className="space-y-2">
            <Label htmlFor="brand">{t('filters.brand')}</Label>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
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
          <div className="space-y-2">
            <Label htmlFor="model">{t('filters.model')}</Label>
            <Input
              id="model"
              type="text"
              placeholder={t('filters.enterModel')}
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>

          {/* Subcategory Filter */}
          {validSubcategoryOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">{t('filters.subcategory')}</Label>
              <Select value={priceType} onValueChange={setPriceType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.selectSubcategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allSubcategories')}</SelectItem>
                  {validSubcategoryOptions.map((option) => (
                    <SelectItem key={option.option_value} value={option.option_value}>
                      {option.option_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Year from Filter */}
          <div className="space-y-2">
            <Label htmlFor="yearFrom">{t('filters.yearFrom')}</Label>
            <Select value={yearFrom} onValueChange={setYearFrom}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectYear')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allYears')}</SelectItem>
                {validYearOptions.map((option) => (
                  <SelectItem key={option.option_value} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price until Filter */}
          <div className="space-y-2">
            <Label htmlFor="priceUntil">{t('filters.priceUntil')}</Label>
            <Select value={priceUntil} onValueChange={setPriceUntil}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectPrice')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allPrices')}</SelectItem>
                {validPriceOptions.map((option) => (
                  <SelectItem key={option.option_value} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operating Hours / Kilometers */}
          <div className="space-y-2">
            <Label htmlFor="operatingHours">
              {category === 'trucks' ? t('filters.kilometersUntil') : t('filters.operatingHoursUntil')}
            </Label>
            <Select value={operatingHoursUntil} onValueChange={setOperatingHoursUntil}>
              <SelectTrigger>
                <SelectValue placeholder={
                  category === 'trucks' ? t('filters.selectKilometers') : t('filters.selectOperatingHours')
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allHours')}</SelectItem>
                {validHoursOptions.map((option) => (
                  <SelectItem key={option.option_value} value={option.option_value}>
                    {option.option_label} {category === 'trucks' ? 'km' : 'h'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Mileage filter for trucks */}
          {category === 'trucks' && (
            <div className="space-y-2">
              <Label htmlFor="mileageTo">{t('filters.mileageTo')}</Label>
              <Select value={mileageTo} onValueChange={setMileageTo}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.selectMileage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allMileage')}</SelectItem>
                  {validHoursOptions.map((option) => (
                    <SelectItem key={option.option_value} value={option.option_value}>
                      {option.option_label} km
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location Filter */}
          <div className="space-y-2">
            <Label htmlFor="location">{t('filters.location')}</Label>
            <Input
              id="location"
              type="text"
              placeholder={t('filters.enterLocation')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

        </div>

        <Separator className="my-6" />

        {/* Sorting and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="sortBy">{t('filters.sortBy')}</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder={t('filters.selectSort')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">{t('filters.relevance')}</SelectItem>
                <SelectItem value="price-low">{t('filters.priceLowToHigh')}</SelectItem>
                <SelectItem value="price-high">{t('filters.priceHighToLow')}</SelectItem>
                <SelectItem value="year-new">{t('filters.yearNewestFirst')}</SelectItem>
                <SelectItem value="year-old">{t('filters.yearOldestFirst')}</SelectItem>
                <SelectItem value="hours-low">{t('filters.hoursLowToHigh')}</SelectItem>
                <SelectItem value="hours-high">{t('filters.hoursHighToLow')}</SelectItem>
                <SelectItem value="name-asc">{t('filters.nameAZ')}</SelectItem>
                <SelectItem value="name-desc">{t('filters.nameZA')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="shrink-0"
          >
            {t('filters.resetFilters')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TruckFilter;
