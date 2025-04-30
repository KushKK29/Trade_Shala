import { useState, useEffect } from "react";
import { Clock, ArrowUpDown, TrendingUp, TrendingDown, X } from "lucide-react";
import StockChart from "../components/StockChart";
import TradingPanel from "../components/TradingPanel";
import StockSkeleton from "../components/StockSkeleton";
import {
  fetchPortfolios,
  fetchStockData,
  searchStockData,
} from "../services/stockService";
import { useParams, useNavigate } from "react-router-dom";
import { StockName } from "../types/types";
import { io } from "socket.io-client";
import dayjs from "dayjs";
import Modal from "react-modal";
import { toast } from "sonner";
import { TechnicalAnalysis } from "react-ts-tradingview-widgets";
import { SOCKET_BASE_URL } from "@/services/API";

// Add interface for historical data parameters
interface HistoricalDataParams {
  interval: string;
  fromDate: string;
  toDate: string;
}

// Add time range mapping
const timeRangeConfig: { [key: string]: HistoricalDataParams } = {
  "1D": {
    interval: "1minute",
    fromDate: formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    toDate: formatDate(new Date()),
  },
  "1W": {
    interval: "30minute",
    fromDate: formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    toDate: formatDate(new Date()),
  },
  "1M": {
    interval: "day",
    fromDate: formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    toDate: formatDate(new Date()),
  },
  "3M": {
    interval: "day",
    fromDate: formatDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
    toDate: formatDate(new Date()),
  },
  "1Y": {
    interval: "week",
    fromDate: formatDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)),
    toDate: formatDate(new Date()),
  },
};

// Helper function to format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

const transformCandleData = (data: any) => {
  if (!data?.candles) return [];

  return data.candles
    .map((candle: any[]) => ({
      time: candle[0],
      price: candle[4], // Using close price
      volume: candle[5],
      // Add OHLC data for candlestick chart if needed
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
    }))
    .reverse();
};

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number; // Mocked for now
  pnl: number;
  pnlPercentage: number;
  tradeType: "buy" | "sell";
  type: "INTRADAY" | "DELIVERY";
}

const socket = io(SOCKET_BASE_URL);

