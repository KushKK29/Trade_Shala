import fs from "fs";
import path from "path";
import csv from "csv-parser";
import {
  formatDate,
  fetchUpstoxData,
  getMarketStatus,
  getLastMarketData,
} from "../util/fetchStockData.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory name from the current module's URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// *****************************************************************
// Get Stock Data | Real-Time
// *****************************************************************
export const stockData = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    // Get market status open / close
    const marketStatus = await getMarketStatus();
    // Get data when market is open
    const data = await fetchUpstoxData(symbol);

    if (data?.data?.candles?.length > 0) {
      return res.status(200).json({
        data: data.data,
        type: marketStatus === "closed" ? "closed_intraday" : "open_intraday",
        marketStatus,
      });
    }

    // No intraday candles yet (market just opened, holiday, or weekend):
    // fall back to the last 7 days so the client never renders price 0.00.
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const historyData = await getLastMarketData({
      symbol,
      toDate: formatDate(today),
      fromDate: formatDate(sevenDaysAgo),
    });
    return res
      .status(200)
      .json({ data: historyData.data, type: "historical", marketStatus });
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// *****************************************************************
// Get Historical Data By Date
// *****************************************************************
export const HistoricalData = async (req, res) => {
  try {
    const marketStatus = await getMarketStatus();
    const { symbol, interval, toDate, fromDate } = req.params;

    // Validate interval
    const validIntervals = ["1minute", "30minute", "day", "week", "month"];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        message:
          "Invalid interval. Must be one of: 1minute, 30minute, day, week, month",
      });
    }

    // Convert symbol to uppercase
    const upperSymbol = symbol.toUpperCase();

    // Fetch the data for the date range with the specified interval
    const historyData = await getLastMarketData({
      symbol: upperSymbol,
      toDate,
      fromDate,
      interval,
    });

    return res.status(200).json({
      data: historyData.data,
      type: "historical",
      marketStatus,
      interval,
    });
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// *****************************************************************
// Get Stock Search Data
// *****************************************************************
export const stockSearch = async (req, res) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).send("symbol is required.");
  }

  const uppercaseSymbol = symbol.toUpperCase();

  // Set the response to stream in chunks
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Transfer-Encoding", "chunked");

  // Using a Readable stream and the csv-parser library
  const stream = fs
    .createReadStream(path.join(__dirname, "..", "util", "NSE.csv"))
    .pipe(csv());

  const symbolResults = new Map();

  stream.on("data", (row) => {
    if (row.tradingsymbol.includes(uppercaseSymbol)) {
      // Extract the main part of the symbol using regex
      const mainSymbol = row.tradingsymbol.match(/^[A-Z]+/)[0];

      if (!symbolResults.has(mainSymbol)) {
        symbolResults.set(mainSymbol, row.name);
      }
    }
  });

  // When the stream ends, end the response.
  stream.on("end", () => {
    if (symbolResults.size === 0) {
      res.status(404).json({ message: "No stocks found" });
    } else {
      const output = Object.fromEntries(symbolResults);
      res.status(200).json(output);
    }
  });

  // Handle any errors from the stream
  stream.on("error", (error) => {
    console.log("🚀 searchStock stream.error", error);
    res.status(500).end();
  });
};
