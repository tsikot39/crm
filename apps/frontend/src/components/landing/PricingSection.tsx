import React from "react";
import { Check, Star, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 29,
    description: "Perfect for small teams and startups",
    features: [
      "Up to 1,000 contacts",
      "Basic deal pipeline",
      "Email integration",
      "Mobile app access",
      "Standard support",
      "5 team members",
    ],
    popular: false,
    cta: "Start Free Trial",
  },
  {
    name: "Professional",
    price: 79,
    description: "Ideal for growing businesses",
    features: [
      "Up to 10,000 contacts",
      "Advanced pipeline management",
      "Email & calendar sync",
      "Advanced reporting",
      "Priority support",
      "25 team members",
      "Custom fields",
      "API access",
    ],
    popular: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: 149,
    description: "For large teams and complex needs",
    features: [
      "Unlimited contacts",
      "Custom pipeline stages",
      "Advanced automation",
      "White-label options",
      "Dedicated support",
      "Unlimited team members",
      "Advanced integrations",
      "Custom reporting",
      "SSO & advanced security",
    ],
    popular: false,
    cta: "Contact Sales",
  },
];

export const PricingSection: React.FC = () => {
  return (
    <section
      id="pricing"
      className="py-24 bg-gradient-to-br from-neutral-50 to-primary-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
            Simple,{" "}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Choose the perfect plan for your business. All plans include a
            14-day free trial with no credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-4 mt-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.popular
                  ? "border-2 border-primary-500 transform lg:scale-105"
                  : "border border-neutral-200 hover:border-primary-300"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-1 shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-neutral-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-neutral-900">
                      ${plan.price}
                    </span>
                    <span className="text-neutral-600 ml-2">/month</span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">
                    per user, billed monthly
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          plan.popular
                            ? "bg-gradient-to-r from-primary-500 to-accent-500"
                            : "bg-green-500"
                        }`}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-neutral-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    plan.popular
                      ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl"
                      : "border-2 border-primary-500 text-primary-600 hover:bg-primary-50"
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-neutral-600 mb-6">
            Need a custom solution? We have enterprise packages for teams of
            100+
          </p>
          <button className="text-primary-600 hover:text-primary-700 font-semibold text-lg border-b-2 border-primary-600 hover:border-primary-700 transition-colors">
            Contact our sales team
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-16 border-t border-neutral-200">
          <div className="text-center">
            <p className="text-neutral-500 mb-8">
              Trusted by over 10,000 businesses worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="w-24 h-8 bg-gradient-to-r from-neutral-100 to-neutral-200 rounded flex items-center justify-center">
                <span className="text-neutral-600 font-semibold text-sm">
                  TechCorp
                </span>
              </div>
              <div className="w-24 h-8 bg-gradient-to-r from-neutral-100 to-neutral-200 rounded flex items-center justify-center">
                <span className="text-neutral-600 font-semibold text-sm">
                  StartupX
                </span>
              </div>
              <div className="w-24 h-8 bg-gradient-to-r from-neutral-100 to-neutral-200 rounded flex items-center justify-center">
                <span className="text-neutral-600 font-semibold text-sm">
                  GrowthCo
                </span>
              </div>
              <div className="w-24 h-8 bg-gradient-to-r from-neutral-100 to-neutral-200 rounded flex items-center justify-center">
                <span className="text-neutral-600 font-semibold text-sm">
                  ScalePro
                </span>
              </div>
              <div className="w-24 h-8 bg-gradient-to-r from-neutral-100 to-neutral-200 rounded flex items-center justify-center">
                <span className="text-neutral-600 font-semibold text-sm">
                  BuildLab
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
