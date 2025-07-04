
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Search, RotateCcw, ChevronDown, ChevronUp, Truck, Cog, Tractor } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCategories } from "@/hooks/useCategories";

interface VehicleFilters {
  brand: string;
  subcategory: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
  condition: string;
  fuelType: string;
  search: string;
  mileageMax: string;
  operatingHoursMax: string;
  gearbox: string;
  drivetrain: string;
  axles: string;
  powerPs: string;
  weightKg: string;
  bodyColor: string;
  sortBy: string;
}

interface NewVehicleFilterProps {
  filters: VehicleFilters;
  onFiltersChange: (filters: VehicleFilters) => void;
  onSearch: () => void;
  totalCount: number;
  brands: Array<{ id: string; name: string; slug: string }>;
  category?: string;
}

const getCategoryIcon = (categorySlug?: string) => {
  switch (categorySlug) {
    case 'trucks':
      return <Truck className="h-6 w-6 text-blue-600" />;
    case 'machinery':
      return <Cog className="h-6 w-6 text-blue-600" />;
    case 'agriculture':
      return <Tractor className="h-6 w-6 text-blue-600" />;
    default:
      return <Truck className="h-6 w-6 text-blue-600" />;
  }
};

const getCategoryName = (categorySlug?: string) => {
  switch (categorySlug) {
    case 'trucks':
      return 'Camiões';
    case 'machinery':
      return 'Máquinas';
    case 'agriculture':
      return 'Agricultura';
    default:
      return 'Veículos';
  }
};

