import React, { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTrade } from "../context/context";
import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "@/services/API";

const socket = io(SOCKET_BASE_URL);

interface TradingPanelProps {
  currentPrice: number;
  symbol: string;
  onTradeComplete: (orderData: any) => void;
}

type TradeType = "INTRADAY" | "DELIVERY" | "FUTURES" | "OPTIONS";
type OrderType = "MARKET" | "LIMIT" | "SL" | "SL-M";

const TradingPanel: React.FC<TradingPanelProps> = ({
  currentPrice,
  symbol,
  onTradeComplete,
}) => {
  const { addOrder, balance } = useTrade();
  const [tradeType, setTradeType] = useState<TradeType>("INTRADAY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState<number>(1);
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice);
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [triggerPrice, setTriggerPrice] = useState<number | null>(null);

  // For F&O
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [strikePrice, setStrikePrice] = useState<number | null>(null);
  const [optionType, setOptionType] = useState<"CALL" | "PUT">("CALL");

  const totalAmount = currentPrice * quantity;
  const margin = tradeType === "INTRADAY" ? totalAmount * 0.2 : totalAmount;

  const handleTrade = (action: "buy" | "sell") => {
    const orderData = {
      stock_symbol: symbol,
      order_type: orderType.toLowerCase(),
      order_category: tradeType.toLowerCase(),
      type: action,
      quantity,
      execution_price: currentPrice,
      limit_price: orderType === "LIMIT" ? limitPrice : undefined,
      user_id: localStorage.getItem("user_id"),
    };

    socket.emit("placeOrder", orderData);

    socket.on("orderPlaced", (response) => {
      alert(response.message);
      onTradeComplete(response.order);
      resetForm();
    });

    socket.on("error", (error) => {
      alert(error);
    });
  };

  const resetForm = () => {
    setQuantity(1);
    setLimitPrice(currentPrice);
    setStopLoss(null);
    setTarget(null);
    setTriggerPrice(null);
  };

  return (
    <motion.div
      className="p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-white">Place Order</h2>

      <div className="space-y-4">
        {/* Trade Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-400">
            Trade Type
          </label>
          <select
            className="mt-1 block w-full rounded-md bg-[#262932] text-white border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={tradeType}
            onChange={(e) => setTradeType(e.target.value as TradeType)}
          >
            <option value="INTRADAY">Intraday</option>
            <option value="DELIVERY">Delivery</option>
            <option value="FUTURES">Futures</option>
            <option value="OPTIONS">Options</option>
          </select>
        </div>

        {/* Order Type */}
        <div>
          <label className="block text-sm font-medium text-gray-400">
            Order Type
          </label>
          <select
            className="mt-1 block w-full rounded-md bg-[#262932] text-white border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as OrderType)}
          >
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
            <option value="SL">Stop Loss</option>
            <option value="SL-M">Stop Loss Market</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-400">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 block w-full rounded-md bg-[#262932] text-white border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Price Fields */}
        {orderType !== "MARKET" && (
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Limit Price
            </label>
            <input
              type="number"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(Number(e.target.value))}
              className="mt-1 block w-full rounded-md bg-[#262932] text-white border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Stop Loss & Target */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Stop Loss
            </label>
            <input
              type="number"
              step="0.01"
              value={stopLoss || ""}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="mt-1 block w-full rounded-md bg-[#262932] text-white border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Target
            </label>
            <input
              type="number"
              step="0.01"
              value={target || ""}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="mt-1 block w-full rounded-md bg-[#262932] text-white border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* F&O Specific Fields */}
        {tradeType === "OPTIONS" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-[#262932] text-white border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">
                  Strike Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={strikePrice || ""}
                  onChange={(e) => setStrikePrice(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-[#262932] text-white border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">
                Option Type
              </label>
              <select
                className="mt-1 block w-full rounded-md bg-[#262932] text-white border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={optionType}
                onChange={(e) =>
                  setOptionType(e.target.value as "CALL" | "PUT")
                }
              >
                <option value="CALL">Call</option>
                <option value="PUT">Put</option>
              </select>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => handleTrade("buy")}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <TrendingUp size={20} />
            Buy
          </button>
          <button
            onClick={() => handleTrade("sell")}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <TrendingDown size={20} />
            Sell
          </button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Order Value:</span>
            <span className="text-white">₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Required Margin:</span>
            <span className="text-white">₹{margin.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Available Balance:</span>
            <span className="text-white">₹{balance.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TradingPanel;
