import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchStockData } from "../services/stockService";

interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  isLoading?: boolean;
  error?: boolean;
}

const TopGainers = () => {
  const [activeTab, setActiveTab] = useState<"gainers" | "losers">("gainers");
  const [gainersData, setGainersData] = useState<StockData[]>([]);
  const [losersData, setLosersData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Base stocks to track
  const baseStocks = {
    gainers: [
      { symbol: "TATASTEEL", name: "Tata Steel" },
      { symbol: "RELIANCE", name: "Reliance Industries" },
      { symbol: "HDFCBANK", name: "HDFC Bank" },
      { symbol: "TCS", name: "TCS" },
      { symbol: "WIPRO", name: "Wipro" },
    ],
    losers: [
      { symbol: "INFY", name: "Infosys" },
      { symbol: "BHARTIARTL", name: "Bharti Airtel" },
      { symbol: "SUNPHARMA", name: "Sun Pharma" },
      { symbol: "AXISBANK", name: "Axis Bank" },
      { symbol: "ICICIBANK", name: "ICICI Bank" },
    ],
  };

  const fetchPriceData = async (stocks: any[]) => {
    try {
      const updatedData = await Promise.all(
        stocks.map(async (stock) => {
          try {
            // Use intraday endpoint to fetch stock data
            const response = await fetchStockData(`intraday/${stock.symbol}`);

            if (!response?.data?.data?.candles) {
              console.error(
                `No data available for ${stock.symbol}:`,
                response.data
              );
              return {
                ...stock,
                currentPrice: 0,
                change: 0,
                changePercent: 0,
                error: true,
              };
            }

            const candles = response.data.data.candles;
            if (candles && candles.length > 0) {
              const marketOpenPrice = candles[0][1]; // Open price
              const currentPrice = candles[candles.length - 1][4]; // Current price
              const change = currentPrice - marketOpenPrice;
              const changePercent = (change / marketOpenPrice) * 100;

              return {
                ...stock,
                currentPrice,
                change,
                changePercent,
                error: false,
              };
            }

            throw new Error(`No candle data available for ${stock.symbol}`);
          } catch (error) {
            console.error(`Error processing ${stock.symbol}:`, error);
            return {
              ...stock,
              currentPrice: 0,
              change: 0,
              changePercent: 0,
              error: true,
            };
          }
        })
      );

      return updatedData.sort(
        (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
      );
    } catch (error) {
      console.error("Error in fetchPriceData:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [gainers, losers] = await Promise.all([
          fetchPriceData(baseStocks.gainers),
          fetchPriceData(baseStocks.losers),
        ]);
        setGainersData(gainers);
        setLosersData(losers);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1E222D] rounded-2xl shadow-lg border border-gray-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Market Movers</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("gainers")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === "gainers"
                ? "bg-green-500/20 text-green-500"
                : "text-gray-400 hover:bg-[#262932]"
            }`}
          >
            <TrendingUp size={20} />
            Top Gainers
          </button>
          <button
            onClick={() => setActiveTab("losers")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === "losers"
                ? "bg-red-500/20 text-red-500"
                : "text-gray-400 hover:bg-[#262932]"
            }`}
          >
            <TrendingDown size={20} />
            Top Losers
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="py-3 text-left">Symbol</th>
                <th className="py-3 text-left">Name</th>
                <th className="py-3 text-right">Price</th>
                <th className="py-3 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "gainers" ? gainersData : losersData).map(
                (stock) => (
                  <tr
                    key={stock.symbol}
                    onClick={() => navigate(`/stock/${stock.symbol}`)}
                    className="border-b border-gray-800 hover:bg-[#262932] cursor-pointer"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {stock.changePercent >= 0 ? (
                          <TrendingUp className="text-green-500" size={16} />
                        ) : (
                          <TrendingDown className="text-red-500" size={16} />
                        )}
                        <span className="text-white font-medium">
                          {stock.symbol}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-400">{stock.name}</td>
                    <td className="py-4 text-right text-white">
                      {stock.error
                        ? "---"
                        : `₹${stock.currentPrice.toFixed(2)}`}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={
                          stock.changePercent >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {!stock.error && (
                          <>
                            {stock.changePercent >= 0 ? "+" : ""}₹
                            {stock.change.toFixed(2)} (
                            {stock.changePercent.toFixed(2)}%)
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopGainers;
