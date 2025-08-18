import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 pt-20 pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-200/30 to-primary-300/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-accent-200/30 to-accent-300/30 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-current" />
              <span>#1 CRM Solution for Growing Teams</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6">
              Grow Your Business with{" "}
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Smart CRM
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Streamline your sales process, manage customer relationships, and
              close more deals with our intelligent CRM platform trusted by
              thousands of businesses worldwide.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                to="/signup"
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>Start Your Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center space-x-6 text-sm text-neutral-500">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-accent-400 to-accent-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-neutral-400 to-neutral-500 rounded-full border-2 border-white"></div>
                </div>
                <span>10,000+ happy customers</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <span>4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image/Dashboard Preview */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-300">
              {/* Mock Dashboard Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="flex-1 bg-primary-400/50 rounded px-3 py-1 text-primary-100 text-sm">
                    crm-pro.com/dashboard
                  </div>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">
                      $124K
                    </div>
                    <div className="text-sm text-primary-500">Revenue</div>
                  </div>
                  <div className="bg-gradient-to-br from-accent-50 to-accent-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-accent-600">
                      1,250
                    </div>
                    <div className="text-sm text-accent-500">Contacts</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-green-500">Close Rate</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1 text-sm text-neutral-600">
                      New lead from website
                    </div>
                    <div className="text-xs text-neutral-400">2 min ago</div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1 text-sm text-neutral-600">
                      Meeting scheduled with client
                    </div>
                    <div className="text-xs text-neutral-400">5 min ago</div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1 text-sm text-neutral-600">
                      Deal moved to negotiation
                    </div>
                    <div className="text-xs text-neutral-400">10 min ago</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-accent-400 to-accent-500 text-white p-3 rounded-xl shadow-lg">
              <div className="text-lg font-bold">+$50K</div>
              <div className="text-xs opacity-90">This Month</div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-400 to-green-500 text-white p-3 rounded-xl shadow-lg">
              <div className="text-lg font-bold">95%</div>
              <div className="text-xs opacity-90">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
