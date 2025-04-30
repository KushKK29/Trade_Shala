import { motion } from "framer-motion";
import {
  FaUser,
  FaHistory,
  FaRupeeSign,
  FaChartLine,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";
import { useTrade } from "../context/context";
import { useState } from "react";

const Profile = () => {
  const { orders, balance, positions } = useTrade();
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "pending" | "cancelled"
  >("all");
  console.log("Profile orders:", orders); // Debug log

  // Calculate total investment and P&L
  const totalInvestment = Array.from(positions.values()).reduce(
    (total, position) => total + position.quantity * position.averagePrice,
    0
  );

  // Filter orders based on status
  const filteredOrders = orders.filter((order) =>
    filterStatus === "all" ? true : order.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-[#131722] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E222D] p-8 rounded-2xl shadow-lg border border-gray-800"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <FaUser className="text-5xl text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-[#1E222D]"></div>
            </div>
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-bold text-white mb-2">John Doe</h1>
              <p className="text-gray-400 mb-4">john.doe@example.com</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-[#262932] px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-blue-400" />
                    <span className="text-gray-400">Member since</span>
                  </div>
                  <p className="text-white font-semibold">March 2024</p>
                </div>
                <div className="bg-[#262932] px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-purple-400" />
                    <span className="text-gray-400">Last Login</span>
                  </div>
                  <p className="text-white font-semibold">Today, 10:30 AM</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#1E222D] p-6 rounded-2xl shadow-lg border border-gray-800">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Available Balance</span>
                    <FaRupeeSign className="text-green-500 text-xl" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ₹{balance.toFixed(2)}
                  </p>
                  <p className="text-green-500 text-sm mt-2">
                    Available for trading
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Total Investments</span>
                    <FaChartLine className="text-purple-500 text-xl" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ₹{totalInvestment.toFixed(2)}
                  </p>
                  <p className="text-purple-500 text-sm mt-2">
                    {positions.size} active positions
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order History Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-[#1E222D] p-6 rounded-2xl shadow-lg border border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FaHistory className="text-2xl text-blue-500 mr-2" />
                <h2 className="text-xl font-bold text-white">Order History</h2>
              </div>
              <select
                className="bg-[#262932] text-gray-400 px-4 py-2 rounded-lg border border-gray-700"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Orders</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="py-4 text-left">Type</th>
                    <th className="py-4 text-left">Symbol</th>
                    <th className="py-4 text-left">Date</th>
                    <th className="py-4 text-right">Quantity</th>
                    <th className="py-4 text-right">Price</th>
                    <th className="py-4 text-right">Total</th>
                    <th className="py-4 text-right">P&L</th>
                    <th className="py-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-800 hover:bg-[#262932] transition-colors duration-200"
                    >
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.action === "buy"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {order.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-white font-medium">
                        {order.symbol}
                      </td>
                      <td className="py-4 text-gray-400">
                        {new Date(order.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 text-right text-white">
                        {order.quantity}
                      </td>
                      <td className="py-4 text-right text-white">
                        ₹{order.price.toFixed(2)}
                      </td>
                      <td className="py-4 text-right text-white">
                        ₹{order.total.toFixed(2)}
                      </td>
                      <td className="py-4 text-right">
                        <span
                          className={
                            order.pnl >= 0 ? "text-green-500" : "text-red-500"
                          }
                        >
                          ₹{order.pnl.toFixed(2)}
                          <span className="text-sm ml-1">
                            ({((order.pnl / order.total) * 100).toFixed(2)}%)
                          </span>
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === "completed"
                              ? "bg-green-500/20 text-green-500"
                              : order.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
