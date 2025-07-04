import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Search, Truck, Cog, Tractor } from "lucide-react";
import { useSubcategories } from "@/hooks/useCategories";
import { useNewVehicleBrands } from "@/hooks/useNewVehicleBrands";
import { VehicleFilters } from "@/hooks/useVehicles";

interface NewVehicleFilterProps {
  category?: string;
  onFilterChange: (filters: VehicleFilters) => void;
  vehicleCount?: number;
}

const NewVehicleFilter = ({ category, onFilterChange, vehicleCount = 0 }: NewVehicleFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<VehicleFilters>({
    category: category || undefined,
  });

  // Only fetch subcategories for the current category
  const { data: subcategories = [] } = useSubcategories(category);
  const { data: brands = [] } = useNewVehicleBrands();

  // Update category when prop changes
  useEffect(() => {
    if (category && category !== filters.category) {
      setFilters(prev => ({ ...prev, category, subcategory: undefined }));
    }
  }, [category, filters.category]);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key: keyof VehicleFilters, value: string | number | undefined) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value || undefined };
      
      // Reset subcategory when category changes
      if (key === 'category') {
        newFilters.subcategory = undefined;
      }
      
      return newFilters;
    });
  };

  const clearFilter = (key: keyof VehicleFilters) => {
    handleFilterChange(key, undefined);
  };

  const clearAllFilters = () => {
    setFilters({ category: category || undefined });
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      value !== undefined && value !== '' && key !== 'category'
    ).length;
  };

  const getCategoryIcon = (categorySlug?: string) => {
    switch (categorySlug) {
      case 'trucks':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'machinery':
        return <Cog className="h-4 w-4 text-blue-600" />;
      case 'agriculture':
        return <Tractor className="h-4 w-4 text-blue-600" />;
      default:
        return <Filter className="h-4 w-4 text-blue-600" />;
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

  const getCurrentYear = () => new Date().getFullYear();

  const conditionOptions = [
    { value: 'new', label: 'Novo' },
    { value: 'used', label: 'Usado' },
    { value: 'restored', label: 'Restaurado' },
    { value: 'modified', label: 'Modificado' }
  ];

  const fuelTypeOptions = [
    { value: 'diesel', label: 'Diesel' },
    { value: 'electric', label: 'Elétrico' },
    { value: 'hybrid', label: 'Híbrido' },
    { value: 'petrol', label: 'Gasolina' },
    { value: 'gas', label: 'Gás' }
  ];

  const gearboxOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'automatic', label: 'Automática' },
    { value: 'semi-automatic', label: 'Semi-automática' }
  ];

  const drivetrainOptions = [
    { value: '4x2', label: '4x2' },
    { value: '4x4', label: '4x4' },
    { value: '6x2', label: '6x2' },
    { value: '6x4', label: '6x4' },
    { value: '8x4', label: '8x4' },
    { value: '8x6', label: '8x6' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Mais Recentes' },
    { value: 'price-low', label: 'Preço: Menor para Maior' },
    { value: 'price-high', label: 'Preço: Maior para Menor' },
    { value: 'year-new', label: 'Ano: Mais Novo' },
    { value: 'year-old', label: 'Ano: Mais Antigo' },
    { value: 'mileage-low', label: 'Quilometragem: Menor' },
    { value: 'mileage-high', label: 'Quilometragem: Maior' },
    { value: 'hours-low', label: 'Horas: Menor' },
    { value: 'hours-high', label: 'Horas: Maior' },
    { value: 'power-low', label: 'Potência: Menor' },
    { value: 'power-high', label: 'Potência: Maior' }
  ];

  const isVehicleCategory = (cat?: string) => cat === 'trucks';
  const isMachineryCategory = (cat?: string) => cat === 'machinery' || cat === 'agriculture';

  return (
    <Card className="mb-8">
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
          <div className="flex gap-2">
            {getActiveFiltersCount() > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Limpar Tudo
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Menos Filtros' : 'Mais Filtros'}
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
              size="sm"
            >
              <Search className="h-4 w-4 mr-2" />
              Pesquisar {vehicleCount} ofertas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Filters - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="subcategory" className="flex items-center gap-2">
              {getCategoryIcon(category)}
              <span>Subcategoria</span>
            </Label>
            <Select 
              value={filters.subcategory || 'all'} 
              onValueChange={(value) => handleFilterChange('subcategory', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as subcategorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as subcategorias</SelectItem>
                {subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.slug}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="brand">Marca</Label>
            <Select 
              value={filters.brand || 'all'} 
              onValueChange={(value) => handleFilterChange('brand', value === 'all' ? undefined : value)}
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

          <div>
            <Label htmlFor="sortBy">Ordenar por</Label>
            <Select 
              value={filters.sortBy || 'default'} 
              onValueChange={(value) => handleFilterChange('sortBy', value === 'default' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão</SelectItem>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || key === 'category') return null;
              
              const getFilterLabel = (key: string, value: any) => {
                switch (key) {
                  case 'subcategory':
                    return subcategories.find(s => s.slug === value)?.name || value;
                  case 'brand':
                    return brands.find(b => b.slug === value)?.name || value;
                  case 'condition':
                    return conditionOptions.find(c => c.value === value)?.label || value;
                  case 'fuelType':
                    return fuelTypeOptions.find(f => f.value === value)?.label || value;
                  case 'gearbox':
                    return gearboxOptions.find(g => g.value === value)?.label || value;
                  case 'drivetrain':
                    return drivetrainOptions.find(d => d.value === value)?.label || value;
                  case 'sortBy':
                    return sortOptions.find(s => s.value === value)?.label || value;
                  default:
                    return value;
                }
              };

              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {getFilterLabel(key, value)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4"
                    onClick={() => clearFilter(key as keyof VehicleFilters)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-6">
            {/* Basic Properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="condition">Condição</Label>
                <Select 
                  value={filters.condition || 'all'} 
                  onValueChange={(value) => handleFilterChange('condition', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as condições" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as condições</SelectItem>
                    {conditionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fuelType">Combustível</Label>
                <Select 
                  value={filters.fuelType || 'all'} 
                  onValueChange={(value) => handleFilterChange('fuelType', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os combustíveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os combustíveis</SelectItem>
                    {fuelTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gearbox">Caixa de Velocidades</Label>
                <Select 
                  value={filters.gearbox || 'all'} 
                  onValueChange={(value) => handleFilterChange('gearbox', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as caixas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as caixas</SelectItem>
                    {gearboxOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Year Range */}
              <div>
                <Label>Ano</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="De"
                      value={filters.yearFrom || ''}
                      onChange={(e) => handleFilterChange('yearFrom', e.target.value ? Number(e.target.value) : undefined)}
                      min={1950}
                      max={getCurrentYear()}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Até"
                      value={filters.yearTo || ''}
                      onChange={(e) => handleFilterChange('yearTo', e.target.value ? Number(e.target.value) : undefined)}
                      min={1950}
                      max={getCurrentYear()}
                    />
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <Label>Preço (€)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="De"
                      value={filters.priceFrom || ''}
                      onChange={(e) => handleFilterChange('priceFrom', e.target.value ? Number(e.target.value) : undefined)}
                      min={0}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Até"
                      value={filters.priceTo || ''}
                      onChange={(e) => handleFilterChange('priceTo', e.target.value ? Number(e.target.value) : undefined)}
                      min={0}
                    />
                  </div>
                </div>
              </div>

              {/* Conditional Mileage/Hours */}
              {isVehicleCategory(filters.category) && (
                <div>
                  <Label>Quilometragem (km)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        type="number"
                        placeholder="De"
                        value={filters.mileageFrom || ''}
                        onChange={(e) => handleFilterChange('mileageFrom', e.target.value ? Number(e.target.value) : undefined)}
                        min={0}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Até"
                        value={filters.mileageTo || ''}
                        onChange={(e) => handleFilterChange('mileageTo', e.target.value ? Number(e.target.value) : undefined)}
                        min={0}
                      />
                    </div>
                  </div>
                </div>
              )}

              {isMachineryCategory(filters.category) && (
                <div>
                  <Label>Horas de Operação</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        type="number"
                        placeholder="De"
                        value={filters.operatingHoursFrom || ''}
                        onChange={(e) => handleFilterChange('operatingHoursFrom', e.target.value ? Number(e.target.value) : undefined)}
                        min={0}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Até"
                        value={filters.operatingHoursTo || ''}
                        onChange={(e) => handleFilterChange('operatingHoursTo', e.target.value ? Number(e.target.value) : undefined)}
                        min={0}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Power Range */}
              <div>
                <Label>Potência (PS)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="De"
                      value={filters.powerFrom || ''}
                      onChange={(e) => handleFilterChange('powerFrom', e.target.value ? Number(e.target.value) : undefined)}
                      min={0}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Até"
                      value={filters.powerTo || ''}
                      onChange={(e) => handleFilterChange('powerTo', e.target.value ? Number(e.target.value) : undefined)}
                      min={0}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="drivetrain">Tração</Label>
                <Select 
                  value={filters.drivetrain || 'all'} 
                  onValueChange={(value) => handleFilterChange('drivetrain', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as trações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as trações</SelectItem>
                    {drivetrainOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Localização</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="location"
                    type="text"
                    placeholder="Cidade, região..."
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewVehicleFilter;
