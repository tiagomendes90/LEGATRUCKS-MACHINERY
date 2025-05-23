import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Truck } from "lucide-react";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
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
  return <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center py-4 mx-0">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">TruckHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map(item => <Link key={item.path} to={item.path} className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive(item.path) ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"}`}>
                {item.name}
              </Link>)}
          </div>

          {/* Admin Button & Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            <Link to="/admin" className="hidden md:block">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                Admin
              </Button>
            </Link>
            
            {/* Mobile menu button */}
            <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && <div className="lg:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {navItems.map(item => <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive(item.path) ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"}`}>
                  {item.name}
                </Link>)}
              <Link to="/admin" onClick={() => setIsOpen(false)} className="px-4 py-3 rounded-lg font-medium text-blue-600 hover:bg-blue-100 transition-all duration-200">
                Admin
              </Link>
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navbar;