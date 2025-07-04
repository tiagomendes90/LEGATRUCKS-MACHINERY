
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw } from "lucide-react";
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
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" focusable="false" aria-hidden="true" fill="none" className="h-4 w-4">
          <path d="M42.79 12.34L40.45 7.65997C39.94 6.63997 38.9 5.99997 37.77 5.99997H33.01V3.99997C33.01 2.89997 32.11 1.99997 31.01 1.99997H7C5.9 1.99997 5 2.89997 5 3.99997V19H9.05C9.3 20.69 10.74 22 12.5 22C14.26 22 15.7 20.69 15.95 19H31.05C31.3 20.69 32.74 22 34.5 22C36.26 22 37.7 20.69 37.95 19H43V13.24C43 12.93 42.93 12.62 42.79 12.35V12.34ZM38.66 8.54997L40.38 12H37V7.99997H37.76C38.14 7.99997 38.48 8.20997 38.65 8.54997H38.66ZM31 3.99997V12H7V3.99997H31ZM7 14H31V17H15.65C15.09 15.82 13.89 15 12.5 15C11.11 15 9.92 15.82 9.35 17H7V14ZM12.5 20C11.67 20 11 19.33 11 18.5C11 17.67 11.67 17 12.5 17C13.33 17 14 17.67 14 18.5C14 19.33 13.33 20 12.5 20ZM34.5 20C33.67 20 33 19.33 33 18.5C33 17.67 33.67 17 34.5 17C35.33 17 36 17.67 36 18.5C36 19.33 35.33 20 34.5 20ZM37.65 17C37.09 15.82 35.89 15 34.5 15C33.96 15 33.46 15.13 33 15.35V7.99997H35V12C35 13.1 35.9 14 37 14H41V17H37.65Z" fill="#3B82F6" />
        </svg>
      );
    case 'machinery':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" focusable="false" aria-hidden="true" fill="none" className="h-4 w-4">
          <path fillRule="evenodd" clipRule="evenodd" d="M25.1961 5.63638L29.902 3.02174C31.2681 2.26266 32.9882 2.67963 33.8552 3.98004L39.8685 13H40C42.4853 13 44.5 15.0147 44.5 17.5C44.5 19.9853 42.4853 22 40 22H36V20H38V16.0114L29.8084 10.0952L27 12.026V14H25V16H28C29.6569 16 31 17.3432 31 19C31 20.6569 29.6569 22 28 22H8C6.34314 22 5 20.6569 5 19C5 17.3432 6.34315 16 8 16H14.0858L12.9645 14.8787C12.4019 14.3161 11.6388 14 10.8431 14H5V10C5 8.89546 5.89543 8.00003 7 8.00003H19V4.00003H21.9689C23.2632 4.00003 24.4543 4.62361 25.1961 5.63638ZM30.8733 4.77C31.3287 4.51698 31.9021 4.65597 32.1911 5.08944L32.6211 5.73448L26.9346 9.64394L26.0557 7.44674L30.8733 4.77ZM31.5585 8.89209L33.7306 7.39875L37.6676 13.3042L31.5585 8.89209ZM16.9142 16H23V14H19V10H7V12H10.8431C12.1692 12 13.441 12.5268 14.3787 13.4645L16.9142 16ZM21 6.00003V12H25V10.1926L23.8259 7.25725C23.5221 6.49793 22.7867 6.00003 21.9689 6.00003H21ZM40 20C41.3807 20 42.5 18.8807 42.5 17.5C42.5 16.1193 41.3807 15 40 15V20ZM8 18C7.44772 18 7 18.4477 7 19C7 19.5523 7.44772 20 8 20H9.25V18H8ZM13.25 18H10.75V20H13.25V18ZM17.25 18H14.75V20H17.25V18ZM21.25 18H18.75V20H21.25V18ZM25.25 18H22.75V20H25.25V18ZM28 18H26.75V20H28C28.5523 20 29 19.5523 29 19C29 18.4477 28.5523 18 28 18Z" fill="#3B82F6" />
        </svg>
      );
    case 'agriculture':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" focusable="false" aria-hidden="true" fill="none" className="h-4 w-4">
          <path fillRule="evenodd" clipRule="evenodd" d="M17.5 12.75C15.9812 12.75 14.75 13.9812 14.75 15.5C14.75 17.0188 15.9812 18.25 17.5 18.25C19.0188 18.25 20.25 17.0188 20.25 15.5C20.25 13.9812 19.0188 12.75 17.5 12.75ZM16.25 15.5C16.25 14.8096 16.8096 14.25 17.5 14.25C18.1904 14.25 18.75 14.8096 18.75 15.5C18.75 16.1904 18.1904 16.75 17.5 16.75C16.8096 16.75 16.25 16.1904 16.25 15.5Z" fill="#3B82F6" />
          <path fillRule="evenodd" clipRule="evenodd" d="M13.847 4H12V2H25V4H23.7208L24.7402 7.05821L27 7.24653V5H29V7.4132L32.9124 7.73923C35.2059 7.93036 36.8655 10.0127 36.54 12.2911L36.2016 14.6599C37.2851 15.3755 38 16.6043 38 18C38 20.2091 36.2091 22 34 22C31.7909 22 30 20.2091 30 18H23.5018C22.5223 20.349 20.204 22 17.5 22C13.9101 22 11 19.0899 11 15.5C11 13.7535 11.6888 12.1679 12.8096 11H11.9142L10.7071 12.2071L9.29285 10.7929L11.0857 9H13.1327L13.847 4ZM34 14C34.0922 14 34.1836 14.0031 34.2742 14.0093L34.5601 12.0083C34.7228 10.8691 33.8931 9.82789 32.7463 9.73232L24.2645 9.02551L23.0662 9.82435C22.6343 10.1123 22.174 10.3498 21.6943 10.5342C22.1919 10.9549 22.6255 11.4491 22.9782 12H26C27.1046 12 28 12.8954 28 14V16H30.5351C31.2267 14.8044 32.5194 14 34 14ZM15.153 9H19.1833C20.1705 9 21.1355 8.70781 21.9568 8.16025L22.8098 7.59163L21.6126 4H15.8673L15.153 9ZM26 14H23.8261C23.9398 14.4815 24 14.9837 24 15.5C24 15.6682 23.9936 15.835 23.9811 16H26V14ZM22 15.5C22 13.0147 19.9853 11 17.5 11C15.0147 11 13 13.0147 13 15.5C13 17.9853 15.0147 20 17.5 20C19.9853 20 22 17.9853 22 15.5ZM34 16C32.8954 16 32 16.8954 32 18C32 19.1046 32.8954 20 34 20C35.1046 20 36 19.1046 36 18C36 16.8954 35.1046 16 34 16Z" fill="#3B82F6" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-600">
          <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
        </svg>
      );
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
      search: ''
    });
  };

  const getActiveFiltersCount = () => {
    if (!filters) return 0;
    return Object.entries(filters).filter(([key, value]) => value && key !== 'search').length;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getCategoryIcon(category)}
            <span>Filtros de {getCategoryName(category)}</span>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          {getActiveFiltersCount() > 0 && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <Label htmlFor="search">Pesquisar</Label>
          <Input
            id="search"
            placeholder="Pesquisar por título, marca..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        {/* Subcategory - only show if we have subcategories for this category */}
        {subcategories.length > 0 && (
          <div>
            <Label htmlFor="subcategory" className="flex items-center gap-2">
              {getCategoryIcon(category)}
              <span>Subcategoria</span>
            </Label>
            <Select 
              value={filters.subcategory || 'all'} 
              onValueChange={(value) => handleFilterChange('subcategory', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as subcategorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as subcategorias</SelectItem>
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
          <Label htmlFor="brand">Marca</Label>
          <Select 
            value={filters.brand || 'all'} 
            onValueChange={(value) => handleFilterChange('brand', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
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

        {/* Year Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="yearFrom">Ano (de)</Label>
            <Select 
              value={filters.yearFrom || 'all'} 
              onValueChange={(value) => handleFilterChange('yearFrom', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
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
            <Label htmlFor="yearTo">Ano (até)</Label>
            <Select 
              value={filters.yearTo || 'all'} 
              onValueChange={(value) => handleFilterChange('yearTo', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
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
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="priceFrom">Preço (de)</Label>
            <Input
              id="priceFrom"
              type="number"
              placeholder="€ Min"
              value={filters.priceFrom}
              onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="priceTo">Preço (até)</Label>
            <Input
              id="priceTo"
              type="number"
              placeholder="€ Max"
              value={filters.priceTo}
              onChange={(e) => handleFilterChange('priceTo', e.target.value)}
            />
          </div>
        </div>

        {/* Condition */}
        <div>
          <Label htmlFor="condition">Estado</Label>
          <Select 
            value={filters.condition || 'all'} 
            onValueChange={(value) => handleFilterChange('condition', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Qualquer estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer estado</SelectItem>
              <SelectItem value="new">Novo</SelectItem>
              <SelectItem value="used">Usado</SelectItem>
              <SelectItem value="damaged">Danificado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fuel Type */}
        <div>
          <Label htmlFor="fuelType">Combustível</Label>
          <Select 
            value={filters.fuelType || 'all'} 
            onValueChange={(value) => handleFilterChange('fuelType', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Qualquer combustível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer combustível</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="gasoline">Gasolina</SelectItem>
              <SelectItem value="electric">Elétrico</SelectItem>
              <SelectItem value="hybrid">Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <Button 
          onClick={onSearch} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Search className="h-4 w-4 mr-2" />
          Pesquisar {totalCount} oferta{totalCount !== 1 ? 's' : ''}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NewVehicleFilter;
