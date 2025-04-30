import { motion } from "framer-motion";
import { useTrade } from "../context/context";
import { TrendingUp, TrendingDown } from "lucide-react";
import { fetchStockData } from "../services/stockService";
import { useEffect, useState } from "react";

interface PositionData {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  investment: number;
  currentValue: number;
  type: "long" | "short";
}

const Positions = () => {
  const { positions } = useTrade();
  const [positionsData, setPositionsData] = useState<PositionData[]>([]);

  useEffect(() => {
    const fetchPositionsData = async () => {
      const positionsArray: PositionData[] = [];

      for (const [symbol, position] of positions.entries()) {
        try {
          const response = await fetchStockData(symbol);
          const currentPrice = response.data.data.candles[0][4];
          const investment = Math.abs(
            position.quantity * position.averagePrice
          );
          const currentValue = Math.abs(position.quantity * currentPrice);
          const type = position.quantity > 0 ? "long" : "short";

          // Calculate P&L based on position type
          const pnl =
            type === "long"
              ? (currentPrice - position.averagePrice) *
                Math.abs(position.quantity)
              : (position.averagePrice - currentPrice) *
                Math.abs(position.quantity);

          const pnlPercentage = (pnl / investment) * 100;

          positionsArray.push({
            symbol,
            quantity: Math.abs(position.quantity),
            averagePrice: position.averagePrice,
            currentPrice,
            pnl,
            pnlPercentage,
            investment,
            currentValue,
            type,
          });
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
        }
      }

      setPositionsData(positionsArray);
    };

    fetchPositionsData();
    const interval = setInterval(fetchPositionsData, 5000);
    return () => clearInterval(interval);
  }, [positions]);

  const totalPnL = positionsData.reduce(
    (sum, position) => sum + position.pnl,
    0
  );
  const totalInvestment = positionsData.reduce(
    (sum, position) => sum + position.investment,
    0
  );
  const totalPnLPercentage = (totalPnL / totalInvestment) * 100;

  return (
    <div className="bg-[#1E222D] rounded-2xl shadow-lg border border-gray-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Current Positions</h2>
        <div
          className={`flex items-center gap-2 ${
            totalPnL >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          <span className="text-lg font-semibold">
            {totalPnL >= 0 ? "+" : ""}₹{totalPnL.toFixed(2)}
          </span>
          <span className="text-sm">
            ({totalPnLPercentage >= 0 ? "+" : ""}
            {totalPnLPercentage.toFixed(2)}%)
          </span>
        </div>
      </div>

      {positionsData.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No open positions</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="py-3 text-left">Type</th>
                <th className="py-3 text-left">Symbol</th>
                <th className="py-3 text-right">Qty</th>
                <th className="py-3 text-right">Avg Price</th>
                <th className="py-3 text-right">Current</th>
                <th className="py-3 text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {positionsData.map((position) => (
                <motion.tr
                  key={position.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-gray-800 hover:bg-[#262932] transition-colors"
                >
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        position.type === "long"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {position.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 text-white font-medium">
                    {position.symbol}
                  </td>
                  <td className="py-4 text-right text-white">
                    {position.quantity}
                  </td>
                  <td className="py-4 text-right text-gray-400">
                    ₹{position.averagePrice.toFixed(2)}
                  </td>
                  <td className="py-4 text-right text-white">
                    ₹{position.currentPrice.toFixed(2)}
                  </td>
                  <td className="py-4 text-right">
                    <div
                      className={`flex items-center justify-end gap-2 ${
                        position.pnl >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {position.pnl >= 0 ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      <span>
                        {position.pnl >= 0 ? "+" : ""}₹{position.pnl.toFixed(2)}
                        <span className="text-sm ml-1">
                          ({position.pnlPercentage >= 0 ? "+" : ""}
                          {position.pnlPercentage.toFixed(2)}%)
                        </span>
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Positions;
