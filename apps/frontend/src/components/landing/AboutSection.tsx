import React from "react";
import { Users, Award, Globe, Zap } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Happy Customers",
    description: "Businesses worldwide trust our platform",
  },
  {
    icon: Award,
    value: "99.9%",
    label: "Uptime",
    description: "Reliable service you can count on",
  },
  {
    icon: Globe,
    value: "50+",
    label: "Countries",
    description: "Global reach with local support",
  },
  {
    icon: Zap,
    value: "24/7",
    label: "Support",
    description: "Always here when you need us",
  },
];

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              CRM Pro?
            </span>
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            We're not just another CRM platform. We're your partner in building
            lasting customer relationships and driving sustainable business
            growth.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="text-center p-6 bg-gradient-to-br from-neutral-50 to-primary-50 rounded-2xl hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-neutral-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-neutral-700 mb-2">
                  {stat.label}
                </div>
                <div className="text-sm text-neutral-600">
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl p-8 lg:p-12 text-white text-center">
          <h3 className="text-2xl lg:text-3xl font-bold mb-6">Our Mission</h3>
          <p className="text-lg lg:text-xl opacity-90 max-w-4xl mx-auto leading-relaxed">
            To empower businesses of all sizes with intelligent CRM solutions
            that transform how they connect with customers, streamline
            operations, and accelerate growth. We believe that every business
            deserves access to enterprise-grade tools that are both powerful and
            easy to use.
          </p>
        </div>
      </div>
    </section>
  );
};