const NewVehicleFilter: React.FC<NewVehicleFilterProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  totalCount,
  brands,
  category
}) => {
  const { data: categories = [] } = useCategories();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([filters.priceTo ? parseInt(filters.priceTo) : 500000]);
  
  // Filter subcategories by the current category
  const subcategories = React.useMemo(() => {
    if (!category) return [];
    
    const categoryData = categories.find(cat => cat.slug === category);
    return categoryData?.subcategories || [];
  }, [categories, category]);

  const handleFilterChange = (key: keyof VehicleFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    handleFilterChange('priceTo', values[0].toString());
  };

  const resetFilters = () => {
    onFiltersChange({
      brand: '',
      subcategory: '',
      yearFrom: '',
      yearTo: '',
      priceFrom: '',
      priceTo: '',
      condition: '',
      fuelType: '',
      search: '',
      mileageMax: '',
      operatingHoursMax: '',
      gearbox: '',
      drivetrain: '',
      axles: '',
      powerPs: '',
      weightKg: '',
      bodyColor: '',
      sortBy: ''
    });
    setPriceRange([500000]);
  };

  const getActiveFiltersCount = () => {
    if (!filters) return 0;
    return Object.entries(filters).filter(([key, value]) => value && key !== 'search' && key !== 'sortBy').length;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="w-full mb-8">
      {/* Category Header with improved icon styling */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-blue-100 rounded-lg p-3 flex items-center justify-center">
            {getCategoryIcon(category)}
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{getCategoryName(category)}</h2>
            <span className="text-gray-600 font-medium">{totalCount} oferta{totalCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Basic Filters - Always Visible */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Subcategory */}
            {subcategories.length > 0 && (
              <div>
                <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700 mb-2 block">
                  Subcategoria
                </Label>
                <Select 
                  value={filters.subcategory || 'all'} 
                  onValueChange={(value) => handleFilterChange('subcategory', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.slug}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Brand */}
            <div>
              <Label htmlFor="brand" className="text-sm font-medium text-gray-700 mb-2 block">
                Marca
              </Label>
              <Select 
                value={filters.brand || 'all'} 
                onValueChange={(value) => handleFilterChange('brand', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Todas as marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.slug}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Slider */}
            <div>
              <Label htmlFor="price" className="text-sm font-medium text-gray-700 mb-2 block">
                Preço até: €{priceRange[0].toLocaleString()}
              </Label>
              <div className="px-2 py-3">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  max={500000}
                  min={0}
                  step={5000}
                  className="w-full"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <Label htmlFor="condition" className="text-sm font-medium text-gray-700 mb-2 block">
                Estado
              </Label>
              <Select 
                value={filters.condition || 'all'} 
                onValueChange={(value) => handleFilterChange('condition', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="used">Usado</SelectItem>
                  <SelectItem value="restored">Restaurado</SelectItem>
                  <SelectItem value="modified">Modificado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <Label htmlFor="sortBy" className="text-sm font-medium text-gray-700 mb-2 block">
                Ordenar por
              </Label>
              <Select 
                value={filters.sortBy || 'relevance'} 
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Relevância" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevância</SelectItem>
                  <SelectItem value="price_asc">Preço crescente</SelectItem>
                  <SelectItem value="price_desc">Preço decrescente</SelectItem>
                  <SelectItem value="year_desc">Ano mais recente</SelectItem>
                  <SelectItem value="year_asc">Ano mais antigo</SelectItem>
                  <SelectItem value="mileage_asc">Menos quilómetros</SelectItem>
                  <SelectItem value="hours_asc">Menos horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  Mais filtros
                  {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>

            <Button 
              onClick={onSearch} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Pesquisar {totalCount} oferta{totalCount !== 1 ? 's' : ''}
            </Button>

            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-600">
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}

            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="text-sm">
                {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters - Collapsible */}
      <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros Avançados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Year Range */}
                <div>
                  <Label htmlFor="yearFrom" className="text-sm font-medium text-gray-700 mb-2 block">
                    Ano de
                  </Label>
                  <Select 
                    value={filters.yearFrom || 'all'} 
                    onValueChange={(value) => handleFilterChange('yearFrom', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="yearTo" className="text-sm font-medium text-gray-700 mb-2 block">
                    Ano até
                  </Label>
                  <Select 
                    value={filters.yearTo || 'all'} 
                    onValueChange={(value) => handleFilterChange('yearTo', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mileage - Only for trucks */}
                {category === 'trucks' && (
                  <div>
                    <Label htmlFor="mileageMax" className="text-sm font-medium text-gray-700 mb-2 block">
                      Quilómetros até
                    </Label>
                    <Input
                      id="mileageMax"
                      type="number"
                      placeholder="ex: 100000"
                      value={filters.mileageMax}
                      onChange={(e) => handleFilterChange('mileageMax', e.target.value)}
                      className="h-11"
                    />
                  </div>
                )}

                {/* Operating Hours - Only for machinery and agriculture */}
                {(category === 'machinery' || category === 'agriculture') && (
                  <div>
                    <Label htmlFor="operatingHoursMax" className="text-sm font-medium text-gray-700 mb-2 block">
                      Horas até
                    </Label>
                    <Input
                      id="operatingHoursMax"
                      type="number"
                      placeholder="ex: 5000"
                      value={filters.operatingHoursMax}
                      onChange={(e) => handleFilterChange('operatingHoursMax', e.target.value)}
                      className="h-11"
                    />
                  </div>
                )}

                {/* Gearbox */}
                <div>
                  <Label htmlFor="gearbox" className="text-sm font-medium text-gray-700 mb-2 block">
                    Transmissão
                  </Label>
                  <Select 
                    value={filters.gearbox || 'all'} 
                    onValueChange={(value) => handleFilterChange('gearbox', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automática</SelectItem>
                      <SelectItem value="semi-automatic">Semi-automática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Drivetrain */}
                <div>
                  <Label htmlFor="drivetrain" className="text-sm font-medium text-gray-700 mb-2 block">
                    Tração
                  </Label>
                  <Select 
                    value={filters.drivetrain || 'all'} 
                    onValueChange={(value) => handleFilterChange('drivetrain', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      <SelectItem value="2wd">2WD</SelectItem>
                      <SelectItem value="4wd">4WD</SelectItem>
                      <SelectItem value="awd">AWD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Axles */}
                <div>
                  <Label htmlFor="axles" className="text-sm font-medium text-gray-700 mb-2 block">
                    Nº de eixos
                  </Label>
                  <Input
                    id="axles"
                    type="number"
                    placeholder="ex: 2"
                    value={filters.axles}
                    onChange={(e) => handleFilterChange('axles', e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Fuel Type */}
                <div>
                  <Label htmlFor="fuelType" className="text-sm font-medium text-gray-700 mb-2 block">
                    Combustível
                  </Label>
                  <Select 
                    value={filters.fuelType || 'all'} 
                    onValueChange={(value) => handleFilterChange('fuelType', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="gasoline">Gasolina</SelectItem>
                      <SelectItem value="electric">Elétrico</SelectItem>
                      <SelectItem value="hybrid">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Power */}
                <div>
                  <Label htmlFor="powerPs" className="text-sm font-medium text-gray-700 mb-2 block">
                    Potência até (PS)
                  </Label>
                  <Input
                    id="powerPs"
                    type="number"
                    placeholder="ex: 500"
                    value={filters.powerPs}
                    onChange={(e) => handleFilterChange('powerPs', e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Weight */}
                <div>
                  <Label htmlFor="weightKg" className="text-sm font-medium text-gray-700 mb-2 block">
                    Peso até (kg)
                  </Label>
                  <Input
                    id="weightKg"
                    type="number"
                    placeholder="ex: 40000"
                    value={filters.weightKg}
                    onChange={(e) => handleFilterChange('weightKg', e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Body Color */}
                <div>
                  <Label htmlFor="bodyColor" className="text-sm font-medium text-gray-700 mb-2 block">
                    Cor exterior
                  </Label>
                  <Select 
                    value={filters.bodyColor || 'all'} 
                    onValueChange={(value) => handleFilterChange('bodyColor', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      <SelectItem value="white">Branco</SelectItem>
                      <SelectItem value="black">Preto</SelectItem>
                      <SelectItem value="silver">Prateado</SelectItem>
                      <SelectItem value="red">Vermelho</SelectItem>
                      <SelectItem value="blue">Azul</SelectItem>
                      <SelectItem value="green">Verde</SelectItem>
                      <SelectItem value="yellow">Amarelo</SelectItem>
                      <SelectItem value="orange">Laranja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default NewVehicleFilter;
