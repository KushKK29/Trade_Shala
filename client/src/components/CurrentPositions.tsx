import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import dayjs from "dayjs";
import { SOCKET_BASE_URL } from "@/services/API";

interface Position {
  _id: string;
  stock_symbol: string;
  order_category: "intraday" | "delivery" | "futures" | "options";
  quantity: number;
  execution_price: number;
  average_price: number;
  current_price: number;
  pnl: number;
  pnlPercentage: number;
  type: "buy" | "sell";
  order_type: "market" | "limit";
  createdAt: string;
  updatedAt: string;
}

interface CurrentPositionsProps {
  positions: Position[];
  onClosePosition: (positionId: string) => Promise<void>;
}

const CurrentPositions: React.FC<CurrentPositionsProps> = ({
  positions,
  onClosePosition,
}) => {
  const [updatedPrices, setUpdatedPrices] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    const socket = io(SOCKET_BASE_URL); // WebSocket connection

    // Handle market status updates
    socket.on("marketStatusChange", (status: string) => {
      console.log(status);
    });

    positions?.forEach((position) => {
      socket.emit("selectSymbol", position.stock_symbol);
    });

    socket.on("symbolData", (newData) => {
      if (newData && newData.type === "live_feed") {
        const stockKey = Object.keys(newData.feeds || {})[0];
        if (!stockKey) return;

        console.log("Full Data:", newData);

        const ohlcData =
          newData.feeds[stockKey]?.ff?.marketFF?.marketOHLC?.ohlc;

        console.log("OHLC Data:", ohlcData);

        if (!ohlcData) return;

        const filteredData = ohlcData.filter(
          (data: any) => data.interval === "1d"
        );

        if (filteredData.length === 0) return;

        const transformedData = filteredData.map((data: any) => ({
          time: dayjs(data.time).format("YYYY-MM-DDTHH:mm:ssZ"),
          price: parseFloat(data.close),
        }));

        console.log("Transformed Data:", transformedData);

        // Set updated prices for each stock
        setUpdatedPrices((prev) => ({
          ...prev,
          [stockKey]:
            transformedData[transformedData.length - 1]?.price ||
            prev[stockKey],
        }));
      }
    });

    console.log(updatedPrices)

    return () => {
      socket.disconnect();
    };
  }, [positions]);

  const handleClosePosition = async (positionId: string) => {
    try {
      await onClosePosition(positionId);
    } catch (error) {
      console.error("Error closing position:", error);
      alert("Failed to close position. Please try again.");
    }
  };

  const totalPnL = positions?.reduce((acc, position) => {
    const currentPrice =
      updatedPrices[position.stock_symbol] || position.current_price;
    const pnl =
      position.type === "buy"
        ? (currentPrice - position.average_price) * position.quantity
        : (position.average_price - currentPrice) * position.quantity;
    return acc + pnl;
  }, 0);

  return (
    <div className="bg-[#1E222D] rounded-lg shadow-lg border border-gray-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Current Positions</h3>
        {positions?.length > 0 && (
          <span
            className={`text-sm font-semibold ${
              totalPnL >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            Total P&L: ₹{totalPnL.toFixed(2)}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {positions?.length > 0 ? (
          positions?.map((position) => {
            const currentPrice =
              updatedPrices[position.stock_symbol] || position.current_price;
            const pnl =
              position.type === "buy"
                ? (currentPrice - position.average_price) * position.quantity
                : (position.average_price - currentPrice) * position.quantity;
            const pnlPercentage =
              (pnl / (position.average_price * position.quantity)) * 100 || 0;
            console.log(currentPrice)

            return (
              <motion.div
                key={position._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#262B3D] rounded-lg p-4 hover:bg-[#2A2F44] transition-colors relative group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-semibold">
                      {position.stock_symbol}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Qty: {position.quantity} | Exec: ₹
                      {position.average_price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleClosePosition(position._id)}
                    className="p-1 rounded-full hover:bg-red-500/20 transition-all"
                    title="Close Position"
                  >
                    <X className="h-4 w-4 text-red-400" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-right">
                    <p className="text-white">₹{currentPrice?.toFixed(2)}</p>
                    <p
                      className={`text-sm flex items-center justify-end ${
                        pnl >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {pnl >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      ₹{Math.abs(pnl).toFixed(2)} ({pnlPercentage.toFixed(2)}%)
                    </p>
                  </div>
                  <div className="col-span-2 mt-2 text-xs text-gray-500">
                    <span>
                      Opened: {new Date(position.createdAt).toLocaleString()}
                    </span>
                    <span className="ml-4">
                      Updated: {new Date(position.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-400">
            No open positions
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentPositions;
