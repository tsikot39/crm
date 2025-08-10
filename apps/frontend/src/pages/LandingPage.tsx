import React from "react";
import { Navbar } from "../components/landing/Navbar";
import { HeroSection } from "../components/landing/HeroSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { AboutSection } from "../components/landing/AboutSection";
import { PricingSection } from "../components/landing/PricingSection";
import { Footer } from "../components/landing/Footer";
import { ScrollToTopButton } from "../components/ui/ScrollToTopButton";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <PricingSection />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};