function Stock() {
  const { stockName } = useParams<{ stockName: any }>();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<string>("1D");
  const [stockData, setStockData] = useState<any[]>([]);
  const [marketStatus, setMarketStatus] = useState<string>("closed");
  const [stockNameData, setStockNameData] = useState<StockName>({
    shortName: "",
    fullName: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [positions, setPositions] = useState<Position[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [isTechnicalAnalysisOpen, setIsTechnicalAnalysisOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!stockName) return;

      setIsLoading(true);
      try {
        // For initial load, fetch intraday data
        const response = await fetchStockData(`intraday/${stockName}`);
        console.log("Initial fetch response:", response); // Debug log
        const transformedData = transformCandleData(response.data.data);
        setStockData(transformedData);
        setMarketStatus(response.data.marketStatus);
      } catch (error) {
        console.error("Error fetching stock data:", error);
        toast.error("Failed to fetch stock data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [stockName]);

  // New useEffect to fetch stock name
  useEffect(() => {
    const fetchStockNameData = async () => {
      try {
        const response = await searchStockData(stockName);
        const shortName = Object.keys(response.data)[0];
        const fullName = response.data[shortName];
        setStockNameData({
          shortName,
          fullName,
        });
      } catch (error) {
        console.error("Error fetching stock name:", error);
      }
    };

    fetchStockNameData();
  }, [stockName]);

  // Establish a WebSocket connection to listen to stock price updates
  useEffect(() => {
    const socket = io(SOCKET_BASE_URL); // WebSocket connection

    // Handle market status updates
    socket.on("marketStatusChange", (status: string) => {
      console.log(status);
    });

    socket.emit("selectSymbol", stockName);

    socket.on("symbolData", (newData) => {
      if (newData && newData.type === "live_feed") {
        // Extract the dynamic stock key
        const stockKey = Object.keys(newData.feeds || {})[0];

        if (!stockKey) {
          console.log("No valid stock key found");
          return;
        }

        console.log(newData);

        const ohlcData =
          newData.feeds[stockKey]?.ff?.marketFF?.marketOHLC?.ohlc;

        console.log("OHLC Data:", ohlcData);

        if (!ohlcData) {
          console.log("No OHLC data found");
          return;
        }

        // Filter for daily interval data
        const filteredData = ohlcData.filter(
          (data: any) => data.interval === "1d"
        );

        if (filteredData.length === 0) {
          console.log("No matching 1d interval data");
          return;
        }

        // Transform data
        const transformedData = filteredData.map((data: any) => ({
          time: dayjs(data.time).format("YYYY-MM-DDTHH:mm:ssZ"),
          price: data.close,
          volume: data.volume,
        }));

        console.log("Transformed Data:", transformedData);

        // Merge and remove duplicates using a Map
        setStockData((prevData) => {
          const mergedData = [...prevData, ...transformedData];

          const uniqueData = Array.from(
            new Map(mergedData.map((item) => [item.time, item])).values()
          );

          // Sort data by timestamp
          return uniqueData.sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [stockName]);

  console.log(stockData);

  const currentPrice =
    stockData.length > 0 ? stockData[stockData.length - 1].price : 0;
  const previousPrice =
    stockData.length > 1 ? stockData[stockData.length - 2].price : currentPrice;

  const priceChange = currentPrice - stockData[0]?.price.toFixed(2); ///yaha thik karna hai
  const priceChangePercent = previousPrice
    ? (priceChange / previousPrice) * 100
    : 0;

  const handleTimeRangeChange = async (range: string) => {
    setTimeRange(range);
    setIsLoading(true);
    try {
      let response;
      if (range === "1D") {
        response = await fetchStockData(`intraday/${stockName}`);
      } else {
        const { interval, fromDate, toDate } = timeRangeConfig[range];
        const path = `historical-candle/${stockName}/${interval}/${toDate}/${fromDate}`;
        console.log("Fetching path:", path); // Debug log
        response = await fetchStockData(path);
      }

      console.log("Time range response:", response); // Debug log
      const transformedData = transformCandleData(response.data.data);
      setStockData(transformedData);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast.error("Failed to fetch data for selected time range");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for new trades
  const handleNewTrade = (orderData: any) => {
    console.log("New trade:", orderData);
    fetchPositions();
    // const { symbol, quantity, price, tradeType, type } = orderData;
    // const newPosition: Position = {
    //   id: Date.now().toString(),
    //   symbol,
    //   quantity: Number(quantity),
    //   avgPrice: Number(price),
    //   currentPrice: Number(price),
    //   pnl: 0, // Will be calculated in real-time
    //   pnlPercentage: 0,
    //   type: type || "INTRADAY",
    //   tradeType,
    //   timestamp: new Date().toISOString(),
    // };
    // setPositions((prevPositions) => {
    //   // For buy orders, check and update existing positions
    //   if (tradeType === "BUY") {
    //     const existingPosition = prevPositions.find(
    //       (p) => p.symbol === symbol && p.tradeType === "BUY"
    //     );
    //     if (existingPosition) {
    //       return prevPositions.map((position) => {
    //         if (position.symbol === symbol && position.tradeType === "BUY") {
    //           const totalQuantity = position.quantity + Number(quantity);
    //           const newAvgPrice =
    //             (position.avgPrice * position.quantity + price * quantity) /
    //             totalQuantity;
    //           return {
    //             ...position,
    //             quantity: totalQuantity,
    //             avgPrice: newAvgPrice,
    //             currentPrice: price,
    //             pnl: (price - newAvgPrice) * totalQuantity,
    //             pnlPercentage: ((price - newAvgPrice) / newAvgPrice) * 100,
    //           };
    //         }
    //         return position;
    //       });
    //     }
    //   }
    //   // For both new BUY positions and all SELL positions, add as new entry
    //   return [...prevPositions, newPosition];
    // });
  };

  // Update P&L when price changes
  // yaha buy or sell logic likhna hai
  useEffect(() => {
    if (currentPrice > 0) {
      setPositions((prevPositions) =>
        prevPositions.map((position) => {
          const pnl =
            position.tradeType === "buy"
              ? (currentPrice - position.avgPrice) * position.quantity
              : (position.avgPrice - currentPrice) * position.quantity;
          const pnlPercentage =
            (pnl / (position.avgPrice * position.quantity)) * 100;

          return {
            ...position,
            currentPrice,
            pnl,
            pnlPercentage,
          };
        })
      );
    }
  }, [currentPrice]);

  // const handleClosePosition = (position: Position) => {
  //   setSelectedPosition(position);
  //   setModalIsOpen(true);
  // };

  const confirmClosePosition = () => {
    if (selectedPosition) {
      setPositions((prevPositions) =>
        prevPositions.filter((position) => position.id !== selectedPosition.id)
      );

      if (selectedPosition.pnl >= 0) {
        toast.success(
          `Position closed with profit of ₹${Math.abs(
            selectedPosition.pnl
          ).toFixed(2)}`,
          {
            style: { background: "#064e3b", color: "white" },
          }
        );
      } else {
        toast.error(
          `Position closed with loss of ₹${Math.abs(
            selectedPosition.pnl
          ).toFixed(2)}`,
          {
            style: { background: "#7f1d1d", color: "white" },
          }
        );
      }

      setSelectedPosition(null);
      setModalIsOpen(false);
    }
  };

  const openTechnicalAnalysis = () => {
    setIsTechnicalAnalysisOpen(true);
  };

  const fetchPositions = async () => {
    try {
      const user_id = localStorage.getItem("user_id");
      const response = await fetchPortfolios(user_id || "");
      console.log(response);
      const data = response.data;

      const formattedPositions: Position[] = data.flatMap((item: any) =>
        item.holdings
          .filter((stock: any) => stock.stock_symbol === stockName)
          .map((holding: any) => {
            const pnl =
              holding.trade_type === "buy"
                ? (currentPrice - holding.average_price) * holding.quantity
                : (holding.average_price - currentPrice) * holding.quantity; // For sell trade_type

            return {
              id: holding._id,
              symbol: holding.stock_symbol,
              quantity: holding.quantity,
              avgPrice: holding.average_price,
              currentPrice,
              pnl,
              pnlPercentage:
                (pnl / (holding.average_price * holding.quantity)) * 100,
              tradeType: holding.trade_type,
              type: holding.trade_category,
            };
          })
      );

      setPositions(formattedPositions);
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [stockName]);

  const handleClosePosition = (position: any) => {
    console.log(position);
    const orderData = {
      stock_symbol: stockName,
      trade_type: position.tradeType,
      quantity: position.quantity,
      completion_price: currentPrice,
      user_id: localStorage.getItem("user_id"),
    };

    socket.emit("completeOrder", orderData);

    socket.on("completeOrder", (response) => {
      alert(response.message);
    });

    socket.on("error", (error) => {
      alert(error);
    });
  };

  if (isLoading) {
    return <StockSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#131722]">
      <header className="bg-[#1E222D] shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <ArrowUpDown className="h-8 w-8 text-blue-500" />
              <h1 className="ml-2 text-2xl font-bold text-white">
                StockTrader Pro
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="h-5 w-5 text-gray-400" />
              <span
                className={`${
                  marketStatus === "open" ? "text-green-400" : "text-red-400"
                }`}
              >
                Market {marketStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1E222D] p-6 rounded-lg shadow-lg border border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {stockNameData.shortName}
                  </h2>
                  <p className="text-gray-400">{stockNameData.fullName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate(`/technical-analysis/${stockName}`)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-md flex items-center gap-2 text-white"
                  >
                    Sentiment
                  </button>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">
                      ₹{currentPrice.toFixed(2)}
                    </p>
                    <p
                      className={`${
                        priceChange >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {priceChange >= 0 ? "+" : ""}
                      {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}
                      %)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex space-x-2">
                  {["1D", "1W", "1M", "3M", "1Y"].map((range) => (
                    <button
                      key={range}
                      onClick={() => handleTimeRangeChange(range)}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        timeRange === range
                          ? "bg-blue-500 text-white"
                          : "bg-[#262B3D] text-gray-300 hover:bg-[#2A2F44]"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <StockChart
                data={[...stockData].sort((a, b) => a.time - b.time)}
                timeRange={timeRange}
              />
            </div>

            <div className="space-y-6">
              <div className="bg-[#1E222D] p-6 rounded-lg shadow-lg border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">
                  Key Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400">Open</p>
                    <p className="font-bold text-white">
                      ₹{stockData[0]?.price.toFixed(2) || "0.00"}
                      {/* yha se uthana hai mereko */}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">High</p>
                    <p className="font-bold text-white">
                      ₹{Math.max(...stockData.map((d) => d.price)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Low</p>
                    <p className="font-bold text-white">
                      ₹{Math.min(...stockData.map((d) => d.price)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Volume</p>
                    <p className="font-bold text-white">
                      {(
                        (stockData[stockData.length - 1]?.volume || 0) / 1000
                      ).toFixed(1)}
                      K
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1E222D] p-6 rounded-lg shadow-lg border border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Current Positions
                  </h3>
                  <span className="text-sm text-gray-400">
                    Total P&L:
                    <span
                      className={`ml-2 font-semibold ${
                        positions.reduce((total, pos) => total + pos.pnl, 0) >=
                        0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      ₹
                      {positions
                        .reduce((total, pos) => total + pos.pnl, 0)
                        .toFixed(2)}
                    </span>
                  </span>
                </div>

                <div className="space-y-4">
                  {positions.map((position) => (
                    <div
                      key={position.id}
                      className="bg-[#262B3D] rounded-lg p-4 hover:bg-[#2A2F44] transition-colors relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center">
                            <h4 className="text-white font-semibold">
                              {position.symbol}
                            </h4>
                            <span
                              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                position.tradeType === "buy"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {position.tradeType}
                            </span>
                            <span
                              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                position.type === "INTRADAY"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-purple-500/20 text-purple-400"
                              }`}
                            >
                              {position.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Qty: {position.quantity} | Avg: ₹
                            {position.avgPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">
                            ₹{position.currentPrice.toFixed(2)}
                          </p>
                          <p
                            className={`text-sm flex items-center justify-end ${
                              position.pnl >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {position.pnl >= 0 ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            {position.pnl >= 0 ? "+" : ""}₹
                            {Math.abs(position.pnl).toFixed(2)} (
                            {position.pnlPercentage.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleClosePosition(position)}
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-500/20 transition-all"
                        title="Close Position"
                      >
                        <X className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1E222D] rounded-lg shadow-lg border border-gray-800">
            <TradingPanel
              currentPrice={currentPrice}
              symbol={stockName}
              onTradeComplete={handleNewTrade}
            />
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Confirm Close Position"
        className="bg-[#1E222D] text-white rounded-lg shadow-lg p-6 max-w-md mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-[#131722] bg-opacity-80 flex items-center justify-center"
      >
        <h2 className="text-xl font-bold mb-4">Confirm Close Position</h2>
        <p className="mb-4">Are you sure you want to close this position?</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setModalIsOpen(false)}
            className="px-4 py-2 bg-[#262B3D] text-white rounded-md hover:bg-[#2A2F44]"
          >
            No
          </button>
          <button
            onClick={confirmClosePosition}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Yes
          </button>
        </div>
      </Modal>

      {/* Technical Analysis Modal */}
      <Modal
        isOpen={isTechnicalAnalysisOpen}
        onRequestClose={() => setIsTechnicalAnalysisOpen(false)}
        contentLabel="Technical Analysis"
        className="bg-[#1E222D] text-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto mt-20 z-auto"
        overlayClassName="fixed inset-0 bg-[#131722] bg-opacity-80 flex items-center justify-center"
      >
        <h2 className="text-xl font-bold mb-4">Technical Analysis</h2>
        <TechnicalAnalysis
          symbol={stockName}
          colorTheme="dark"
          width="100%"
          height={400}
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setIsTechnicalAnalysisOpen(false)}
            className="px-4 py-2 bg-[#262B3D] text-white rounded-md hover:bg-[#2A2F44]"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Stock;
