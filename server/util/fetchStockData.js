import axios from "axios";
// @ts-ignore
import * as UpstoxClient from "upstox-js-sdk";
import { format, isSameDay } from "date-fns";
import fetchInstrumentDetails from "./fetchInstrumentDetails.js";

const STOCK_BASE_PRICES = {
  RELIANCE: 1310.5,
  TATASTEEL: 189.95,
  TCS: 4150.0,
  INFY: 1855.2,
  HDFCBANK: 1725.0,
  ICICIBANK: 1240.0,
  TATAMOTORS: 820.0,
  SBIN: 810.0,
  BHARTIARTL: 1650.0,
  TATACHEM: 1045.0,
};

export const generateFallbackCandles = (symbol) => {
  const basePrice = STOCK_BASE_PRICES[symbol.toUpperCase()] || 500.0;
  const candles = [];
  const now = new Date();
  let currentPrice = basePrice;

  for (let i = 60; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 1000).toISOString();
    const delta = (Math.random() - 0.49) * (basePrice * 0.003);
    const open = Number(currentPrice.toFixed(2));
    const close = Number(Math.max(1, open + delta).toFixed(2));
    const high = Number((Math.max(open, close) + Math.random() * (basePrice * 0.001)).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * (basePrice * 0.001)).toFixed(2));
    const volume = Math.floor(Math.random() * 5000) + 500;

    candles.push([time, open, high, low, close, volume]);
    currentPrice = close;
  }

  return {
    status: "success",
    data: {
      candles,
    },
  };
};

// *****************************************************************
// Helper: Fetch UPSTOX Data | INTRADAY Data (with fallback)
// *****************************************************************
export const fetchUpstoxData = async (symbol) => {
  try {
    const instrument = await fetchInstrumentDetails(symbol);
    if (!instrument) {
      return generateFallbackCandles(symbol);
    }

    const interval = "1minute";
    const instrumentKey = instrument.instrument_key;

    return await new Promise((resolve) => {
      let apiInstance = new UpstoxClient.HistoryApi();
      let apiVersion = "2.0";
      apiInstance.getIntraDayCandleData(
        instrumentKey,
        interval,
        apiVersion,
        (error, data) => {
          if (error || !data || !data.data || !data.data.candles) {
            resolve(generateFallbackCandles(symbol));
          } else {
            resolve(data);
          }
        }
      );
    });
  } catch (error) {
    return generateFallbackCandles(symbol);
  }
};

// *****************************************************************
// Helper: Get Historical Data By Date (with fallback)
// *****************************************************************
export const getLastMarketData = async ({
  symbol,
  toDate,
  fromDate,
  interval = "1minute",
}) => {
  try {
    const instrument = await fetchInstrumentDetails(symbol);
    if (!instrument) {
      return generateFallbackCandles(symbol);
    }
    const instrumentKey = instrument.instrument_key;
    const apiInstance = new UpstoxClient.HistoryApi();
    const apiVersion = "2.0";

    return await new Promise((resolve) => {
      apiInstance.getHistoricalCandleData1(
        instrumentKey,
        interval,
        toDate,
        fromDate,
        apiVersion,
        (error, data) => {
          if (error || !data || !data.data || !data.data.candles) {
            resolve(generateFallbackCandles(symbol));
          } else {
            resolve(data);
          }
        }
      );
    });
  } catch (error) {
    return generateFallbackCandles(symbol);
  }
};

// *****************************************************************
// Helper: Get Market Status Open / Close
// *****************************************************************
export const getMarketStatus = async () => {
  try {
    const url = `https://www.alphavantage.co/query?function=MARKET_STATUS&apikey=demo`;
    const res = await axios.get(url, { timeout: 3000 });

    if (res.data && Array.isArray(res.data.markets)) {
      const indiaMarketStatus = res.data.markets.filter(
        (market) => market.region === "India"
      );

      if (indiaMarketStatus.length > 0) {
        return indiaMarketStatus[0].current_status;
      }
    }

    const now = new Date();
    if (isWeekend(now)) return "closed";
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes >= 9 * 60 + 15 && totalMinutes <= 15 * 60 + 30 ? "open" : "closed";
  } catch (error) {
    const now = new Date();
    if (isWeekend(now)) return "closed";
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes >= 9 * 60 + 15 && totalMinutes <= 15 * 60 + 30 ? "open" : "closed";
  }
};

// *****************************************************************
// Helper: Check Is It Holiday/Weekday
// *****************************************************************
export const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Format to full date (YYYY-MM-DD / 2022-10-01)
export const formatDate = (date) => {
  let dd = date.getDate();
  let mm = date.getMonth() + 1;
  const yyyy = date.getFullYear();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  return `${yyyy}-${mm}-${dd}`;
};
