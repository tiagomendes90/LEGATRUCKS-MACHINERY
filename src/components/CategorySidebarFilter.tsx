import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useVehicleBrandsByCategory } from "@/hooks/useNewVehicleBrands";
import { useTranslation } from "react-i18next";

export interface SidebarFilters {
  subcategory: string;
  brand: string;
  condition: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
  sortBy: string;
}

interface Props {
  category?: string;
  filters: SidebarFilters;
  onChange: (next: SidebarFilters) => void;
}

const CategorySidebarFilter: React.FC<Props> = ({ category, filters, onChange }) => {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const { data: brands = [], isLoading: brandsLoading } = useVehicleBrandsByCategory(category);

  const subcategories = React.useMemo(() => {
    const cat = (categories as any[]).find((c) => c.slug === category);
    return cat?.subcategories || [];
  }, [categories, category]);

  const set = (key: keyof SidebarFilters, value: string) =>
    onChange({ ...filters, [key]: value });

  const reset = () =>
    onChange({
      subcategory: "",
      brand: "",
      condition: "",
      yearFrom: "",
      yearTo: "",
      priceFrom: "",
      priceTo: "",
      sortBy: "",
    });

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== "sortBy"
  ).length;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <aside className="w-full bg-white border border-gray-200 rounded-lg p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          {t("common.filter")}
        </h2>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-gray-600 h-7 px-2"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            {t("filterPanel.clearFilters")}
          </Button>
        )}
      </div>

      {subcategories.length > 0 && (
        <div>
          <Label className="text-xs font-medium text-gray-700 mb-1.5 block uppercase tracking-wide">
            {t("filterPanel.subcategory")}
          </Label>
          <Select
            value={filters.subcategory || "all"}
            onValueChange={(v) => set("subcategory", v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t("filterPanel.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterPanel.all")}</SelectItem>
              {subcategories.map((s: any) => (
                <SelectItem key={s.id} value={s.slug}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label className="text-xs font-medium text-gray-700 mb-1.5 block uppercase tracking-wide">
          {t("filters.brand")}
        </Label>
        <Select
          value={filters.brand || "all"}
          onValueChange={(v) => set("brand", v === "all" ? "" : v)}
          disabled={brandsLoading || (brands as any[]).length === 0}
        >
          <SelectTrigger className="h-10">
            <SelectValue
              placeholder={
                brandsLoading
                  ? t("filterPanel.loading")
                  : t("filterPanel.allBrands")
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterPanel.allBrands")}</SelectItem>
            {(brands as any[]).map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700 mb-1.5 block uppercase tracking-wide">
          {t("filterPanel.condition")}
        </Label>
        <Select
          value={filters.condition || "all"}
          onValueChange={(v) => set("condition", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t("filterPanel.allConditions")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterPanel.allConditions")}</SelectItem>
            <SelectItem value="new">{t("filterPanel.new")}</SelectItem>
            <SelectItem value="used">{t("filterPanel.used")}</SelectItem>
            <SelectItem value="restored">{t("filterPanel.restored")}</SelectItem>
            <SelectItem value="modified">{t("filterPanel.modified")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700 mb-1.5 block uppercase tracking-wide">
          {t("filters.year")}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.yearFrom || "any"}
            onValueChange={(v) => set("yearFrom", v === "any" ? "" : v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t("filterPanel.yearFrom")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("filterPanel.any")}</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.yearTo || "any"}
            onValueChange={(v) => set("yearTo", v === "any" ? "" : v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t("filterPanel.yearTo")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("filterPanel.any")}</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700 mb-1.5 block uppercase tracking-wide">
          {t("filters.price")} (€)
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            value={filters.priceFrom}
            onChange={(e) => set("priceFrom", e.target.value)}
            className="h-10"
          />
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            value={filters.priceTo}
            onChange={(e) => set("priceTo", e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700 mb-1.5 block uppercase tracking-wide">
          {t("filterPanel.sortBy")}
        </Label>
        <Select
          value={filters.sortBy || "relevance"}
          onValueChange={(v) => set("sortBy", v === "relevance" ? "" : v)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t("filterPanel.relevance")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">{t("filterPanel.relevance")}</SelectItem>
            <SelectItem value="price-low">{t("filterPanel.priceAsc")}</SelectItem>
            <SelectItem value="price-high">{t("filterPanel.priceDesc")}</SelectItem>
            <SelectItem value="year-new">{t("filterPanel.yearDesc")}</SelectItem>
            <SelectItem value="year-old">{t("filterPanel.yearAsc")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
};

export default CategorySidebarFilter;