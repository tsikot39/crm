import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Linkedin,
  Code,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold text-white">CRM Pro</span>
              </Link>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                Empowering businesses worldwide with intelligent CRM solutions
                that drive growth, improve customer relationships, and boost
                revenue.
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors group">
                  <MessageCircle className="w-5 h-5 group-hover:text-white" />
                </button>
                <button className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors group">
                  <Linkedin className="w-5 h-5 group-hover:text-white" />
                </button>
                <button className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors group">
                  <Code className="w-5 h-5 group-hover:text-white" />
                </button>
                <button className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors group">
                  <Mail className="w-5 h-5 group-hover:text-white" />
                </button>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-6">Product</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#features"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <button className="hover:text-primary-400 transition-colors text-left">
                    Integrations
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary-400 transition-colors text-left">
                    API
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary-400 transition-colors text-left">
                    Mobile App
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary-400 transition-colors text-left">
                    Security
                  </button>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-white font-semibold mb-6">Company</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#about"
                    className="hover:text-primary-400 transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Press
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Partners
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Investors
                  </a>
                </li>
              </ul>
            </div>

            {/* Support & Contact */}
            <div>
              <h3 className="text-white font-semibold mb-6">Support</h3>
              <ul className="space-y-4 mb-8">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Status
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-primary-400 transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary-400" />
                  <span className="text-sm">support@crmpro.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary-400" />
                  <span className="text-sm">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-primary-400" />
                  <span className="text-sm">San Francisco, CA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap items-center space-x-6 text-sm">
              <span>&copy; 2025 CRM Pro. All rights reserved.</span>
              <a href="#" className="hover:text-primary-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                Cookie Policy
              </a>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <span>Made with ❤️ for growing businesses</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
