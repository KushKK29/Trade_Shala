import { useState } from "react";
import { ChartLineIcon, StarIcon, Search } from "lucide-react";
import HeroSection from "../components/HeroSection";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Card from "../components/Card";
import { motion } from "framer-motion";
import { FaChartLine, FaNewspaper, FaWallet, FaLock } from "react-icons/fa";
import { searchStockData } from "../services/stockService";
import { useNavigate } from "react-router-dom";
import TopGainers from "../components/TopGainers";
import { useTrade } from "../context/context";

const Home = () => {
  const [activeTab, setActiveTab] = useState("indices");
  const [searchTerm, setSearchTerm] = useState("");
  const isLogin = localStorage.getItem("token") ? true : false;
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const settings = {
    dots: false,
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: false,
    speed: 2000,
    autoplaySpeed: 1000,
    cssEase: "linear",
    pauseOnHover: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const cardData = [
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#2962ff] flex items-center justify-center text-white">
          B
        </div>
      ),
      symbol: "BANKNIFTY",
      value: "49,099.45",
      change: -0.53,
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#ff5722] flex items-center justify-center text-white">
          N
        </div>
      ),
      symbol: "NIFTY50",
      value: "22,929.25",
      change: -0.45,
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#4caf50] flex items-center justify-center text-white">
          S
        </div>
      ),
      symbol: "SENSEX",
      value: "75,939.21",
      change: -0.26,
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#9c27b0] flex items-center justify-center text-white">
          D
        </div>
      ),
      symbol: "FINIFTY",
      value: "23,186.90",
      change: -0.37,
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#ffeb3b] flex items-center justify-center text-black">
          N
        </div>
      ),
      symbol: "NIFTY MIDCAP",
      value: "11,090.05",
      change: -2.38,
    },
  ];

  const tabs = [
    { id: "indices", label: "Indices", icon: <ChartLineIcon /> },
    { id: "watchlist", label: "Watchlist", icon: <StarIcon /> },
  ];

  const features = [
    {
      icon: <FaChartLine className="text-3xl" />,
      title: "Real-time Trading",
      description: "Experience live market data and execute trades instantly",
    },
    {
      icon: <FaNewspaper className="text-3xl" />,
      title: "Market News",
      description: "Stay informed with the latest market updates and analysis",
    },
    {
      icon: <FaWallet className="text-3xl" />,
      title: "Portfolio Management",
      description: "Track and manage your investments in one place",
    },
    {
      icon: <FaLock className="text-3xl" />,
      title: "Secure Platform",
      description: "Trade with confidence on our secure platform",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Add this new component for the glitter effect
  const GlitterEffect = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              scale: 0,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, Math.random() * 0.5 + 0.5, 0],
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatDelay: Math.random() * 1,
              ease: "easeInOut",
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              filter: `blur(${Math.random() * 2}px)`,
              boxShadow: `
              0 0 ${Math.random() * 4 + 2}px #fff,
              0 0 ${Math.random() * 8 + 4}px #fff,
              0 0 ${Math.random() * 12 + 8}px rgba(255,255,255,0.5)
            `,
              backgroundColor: `hsl(${Math.random() * 60 + 180}, 100%, 90%)`,
            }}
          />
        ))}
      </div>
    );
  };

  const handleSearch = async (value: string) => {
    setSearchTerm(value);

    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await searchStockData(value);
      setSearchResults(
        Object.entries(response.data).map(([symbol, name]) => ({
          symbol,
          name,
        }))
      );
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockSelect = (symbol: string) => {
    setSearchTerm("");
    setSearchResults([]);
    navigate(`/stock/${symbol}`);
  };

  return (
    <div className="min-h-screen bg-[#131722] text-white">
      {/* Hero Section */}
      {!isLogin && (
        <motion.div>
          <GlitterEffect />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"
            >
              Welcome to Trade-Shala
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto mb-8"
            >
              Your intelligent trading companion for the modern financial
              markets
            </motion.p>
          </motion.div>

          {/* Features Grid with lower z-index */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-0"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="bg-[#1E222D] p-6 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-colors duration-300"
                >
                  <div className="text-green-500 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* Stats Section */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-[#1E222D] py-16 mt-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div whileHover={{ scale: 1.05 }} className="p-6">
              <div className="text-3xl font-bold text-green-500 mb-2">10K+</div>
              <div className="text-gray-400">Active Traders</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="p-6">
              <div className="text-3xl font-bold text-green-500 mb-2">
                $50M+
              </div>
              <div className="text-gray-400">Trading Volume</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="p-6">
              <div className="text-3xl font-bold text-green-500 mb-2">24/7</div>
              <div className="text-gray-400">Support Available</div>
            </motion.div>
          </div>
        </div>
      </motion.div> */}

      {/* CTA Section */}
      {!isLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center py-16 px-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors duration-300"
          >
            Start Trading Now
          </motion.button>
        </motion.div>
      )}

      <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen">
        {isLogin && <HeroSection />}
        {/* ye ab aaya mere paas indices vaa section */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-800 rounded-full p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {activeTab === "indices" && (
            <div className="space-y-6">
              <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-8">
                Market Indices
              </h2>
              <div className="overflow-hidden">
                <Slider {...settings}>
                  {cardData.map((data, index) => (
                    <Card
                      key={index}
                      icon={data.icon}
                      symbol={data.symbol}
                      value={data.value}
                      change={data.change}
                    />
                  ))}
                </Slider>
              </div>
            </div>
          )}

          {activeTab === "watchlist" && (
            <div className="text-center text-gray-400">
              <p>Abhi kuch nahi hai</p>
            </div>
          )}
        </div>

        {/* Market Movers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <TopGainers></TopGainers>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
