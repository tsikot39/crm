import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  PieChart,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  DollarSign,
  Search,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SearchResult {
  id: string;
  type: "contact" | "company" | "deal";
  title: string;
  subtitle: string;
  url: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Deals", href: "/deals", icon: DollarSign },
  { name: "Analytics", href: "/analytics", icon: PieChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      if (!token) return;

      const results: SearchResult[] = [];

      // Search contacts and companies in parallel
      const [contactsRes, companiesRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/contacts?search=${encodeURIComponent(
            query
          )}&limit=4`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(() => ({ ok: false })),
        fetch(
          `${API_BASE_URL}/api/companies?search=${encodeURIComponent(
            query
          )}&limit=4`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(() => ({ ok: false })),
      ]);

      // Process contacts
      if (contactsRes.ok && "json" in contactsRes) {
        try {
          const contactsData = await contactsRes.json();
          const contacts = contactsData.data?.contacts || [];
          contacts.forEach((contact: any) => {
            const displayName =
              contact.firstName && contact.lastName
                ? `${contact.firstName} ${contact.lastName}`
                : contact.name || "Unknown Contact";

            const subtitle =
              contact.email ||
              contact.company ||
              contact.jobTitle ||
              "No details";

            results.push({
              id: contact._id,
              type: "contact",
              title: displayName,
              subtitle: subtitle,
              url: `/contacts?highlight=${contact._id}`,
            });
          });
        } catch (error) {
          console.error("Error processing contacts:", error);
        }
      }

      // Process companies
      if (companiesRes.ok && "json" in companiesRes) {
        try {
          const companiesData = await companiesRes.json();
          const companies = companiesData.data?.companies || [];
          companies.forEach((company: any) => {
            results.push({
              id: company.id || company._id,
              type: "company",
              title: company.name,
              subtitle:
                company.industry ||
                company.description ||
                company.website ||
                "No details",
              url: `/companies?highlight=${company.id || company._id}`,
            });
          });
        } catch (error) {
          console.error("Error processing companies:", error);
        }
      }

      // Add deals placeholder if we have space
      if (results.length < 8) {
        results.push({
          id: "deals-coming-soon",
          type: "deal",
          title: "Deals search coming soon",
          subtitle: "This feature will be available soon",
          url: "/deals",
        });
      }

      setSearchResults(results.slice(0, 8)); // Limit to 8 results total
      setShowResults(true);
      setSelectedResultIndex(-1); // Reset selection when results change
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    // Don't navigate for "coming soon" items
    if (result.id.includes("coming-soon")) {
      return;
    }

    navigate(result.url);
    setShowResults(false);
    setSearchTerm("");
    setSelectedResultIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedResultIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedResultIndex((prev) =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedResultIndex >= 0) {
          const selectedResult = searchResults[selectedResultIndex];
          if (!selectedResult.id.includes("coming-soon")) {
            handleResultClick(selectedResult);
          }
        }
        break;
      case "Escape":
        setShowResults(false);
        setSelectedResultIndex(-1);
        break;
    }
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "contact":
        return <Users className="h-4 w-4" />;
      case "company":
        return <Building2 className="h-4 w-4" />;
      case "deal":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="h-screen flex bg-neutral-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden ${
          sidebarOpen ? "" : "hidden"
        }`}
      >
        <button
          className="fixed inset-0 bg-neutral-600 bg-opacity-75 border-0 p-0 m-0"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navbar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-neutral-200">
          <button
            type="button"
            className="px-4 border-r border-neutral-200 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0 relative" ref={searchRef}>
                <div className="relative w-full text-neutral-400 focus-within:text-neutral-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    {isSearching ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                  </div>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm && setShowResults(true)}
                    onKeyDown={handleKeyDown}
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-neutral-900 placeholder-neutral-500 focus:outline-none focus:placeholder-neutral-400 focus:ring-0 focus:border-transparent sm:text-sm bg-transparent"
                    placeholder="Search contacts, companies, deals..."
                    type="search"
                  />
                </div>

                {/* Search Results Dropdown */}
                {showResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    {searchResults.length > 0 && (
                      <>
                        {searchResults.map((result, index) => {
                          const isComingSoon =
                            result.id.includes("coming-soon");
                          const isSelected = index === selectedResultIndex;

                          // Determine CSS classes
                          let buttonClass =
                            "w-full px-4 py-3 text-left flex items-center space-x-3 border-b border-gray-100 last:border-b-0 ";
                          if (isSelected) {
                            buttonClass += "bg-primary-50 text-primary-900";
                          } else if (isComingSoon) {
                            buttonClass += "opacity-60 cursor-not-allowed";
                          } else {
                            buttonClass += "hover:bg-gray-50";
                          }

                          let iconClass = "flex-shrink-0 ";
                          if (isSelected) {
                            iconClass += "text-primary-600";
                          } else if (isComingSoon) {
                            iconClass += "text-gray-300";
                          } else {
                            iconClass += "text-gray-400";
                          }

                          let titleClass = "text-sm font-medium truncate ";
                          if (isSelected) {
                            titleClass += "text-primary-900";
                          } else if (isComingSoon) {
                            titleClass += "text-gray-400";
                          } else {
                            titleClass += "text-gray-900";
                          }

                          let subtitleClass = "text-xs truncate ";
                          if (isSelected) {
                            subtitleClass += "text-primary-700";
                          } else if (isComingSoon) {
                            subtitleClass += "text-gray-300";
                          } else {
                            subtitleClass += "text-gray-500";
                          }

                          let badgeClass =
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ";
                          if (isSelected) {
                            badgeClass += "bg-primary-100 text-primary-800";
                          } else if (isComingSoon) {
                            badgeClass += "bg-gray-50 text-gray-400";
                          } else {
                            badgeClass += "bg-gray-100 text-gray-800";
                          }

                          return (
                            <button
                              key={`${result.type}-${result.id}`}
                              onClick={() => handleResultClick(result)}
                              disabled={isComingSoon}
                              className={buttonClass}
                            >
                              <div className={iconClass}>
                                {getResultIcon(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={titleClass}>{result.title}</div>
                                <div className={subtitleClass}>
                                  {result.subtitle}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <span className={badgeClass}>
                                  {result.type}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}

                    {searchResults.length === 0 &&
                      searchTerm &&
                      !isSearching && (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          No results found for "{searchTerm}"
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative ml-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-neutral-700">
                    {user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-white p-1 rounded-full text-neutral-400 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent: React.FC = () => {
  const location = window.location;
  const currentPath = location.pathname;

  return (
    <div className="flex flex-col h-0 flex-1 border-r border-neutral-200 bg-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="ml-2 text-xl font-semibold text-neutral-900">
            CRM SaaS
          </span>
        </div>

        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentPath === item.href;

            return (
              <a
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200`}
              >
                <IconComponent
                  className={`${
                    isActive
                      ? "text-primary-600"
                      : "text-neutral-400 group-hover:text-neutral-500"
                  } mr-3 flex-shrink-0 h-5 w-5`}
                />
                {item.name}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
