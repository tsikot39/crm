import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for sticky navbar height
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
    setIsMenuOpen(false); // Close mobile menu after clicking
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    setIsMenuOpen(false); // Close mobile menu if open
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={scrollToTop}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">
                CRM Pro
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => scrollToSection("features")}
                className="text-neutral-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-neutral-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-neutral-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-neutral-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Contact
              </button>
            </div>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-neutral-600 hover:text-primary-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-200 flex items-center space-x-1"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-neutral-200">
            <button
              onClick={() => scrollToSection("features")}
              className="text-neutral-600 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-neutral-600 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-neutral-600 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-neutral-600 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Contact
            </button>
            <div className="border-t border-neutral-200 pt-4 pb-3">
              <div className="flex flex-col space-y-3 px-3">
                <Link
                  to="/login"
                  className="text-neutral-600 hover:text-primary-600 px-4 py-2 rounded-lg text-base font-medium transition-colors text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-200 flex items-center justify-center space-x-1"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
