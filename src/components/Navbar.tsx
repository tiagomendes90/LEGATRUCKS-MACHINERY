import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCategories } from "@/hooks/useCategories";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollDelta = useRef(0);
  const location = useLocation();
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();

  const isHomepage = location.pathname === "/";

  const isActive = (path: string) => location.pathname === path;

  // Map category slugs to i18n keys
  const slugToNavKey: Record<string, string> = {
    camioes: 'nav.trucks',
    maquinas: 'nav.machinery',
    tractores: 'nav.tractors',
    reboques: 'nav.trailers',
    pecas: 'nav.parts',
  };

  // Build nav items dynamically from categories with translations
  const categoryItems = (categories as any[]).map((cat) => ({
    name: slugToNavKey[cat.slug] ? t(slugToNavKey[cat.slug]) : cat.name,
    path: `/${cat.slug}`,
  }));

  const navItems = [
    ...categoryItems,
    { name: t('nav.contact'), path: "/contactos" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY.current;
        setIsScrolled(currentScrollY > 20);

        if (currentScrollY < 50) {
          setIsVisible(true);
          scrollDelta.current = 0;
        } else {
          scrollDelta.current += delta;
          if (scrollDelta.current > 50) {
            setIsVisible(false);
            setIsOpen(false);
            scrollDelta.current = 0;
          } else if (scrollDelta.current < -10) {
            setIsVisible(true);
            scrollDelta.current = 0;
          }
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      onMouseEnter={() => setIsVisible(true)}
      onFocus={() => setIsVisible(true)}
      className={`fixed top-0 w-full z-50 transition-transform duration-300 ease-in-out will-change-transform ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled
          ? 'bg-orange-500/95 backdrop-blur-md shadow-lg border-b border-orange-600'
          : 'bg-transparent'
      }`}
      style={{ backfaceVisibility: 'hidden' }}
    >
      <div className="container mx-auto px-6">
          <div className="flex justify-between items-center py-2 lg:py-3 px-0">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img 
              src="/lovable-uploads/9a1d192d-e9d6-4064-944c-c583427ab323.png" 
              alt="LEGA Logo" 
              className="h-8 lg:h-9 w-auto object-contain opacity-90"
              loading="eager"
              width={108}
              height={32}
            />
          </Link>

          {/* Desktop Navigation - Right Justified */}
          <div className="hidden lg:flex items-center space-x-1 ml-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
               className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] ${
                  isActive(item.path)
                    ? isScrolled
                      ? "bg-orange-600 text-white"
                      : "bg-white/20 text-white"
                    : isScrolled
                    ? "text-white hover:bg-orange-600 hover:text-white"
                    : "text-white hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
            {/* Language Switcher */}
            <div className="ml-2">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isScrolled ? 'hover:bg-orange-600 text-white' : 'hover:bg-white/10 text-white'
              }`}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-3 border-t border-orange-600 bg-orange-500/95 backdrop-blur-md">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-orange-600 text-white"
                      : "text-white hover:bg-orange-600 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;