import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  DollarSign,
  BarChart3,
  Calendar,
  MessageSquare,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Organize and track all your customer interactions in one centralized platform with advanced filtering and search capabilities.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Building2,
    title: "Company Insights",
    description:
      "Get detailed company profiles, track business relationships, and understand organizational structures.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: DollarSign,
    title: "Deal Pipeline",
    description:
      "Visualize your sales pipeline, track deal progress, and optimize your sales process for maximum revenue.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Make data-driven decisions with comprehensive reports, forecasting, and performance analytics.",
    color: "from-primary-500 to-primary-600",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Automate appointment booking, set follow-up reminders, and never miss an important meeting.",
    color: "from-accent-500 to-accent-600",
  },
  {
    icon: MessageSquare,
    title: "Communication Hub",
    description:
      "Centralize all customer communications including emails, calls, and messages in one place.",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Bank-level security with encryption, role-based access, and compliance with industry standards.",
    color: "from-red-500 to-red-600",
  },
  {
    icon: Zap,
    title: "Automation Tools",
    description:
      "Streamline repetitive tasks with intelligent automation, workflows, and custom triggers.",
    color: "from-yellow-500 to-yellow-600",
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Scale Your Business
            </span>
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Our comprehensive CRM platform provides all the tools you need to
            manage customer relationships, close more deals, and grow your
            revenue.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-6 bg-white rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-3xl p-8 lg:p-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
              Ready to Transform Your Sales Process?
            </h3>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses that have already boosted their
              revenue with our CRM platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/signup"
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
