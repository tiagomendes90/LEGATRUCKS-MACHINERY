
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface VehicleSearchBarProps {
  onSearch: (keyword: string) => void;
  placeholder?: string;
  className?: string;
}

const VehicleSearchBar = ({ 
  onSearch, 
  placeholder, 
  className = "" 
}: VehicleSearchBarProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const finalPlaceholder = placeholder || t('searchBar.placeholder');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder={finalPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      <Button type="submit" variant="default">
        {t('searchBar.button')}
      </Button>
    </form>
  );
};

export default VehicleSearchBar;
