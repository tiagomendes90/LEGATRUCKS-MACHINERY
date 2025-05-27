import { Link } from "react-router-dom";
import { Truck, Phone, Mail, MapPin } from "lucide-react";
const Footer = () => {
  return <footer className="text-white bg-orange-500 my-0 py-[60px]">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">LEGA</span>
            </div>
            
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/trucks/heavy-duty" className="text-white hover:text-gray-200 transition-colors">Heavy Duty Trucks</Link></li>
              <li><Link to="/trucks/medium-duty" className="text-white hover:text-gray-200 transition-colors">Medium Duty Trucks</Link></li>
              <li><Link to="/trucks/light-duty" className="text-white hover:text-gray-200 transition-colors">Light Duty Trucks</Link></li>
              <li><Link to="/about" className="text-white hover:text-gray-200 transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Contact Info - moved from 4th column to 3rd */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-white">
                <Phone className="h-4 w-4" />
                <span className="font-normal text-white">(351) 123 456 789</span>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <Mail className="h-4 w-4" />
                <span className="text-white">info@lega.pt</span>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <MapPin className="h-4 w-4" />
                <span className="text-white">123 Joane, Braga,  
Portugal</span>
              </div>
            </div>
          </div>

          {/* Google Maps - replacing the contact column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Location</h3>
            <div className="w-full h-32 rounded-lg overflow-hidden">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.7637956098767!2d-8.426515284616394!3d40.21101797938528!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd22f8f6b2f5f5b7%3A0x1234567890abcdef!2sCoimbra%2C%20Portugal!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus" width="100%" height="100%" style={{
              border: 0
            }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-lg"></iframe>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-1 text-center">
          <p className="text-white font-thin">© 2025 Lega. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;