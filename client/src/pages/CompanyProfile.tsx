import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Calendar,
  Globe,
  DollarSign,
  BarChart3,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";

interface CompanyProfile {
  address: string;
  city: string;
  country: string;
  currency: string;
  description: string;
  employeeTotal: string;
  exchange: string;
  gsector: string;
  gind: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  state: string;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

interface CompanyProfilePageProps {
  symbol?: string;
  apiKey?: string;
}

const CompanyProfilePage: React.FC<CompanyProfilePageProps> = ({
  symbol = "IRFC",
  apiKey = "cufk499r01qno7m5ve60cufk499r01qno7m5ve6g",
}) => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch company profile: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!data || Object.keys(data).length === 0) {
          throw new Error("No data available for this symbol");
        }

        setProfile(data as CompanyProfile);
      } catch (err) {
        console.error("Error fetching company profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch company profile"
        );
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchCompanyProfile();
    }
  }, [symbol, apiKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-500 text-xl animate-pulse">
          Loading {symbol} profile...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl text-center max-w-md px-4">
          <p className="mb-4">❌ {error || "Failed to load company profile"}</p>
          <p className="text-sm text-gray-400">
            Please check if the symbol "{symbol}" is correct and try again
          </p>
        </div>
      </div>
    );
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}B`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}M`;
    return `$${value.toFixed(2)}K`;
  };

  const formatPhoneNumber = (phoneStr: string) => {
    if (!phoneStr) return "N/A";
    const cleaned = phoneStr.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
    }
    return phoneStr;
  };

  const renderValue = (value: string | number | undefined) => {
    if (value === undefined || value === null || value === "") {
      return "N/A";
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center gap-6 mb-8">
            {profile.logo ? (
              <img
                src={profile.logo}
                alt={`${profile.name} logo`}
                className="w-16 h-16 rounded-lg bg-white p-1"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/api/placeholder/64/64";
                  target.alt = "Company logo not available";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-green-500" />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold text-white">{profile.name}</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-green-500">{profile.ticker}</span>
                <span>•</span>
                <span>{renderValue(profile.exchange)}</span>
              </div>
            </div>
          </div>

          {/* Company Description */}
          <div className="bg-gray-800 border-2 border-green-700 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-green-400 mb-4">
              About
            </h2>
            <p className="text-gray-300">{renderValue(profile.description)}</p>
          </div>

          {/* Key Information Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Company Details */}
            <div className="bg-gray-800 border-2 border-green-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-6">
                Company Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Building2 className="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                    <h3 className="font-semibold">Headquarters</h3>
                    <p className="text-gray-400">
                      {profile.address
                        ? `${profile.address}, ${profile.city}, ${profile.state}, ${profile.country}`
                        : "Address not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Users className="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                    <h3 className="font-semibold">Employees</h3>
                    <p className="text-gray-400">
                      {profile.employeeTotal
                        ? Number(profile.employeeTotal).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Calendar className="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                    <h3 className="font-semibold">IPO Date</h3>
                    <p className="text-gray-400">
                      {profile.ipo
                        ? new Date(profile.ipo).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                    <h3 className="font-semibold">Website</h3>
                    {profile.weburl ? (
                      <a
                        href={profile.weburl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:underline flex items-center gap-1"
                      >
                        {profile.weburl} <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <p className="text-gray-400">N/A</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial & Industry Info */}
            <div className="bg-gray-800 border-2 border-green-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-6">
                Market Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <DollarSign className="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                    <h3 className="font-semibold">Market Cap</h3>
                    <p className="text-gray-400">
                      {profile.marketCapitalization
                        ? formatMarketCap(profile.marketCapitalization)
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <BarChart3 className="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                    <h3 className="font-semibold">Industry</h3>
                    <p className="text-gray-400">{renderValue(profile.gind)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Phone className="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <p className="text-gray-400">
                      {formatPhoneNumber(profile.phone)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Mail className="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                    <h3 className="font-semibold">Sector</h3>
                    <p className="text-gray-400">
                      {renderValue(profile.gsector)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
