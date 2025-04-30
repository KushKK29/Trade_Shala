import mongoose, { mongo } from "mongoose";

// Destructure Schema from mongoose
// const { Schema } = mongoose;

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stockId: {
      type: mongoose.Types.ObjectId,
      ref: "Stock",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["completed", "failed"],
      required: true,
      default: "completed",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure totalPrice is quantity * pricePerUnit
TransactionSchema.pre("save", function (next) {
  this.totalPrice = this.quantity * this.pricePerUnit;
  next();
});

// Create compound indexes for common queries
TransactionSchema.index({ userId: 1, status: 1 });
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ stockId: 1, date: -1 });
TransactionSchema.index({ type: 1, status: 1 });

const Transaction = mongoose.model("Transaction", TransactionSchema);

export default Transaction;
