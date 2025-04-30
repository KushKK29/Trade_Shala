import React, { useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import CurrentPositions from "./CurrentPositions";
import { fetchOrders, fetchPortfolios } from "@/services/stockService";

const HeroSection = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user_id = localStorage.getItem("user_id");
        const response = await fetchPortfolios(user_id);
        console.log(response)
        setOrders(response.data[0]?.holdings);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0b0d] overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-[#131722] to-purple-900/20" />

      <div className="relative container mx-auto px-4 pt-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Portfolio Summary */}
          <div className="w-full lg:w-1/2 xl:w-5/12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Welcome back,
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Here's your portfolio overview for today
              </p>
            </motion.div>

            {/* Portfolio Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-xl bg-[#1a1c25]/50 backdrop-blur-sm border border-gray-700/30 transition-all duration-300 hover:border-blue-500/50"
              >
                <h3 className="text-gray-400 mb-2">Total Portfolio Value</h3>
                <p className="text-3xl font-bold text-white">₹124,500.00</p>
                <span className="text-green-500 text-sm flex items-center mt-2">
                  +2.5% <TrendingUp className="w-4 h-4 ml-1" />
                </span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-xl bg-[#1a1c25]/50 backdrop-blur-sm border border-gray-700/30 transition-all duration-300 hover:border-green-500/50"
              >
                <h3 className="text-gray-400 mb-2">Today's P&L</h3>
                <p className="text-3xl font-bold text-green-500">+₹3,240.00</p>
                <span className="text-gray-400 text-sm mt-2 block">
                  Updated 5 min ago
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side - Current Positions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 xl:w-7/12 lg:pl-8 lg:border-l lg:border-gray-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Current Positions
              </h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-gray-400">Auto-refresh</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#1a1c25]/50 backdrop-blur-sm rounded-xl border border-gray-700/30 p-6"
            >
              {loading ? (
                <p className="text-gray-400">Loading positions...</p>
              ) : (
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                  <CurrentPositions
                    positions={orders}
                    onClosePosition={(id) => {
                      setOrders((prev) =>
                        prev.filter((order: any) => order._id !== id)
                      );
                      return Promise.resolve();
                    }}
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
