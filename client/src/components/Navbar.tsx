import { Link, useNavigate } from "react-router-dom";
import { useTrade } from "../context/context";
import { IoWalletSharp } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import axios from "axios";
import { searchStockData } from "../services/stockService";
import { toast } from "sonner";

interface SearchResult {
  [key: string]: string;
}

const searchBarAnimation = `
  @keyframes searchBarLoading {
    0% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult>({});
  const [showResults, setShowResults] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const isLogin = localStorage.getItem("token") ? true : false;

  console.log(isLogin);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Refs to handle clicks outside
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("userData");
    toast.error("Logged out successfully!");
    navigate("/login");
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  // Handle clicks outside the profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle click outside search results
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

  // Debounced search function
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const response = await searchStockData(searchQuery);
          setSearchResults(response.data);
          setShowResults(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults({});
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setShowResults(false);
  };

  const navigate = useNavigate();

  return (
    <nav className="bg-[#131722] p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-white text-2xl font-bold tracking-wider">
            <span className="font-ananda-namaste text-4xl">Trade-Shala</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden lg:flex space-x-8">
          <Link
            to="/"
            className="text-gray-300 hover:text-white transition-colors duration-300"
          >
            Home
          </Link>
          <Link
            to="/marketplace"
            className="text-gray-300 hover:text-white transition-colors duration-300"
          >
            Marketplace
          </Link>
          <Link
            to="/news"
            className="text-gray-300 hover:text-white transition-colors duration-300"
          >
            News
          </Link>
          <Link
            to="/contact"
            className="text-gray-300 hover:text-white transition-colors duration-300"
          >
            Contact Us
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative" ref={searchRef}>
          {/* Mobile Search Icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <Search size={20} />
          </button>

          {/* Search Input - Desktop & Mobile Overlay */}
          <div
            className={`${
              isSearchOpen
                ? "fixed inset-0 bg-black/50 lg:relative lg:bg-transparent"
                : "hidden lg:block"
            }`}
          >
            <div
              className={`${
                isSearchOpen
                  ? "absolute top-0 left-0 right-0 p-4 bg-[#131722] lg:relative lg:p-0"
                  : "relative"
              }`}
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stocks..."
                  className={`w-full lg:w-96 bg-[#1E222D] text-gray-300 px-4 py-2 pl-10 pr-10 rounded-lg border focus:outline-none transition-all duration-200 ${
                    isSearching
                      ? "border-blue-500/50 bg-gradient-to-r from-[#1E222D] via-[#262932] to-[#1E222D] bg-[length:200%_100%]"
                      : "border-gray-700 focus:border-blue-500"
                  }`}
                  style={
                    isSearching
                      ? {
                          animation:
                            "searchBarLoading 1.5s ease-in-out infinite",
                        }
                      : {}
                  }
                />
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    isSearching ? "text-blue-500" : "text-gray-400"
                  }`}
                  size={18}
                />
                {isSearchOpen && (
                  <button
                    onClick={handleSearchClose}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white lg:hidden"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && Object.keys(searchResults).length > 0 && (
                <div
                  className={`absolute w-full mt-2 bg-[#1E222D] border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto transition-all duration-200 ${
                    isSearching
                      ? "opacity-60 translate-y-1"
                      : "opacity-100 translate-y-0"
                  }`}
                >
                  {Object.entries(searchResults).map(([symbol, name]) => (
                    <div
                      key={symbol}
                      onClick={() => {
                        navigate(`/stock/${symbol}`);
                        setSearchQuery("");
                        setShowResults(false);
                        setIsSearchOpen(false);
                      }}
                      className="px-4 py-3 hover:bg-[#262932] cursor-pointer border-b border-gray-700 last:border-0"
                    >
                      <div className="text-white font-medium">{symbol}</div>
                      <div className="text-gray-400 text-sm">{name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Navigation */}
        <div className="flex items-center space-x-4 relative">
          {/* Profile Dropdown */}
          {isLogin ? (
            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={toggleProfileMenu}
                className="text-gray-300 hover:text-white flex items-center transition-colors duration-300"
              >
                <img
                  src="https://www.w3schools.com/howto/img_avatar.png"
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
              </button>
              {isProfileMenuOpen && (
                <div
                  ref={profileMenuRef}
                  className="absolute right-0 mt-2 bg-[#1e222d] text-gray-300 rounded-lg shadow-lg w-36 z-10"
                >
                  <ul className="space-y-2 p-2">
                    <li>
                      <Link
                        to="/wallet"
                        className="w-full flex items-center space-x-2 text-left py-2 px-4 hover:bg-[#2a2d39] transition-colors duration-200 rounded-md"
                      >
                        <IoWalletSharp className="text-sm" />
                        <span className="text-sm font-medium">Wallet</span>
                      </Link>
                    </li>
                    <li>
                      <button className="w-full flex items-center space-x-2 text-left py-2 px-4 hover:bg-[#2a2d39] transition-colors duration-200 rounded-md">
                        <CgProfile className="text-sm" />
                        <Link to="/profile" className="text-sm font-medium">
                          Profile
                        </Link>
                      </button>
                    </li>
                    <li>
                      <button className="w-full flex items-center space-x-2 text-left py-2 px-4 hover:bg-[#2a2d39] transition-colors duration-200 rounded-md">
                        <IoWalletSharp className="text-sm" />
                        <Link to="/wallet" className="text-sm font-medium">
                          Transactions
                        </Link>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <h1></h1>
          )}

          {/* Get Started Button */}
          {isLogin ? (
            <Link
              className={`p-2 rounded-md text-sm font-semibold shadow-md transition duration-300 transform hover:scale-105 ${
                isLogin
                  ? "bg-[#d32f2f] text-white hover:bg-[#c62828]" // Logout button style (red)
                  : "bg-[#2962ff] text-white hover:bg-[#1c54d4]" // Login button style (blue)
              }`}
              to="/"
              onClick={handleLogout}
            >
              Logout
            </Link>
          ) : (
            <Link
              className={`p-2 rounded-md text-sm font-semibold shadow-md transition duration-300 transform hover:scale-105 ${
                isLogin
                  ? "bg-[#d32f2f] text-white hover:bg-[#c62828]" // Logout button style (red)
                  : "bg-[#2962ff] text-white hover:bg-[#1c54d4]" // Login button style (blue)
              }`}
              onClick={isLogin ? handleLogout : undefined}
              to="/login/phone"
            >
              Login
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-white" onClick={toggleMenu}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#1e222d] mt-4 p-4 rounded-lg">
          <div className="space-y-4">
            <Link
              to="/"
              className="block text-gray-300 hover:text-white transition-colors duration-300"
            >
              Home
            </Link>

            <Link
              to="/news"
              className="block text-gray-300 hover:text-white transition-colors duration-300"
            >
              News
            </Link>
            <Link
              to="/contact"
              className="block text-gray-300 hover:text-white transition-colors duration-300"
            >
              ContactUs
            </Link>
          </div>
        </div>
      )}

      <style>{searchBarAnimation}</style>
    </nav>
  );
};

export default Navbar;
