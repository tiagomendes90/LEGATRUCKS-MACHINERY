
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const [currentLanguage, setCurrentLanguage] = useState("EN");

  const languages = [
    { code: "EN", name: "English", flag: "🇺🇸" },
    { code: "FR", name: "Français", flag: "🇫🇷" },
    { code: "PT", name: "Português", flag: "🇵🇹" },
  ];

  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode);
    // For now, we'll just update the state
    // In a real implementation, you would integrate with i18n library
    console.log(`Language changed to: ${langCode}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-white hover:bg-white/10 gap-1 px-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`cursor-pointer ${
              currentLanguage === lang.code ? "bg-blue-50" : ""
            }`}
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="text-sm">{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
