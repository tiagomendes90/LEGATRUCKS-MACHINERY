
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Truck } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [{
    name: "Home",
    path: "/"
  }, {
    name: "Heavy Duty",
    path: "/trucks/heavy-duty"
  }, {
    name: "Medium Duty",
    path: "/trucks/medium-duty"
  }, {
    name: "Light Duty",
    path: "/trucks/light-duty"
  }, {
    name: "About",
    path: "/about"
  }, {
    name: "Contact",
    path: "/contact"
  }];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-orange-500 shadow-lg border-b border-orange-600' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center py-4 mx-0">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className={`p-2 rounded-lg transition-colors ${
              isScrolled 
                ? 'bg-white group-hover:bg-gray-100' 
                : 'bg-blue-600 group-hover:bg-blue-700'
            }`}>
              <Truck className={`h-6 w-6 ${
                isScrolled ? 'text-orange-500' : 'text-white'
              }`} />
            </div>
            <span className={`text-2xl font-bold transition-colors ${
              isScrolled ? 'text-white' : 'text-white'
            }`}>TruckHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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
          </div>

          {/* Admin Button & Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            <Link to="/admin" className="hidden md:block">
              <Button 
                variant="outline" 
                className={`transition-all duration-200 ${
                  isScrolled
                    ? "border-white text-white hover:bg-white hover:text-orange-500"
                    : "border-white text-white hover:bg-white hover:text-blue-600"
                }`}
              >
                Admin
              </Button>
            </Link>
            
            {/* Mobile menu button */}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isScrolled 
                  ? 'hover:bg-orange-600 text-white' 
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className={`lg:hidden py-4 border-t transition-colors ${
            isScrolled ? 'border-orange-600' : 'border-white/20'
          }`}>
            <div className="flex flex-col space-y-2">
              {navItems.map(item => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={() => setIsOpen(false)} 
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
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
              <Link 
                to="/admin" 
                onClick={() => setIsOpen(false)} 
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isScrolled
                    ? "text-white hover:bg-orange-600 hover:text-white"
                    : "text-white hover:bg-white/10 hover:text-white"
                }`}
              >
                Admin
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
