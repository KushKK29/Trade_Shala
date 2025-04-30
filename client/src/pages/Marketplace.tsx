import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  createStrategy,
  deleteStrategy,
  fetchStrategy,
  searchStockData,
} from "@/services/stockService";
import { toast } from "sonner";
import { FiSearch, FiLoader, FiTrash } from "react-icons/fi";

interface Strategy {
  _id: string;
  title: string;
  description: string;
  author: {
    name: string;
    _id: string;
  };
  stock_symbol: string;
  trade_type: string;
  strategy_date: string;
  target: string;
  sl: number;
  price: number;
  createdAt: string;
  strategy_id: string;
}

interface SearchResult {
  [key: string]: string;
}

const Marketplace: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [showMyStrategies, setShowMyStrategies] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    title: "",
    author: localStorage.getItem("user_id") || "",
    description: "",
    stock_symbol: "",
    trade_type: "",
    strategy_date: "",
    target: "",
    sl: 0,
    price: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult>({});
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [showTesterModal, setShowTesterModal] = useState(false);
  const [testerFormData, setTesterFormData] = useState({
    strategy: "",
    numberOfTrades: "",
  });
  const [isTesting, setIsTesting] = useState(false);

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const response = await fetchStrategy();
      setStrategies(response.data);
    } catch (err) {
      setError("Failed to fetch strategies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const handleAddStrategy = async () => {
    try {
      const response = await createStrategy(formData);
      if (response.status === 201) {
        toast.success("Strategy added successfully.");
        setShowModal(false);
        setFormData({
          title: "",
          description: "",
          author: localStorage.getItem("user_id") || "",
          strategy_date: "",
          stock_symbol: "",
          trade_type: "",
          target: "",
          sl: 0,
          price: 0,
        });
        fetchStrategies();
      }
    } catch (err) {
      setError("Failed to add strategy.");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this strategy?"
    );
    if (!confirmDelete) return;

    try {
      await deleteStrategy(id);
      fetchStrategies();
      toast.success("Strategy deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete the strategy.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStockSymbolSearch = async (query: string) => {
    if (query.length >= 2) {
      setIsSearching(true);
      try {
        const response = await searchStockData(query);
        setSearchResults(response.data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults({});
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStrategyTest = async () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setShowTesterModal(false);
      toast.error("Market is currently off");
    }, 2000);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error) return <div className="text-red-500 p-6">{error}</div>;

  return (
    <div className="p-3 sm:p-6 relative bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 p-3 sm:p-4 rounded-lg shadow-lg w-full sm:w-auto">
          Trading Strategies Marketplace
        </h1>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowMyStrategies((prev) => !prev)}
            className="bg-gradient-to-r from-green-600 to-green-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
          >
            {showMyStrategies ? "Show All Strategies" : "My Strategies"}
          </button>
          <button
            onClick={() => setShowTesterModal(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
          >
            Strategy Tester
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <span className="text-xl">+</span> Add Strategy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {strategies?.map((strategy, index) => (
          <div
            key={strategy._id}
            className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="mb-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/20">
                S{(index + 1).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:items-center mb-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {strategy.title}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  strategy.trade_type === "CE"
                    ? "bg-green-900/50 text-green-400 border border-green-500"
                    : "bg-red-900/50 text-red-400 border border-red-500"
                }`}
              >
                {strategy.trade_type}
              </span>
            </div>

            <p className="text-gray-300 mb-4 text-sm line-clamp-2 sm:line-clamp-none">
              {strategy.description}
            </p>

            <div className="space-y-3 bg-gray-900/50 p-3 sm:p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center text-gray-400 flex-wrap">
                <span className="text-sm">Stock Symbol</span>
                <span className="text-blue-400 font-semibold">
                  {strategy.stock_symbol}
                </span>
              </div>

              <div className="bg-gray-800/50 p-2 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Strategy Date</div>
                <div className="text-blue-400 font-medium text-sm">
                  {format(new Date(strategy.strategy_date), "dd MMM yyyy")}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-gray-800/50 p-2 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Target Price</div>
                  <div className="text-[rgb(77,240,77)] font-medium text-sm">
                    ₹{strategy.target}
                  </div>
                </div>

                <div className="bg-gray-800/50 p-2 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Stop Loss</div>
                  <div className="text-[rgb(230,78,78)] font-medium text-sm">
                    ₹{strategy.sl}
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 p-2 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Strategy Price</div>
                <div className="text-yellow-400 font-medium text-sm">
                  ₹{strategy.price}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {strategy.author.name.charAt(0)}
                  </div>
                  <span className="text-gray-400 text-sm">
                    {strategy.author.name}
                  </span>
                </div>
                <span className="text-gray-500 text-xs">
                  {format(new Date(strategy.createdAt), "dd MMM yyyy")}
                </span>
                {strategy.author._id === localStorage.getItem("user_id") && (
                  <button
                    onClick={() => handleDelete(strategy._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition"
                  >
                    <FiTrash size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-gray-800/95 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700 transform transition-all my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Add New Strategy
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 text-xs mb-1">
                  Strategy Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter strategy title"
                  className="w-full p-2 bg-gray-700/50 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border-none text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-xs mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your trading strategy"
                  className="w-full p-2 bg-gray-700/50 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border-none text-sm h-20"
                />
              </div>

              <div className="relative stock-symbol-search">
                <label className="block text-gray-300 text-xs mb-1">
                  Stock Symbol *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="stock_symbol"
                    value={formData.stock_symbol}
                    onChange={(e) => {
                      handleChange(e);
                      handleStockSymbolSearch(e.target.value);
                    }}
                    placeholder="Search stock symbol..."
                    className="w-full p-2 pr-8 bg-gray-700/50 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border-none text-sm"
                    autoComplete="off"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {isSearching ? (
                      <FiLoader className="animate-spin text-gray-400" />
                    ) : (
                      <FiSearch className="text-gray-400" />
                    )}
                  </div>
                </div>

                {showDropdown && Object.keys(searchResults).length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-gray-800/95 rounded-lg border border-gray-700 shadow-xl backdrop-blur-sm">
                    {Object.entries(searchResults).map(([symbol, name]) => (
                      <button
                        key={symbol}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            stock_symbol: symbol,
                          }));
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700/70 text-sm text-white flex flex-col gap-1 transition-colors"
                      >
                        <span className="font-medium">{symbol}</span>
                        <span className="text-gray-400 text-xs">{name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 text-xs mb-1">
                    Trade Type *
                  </label>
                  <select
                    name="trade_type"
                    value={formData.trade_type}
                    onChange={handleChange}
                    className="w-full p-2 bg-gray-700/50 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border-none text-sm"
                  >
                    <option value="">Select Type</option>
                    <option value="CE">Call Option (CE)</option>
                    <option value="PE">Put Option (PE)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 text-xs mb-1">
                    Strategy Date *
                  </label>
                  <input
                    type="date"
                    name="strategy_date"
                    value={formData.strategy_date}
                    onChange={handleChange}
                    className="w-full p-2 bg-gray-700/50 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-xs mb-1">
                    Target Price *
                  </label>
                  <input
                    type="text"
                    name="target"
                    value={formData.target}
                    onChange={handleChange}
                    placeholder="₹ 0.00"
                    className="w-full p-2 bg-gray-700/50 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 text-xs mb-1">
                    Stop Loss *
                  </label>
                  <input
                    type="number"
                    name="sl"
                    value={formData.sl}
                    onChange={handleChange}
                    placeholder="₹ 0.00"
                    className="w-full p-2 bg-gray-700/50 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-xs mb-1">
                    Strategy Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="₹ 0.00"
                    className="w-full p-2 bg-gray-700/50 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border-none text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-1.5 bg-gray-700 text-sm text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStrategy}
                  className="w-full sm:w-auto px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-sm text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Add Strategy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTesterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800/95 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Strategy Tester
              </h2>
              <button
                onClick={() => setShowTesterModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-xs mb-1">
                  Select Strategy
                </label>
                <select
                  value={testerFormData.strategy}
                  onChange={(e) =>
                    setTesterFormData((prev) => ({
                      ...prev,
                      strategy: e.target.value,
                    }))
                  }
                  className="w-full p-2 bg-gray-700/50 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border-none text-sm"
                >
                  <option value="">Select a strategy</option>
                  <option value="S01">S01</option>
                  <option value="S02">S02</option>
                  <option value="S03">S03</option>
                </select>
              </div>

              {testerFormData.strategy && (
                <div>
                  <label className="block text-gray-300 text-xs mb-1">
                    Number of Trades
                  </label>
                  <input
                    type="number"
                    value={testerFormData.numberOfTrades}
                    onChange={(e) =>
                      setTesterFormData((prev) => ({
                        ...prev,
                        numberOfTrades: e.target.value,
                      }))
                    }
                    placeholder="Enter number of trades"
                    className="w-full p-2 bg-gray-700/50 text-white rounded-lg focus:ring-1 focus:ring-blue-500 border-none text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleStrategyTest}
                  disabled={
                    isTesting ||
                    !testerFormData.strategy ||
                    !testerFormData.numberOfTrades
                  }
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Testing...
                    </>
                  ) : (
                    "Execute"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
