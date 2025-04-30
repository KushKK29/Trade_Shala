import mongoose from "mongoose";

// for homepage
const PortfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },// isme home page ke according 1-2 cheeze aur add hongi
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    }, // ye totalValue is the count of total no. of current holdings
    totalValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for common queries
PortfolioSchema.index({ totalValue: -1 }); // For sorting portfolios by value
PortfolioSchema.index({ updatedAt: -1 }); // For finding recently updated portfolios

const NewPortfolio = mongoose.model("NewPortfolio", PortfolioSchema);
export default NewPortfolio;
