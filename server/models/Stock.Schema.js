import mongoose from "mongoose";

// Define the Stock Schema
const StockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,  // Ensuring each stock symbol is unique
  },
  name: {
    type: String,
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  marketCap: {
    type: Number,
    required: false,
    default: 0,
  },
  sector: {
    type: String,
    required: false,
  },
  industry: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Stock = mongoose.model("Stock", StockSchema);

export default Stock;
