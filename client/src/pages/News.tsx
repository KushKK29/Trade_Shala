import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaNewspaper,
  FaExternalLinkAlt,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { Client } from "@gradio/client";

interface NewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  related: string;
  source: string;
  summary: string;
  url: string;
}

interface Sentiment {
  signal: string;
  analysis: any[][];
  newsCount: number;
}

// Add interface for news data
interface NewsData {
  data: {
    headers: string[];
    data: string[][];
    metadata: any;
  }[];
}

// Add type for the prediction result
interface PredictionResult {
  data: string[];
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(
          "https://finnhub.io/api/v1/news?category=general&token=cufk499r01qno7m5ve60cufk499r01qno7m5ve6g"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }

        const data = await response.json();
        setNews(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to load news. Please try again later.");
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const analyzeSentiment = async (symbol: string) => {
    setAnalyzing(true);
    setSentiment(null);
    try {
      const client = await Client.connect("dami1996/trading-analyst");

      const result = (await client.predict("/analyze_asset_sentiment", [
        symbol,
      ])) as NewsData; // Type assertion for result

      // Parse the response data
      const newsData = result.data[0].data;

      // Count sentiments for signal
      const sentiments = newsData.map((item: string[]) =>
        item[0].toLowerCase()
      );
      const positiveCount = sentiments.filter((s) =>
        s.includes("positive")
      ).length;
      const negativeCount = sentiments.filter((s) =>
        s.includes("negative")
      ).length;

      const signal =
        positiveCount > negativeCount
          ? "BUY"
          : negativeCount > positiveCount
          ? "SELL"
          : "NEUTRAL";

      setSentiment({
        signal,
        analysis: newsData,
        newsCount: newsData.length,
      });
    } catch (err: any) {
      console.error("Error analyzing:", err);
      setError(
        `Failed to analyze ${symbol}. Please try again. Error: ${err.message}`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper function to get sentiment color
  const getSentimentColor = (sentiment: string) => {
    if (sentiment.includes("positive")) return "bg-green-500";
    if (sentiment.includes("negative")) return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1218] via-[#131722] to-[#1a1f2c] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <FaNewspaper className="text-4xl text-green-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">Market News</h1>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="ml-4 text-green-500 hover:text-green-400"
            >
              <FaSearch className="text-2xl" />
            </button>
          </div>

          {showSearch && (
            <div className="mt-4">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Enter stock symbol..."
                className="px-4 py-2 rounded-lg bg-[#1E222D] border border-green-500/20 text-white"
              />
              <button
                onClick={() => analyzeSentiment(symbol)}
                disabled={analyzing}
                className="ml-2 px-4 py-2 bg-green-500 text-white rounded-lg"
              >
                {analyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          )}

          {sentiment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-[#1E222D] rounded-lg relative"
            >
              <button
                onClick={() => setSentiment(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>

              <div className="text-xl font-bold text-white mb-4">
                Signal:{" "}
                <span
                  className={
                    sentiment.signal === "BUY"
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {sentiment.signal}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Sentiment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {sentiment.analysis.map((item: any[], index: number) => {
                      const [sentimentText, title, description, date] = item;
                      const cleanSentiment = sentimentText.replace(
                        /<[^>]*>/g,
                        ""
                      );
                      const cleanTitle = title.replace(/<[^>]*>/g, "");

                      return (
                        <tr key={index} className="hover:bg-gray-800/50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-white text-sm ${getSentimentColor(
                                cleanSentiment
                              )}`}
                            >
                              {cleanSentiment}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-white">
                              {cleanTitle}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-400">
                              {description}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                            {date}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-[#1E222D] rounded-xl overflow-hidden border border-green-500/20 hover:border-green-500/40 transition-colors duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-semibold text-white mb-3 flex-1">
                    {item.headline}
                  </h2>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 ml-4"
                  >
                    <FaExternalLinkAlt />
                  </a>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-400">
                    {new Date(item.datetime * 1000).toLocaleString()}
                  </span>
                  <span className="text-sm px-3 py-1 bg-green-500/10 text-green-500 rounded-full">
                    {item.category || "Market News"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Loading State */}
        {loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="animate-pulse text-gray-400">
              Loading market news...
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default News;
