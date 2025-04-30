import express from "express";
import { buyStock, sellStock } from "../controllers/BuyNSell.Controller.js";

const router = express.Router();

// Route to buy a stock
router.post("/buy", buyStock);

// Route to sell a stock
router.post("/sell", sellStock);

export default router;
