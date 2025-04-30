import express from "express";
import {
  stockData,
  HistoricalData,
  stockSearch,
} from "../controllers/Stocks.Controller.js";

const router = express.Router();

// Intraday data route
router.get("/intraday/:symbol", stockData);

// Historical data route
router.get(
  "/historical-candle/:symbol/:interval/:toDate/:fromDate",
  HistoricalData
);

// Search route
router.get("/search", stockSearch);

export default router;
